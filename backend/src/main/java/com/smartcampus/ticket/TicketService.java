package com.smartcampus.ticket;

import com.smartcampus.notification.Notification;
import com.smartcampus.notification.NotificationService;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    // RestTemplate for calling the Python AI service
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String AI_SERVICE_URL = "http://localhost:8000";

    // ============================================================
    // Helper: notify every ADMIN and every TECHNICIAN in the system
    // ============================================================
    private void notifyAllStaff(String title, String message, Notification.NotificationType type, boolean urgent) {
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        List<User> technicians = userRepository.findByRole(User.Role.TECHNICIAN);

        for (User u : admins) {
            notificationService.sendNotification(u.getEmail(), title, message, type, urgent);
        }
        for (User u : technicians) {
            notificationService.sendNotification(u.getEmail(), title, message, type, urgent);
        }
    }

    // --- CREATE ---
    public Ticket createTicket(TicketRequest request, String reporterEmail) {
        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Ticket ticket = new Ticket();
        ticket.setReporterEmail(reporterEmail);
        ticket.setReporterName(reporter.getName());
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setLocation(request.getLocation());

        if (request.getImageBase64() != null && !request.getImageBase64().isEmpty()) {
            List<String> images = request.getImageBase64().stream().limit(3).toList();
            ticket.setImageBase64(images);

            // --- ML: Analyze the FIRST image for damage assessment ---
            try {
                String firstImage = images.get(0);
                runDamageAssessment(ticket, firstImage);
            } catch (Exception e) {
                System.out.println("ML assessment skipped (AI service unavailable): " + e.getMessage());
            }
        }

        Ticket saved = ticketRepository.save(ticket);

        // ✅ NOTIFICATION: Tell all staff a new ticket has been raised
        notifyAllStaff(
            "🔔 New Ticket Raised",
            reporter.getName() + " reported an issue: \"" + saved.getTitle() + "\" at " + saved.getLocation() + ".",
            Notification.NotificationType.INFO,
            false
        );

        return saved;
    }

    /**
     * Calls the Python AI service to analyze the image and populate ML fields on the ticket.
     */
    @SuppressWarnings("unchecked")
    private void runDamageAssessment(Ticket ticket, String imageBase64) {
        Map<String, String> payload = Map.of(
                "imageBase64", imageBase64,
                "title", ticket.getTitle() != null ? ticket.getTitle() : "",
                "description", ticket.getDescription() != null ? ticket.getDescription() : ""
        );

        Map<String, Object> response = restTemplate.postForObject(
                AI_SERVICE_URL + "/api/analyze-damage",
                payload,
                Map.class
        );

        if (response != null && response.containsKey("assessment")) {
            Map<String, Object> assessment = (Map<String, Object>) response.get("assessment");

            ticket.setMlFaultCategory((String) assessment.get("faultCategory"));
            ticket.setMlSeverity((String) assessment.get("severity"));
            ticket.setMlSummary((String) assessment.get("summary"));
            ticket.setMlAssignedTechnicianRole((String) assessment.get("assignedTechnicianRole"));

            Object priority = assessment.get("priorityLevel");
            if (priority instanceof Integer) {
                ticket.setMlPriorityLevel((Integer) priority);
            } else if (priority instanceof String) {
                ticket.setMlPriorityLevel(Integer.parseInt((String) priority));
            }
        }
    }

    // --- READ: all tickets for admin/technician ---
    public List<Ticket> getAllTickets() {
        List<Ticket> tickets = ticketRepository.findAllByOrderByCreatedAtDesc();
        tickets.forEach(this::refreshSlaBreachFlags);
        return tickets;
    }

    // --- READ: only my tickets ---
    public List<Ticket> getMyTickets(String reporterEmail) {
        List<Ticket> tickets = ticketRepository.findByReporterEmailOrderByCreatedAtDesc(reporterEmail);
        tickets.forEach(this::refreshSlaBreachFlags);
        return tickets;
    }

    // --- READ: single ticket ---
    public Ticket getTicketById(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        refreshSlaBreachFlags(ticket);
        return ticket;
    }

    // --- UPDATE STATUS (admin/technician only) ---
    public Ticket updateStatus(String id, StatusUpdateRequest request) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        try {
            Ticket.TicketStatus newStatus = Ticket.TicketStatus.valueOf(request.getStatus());

            if (newStatus == Ticket.TicketStatus.RESOLVED && ticket.getResolvedAt() == null) {
                ticket.setResolvedAt(Instant.now());
            }

            if (newStatus == Ticket.TicketStatus.OPEN || newStatus == Ticket.TicketStatus.IN_PROGRESS) {
                ticket.setResolvedAt(null);
                ticket.setSlaResolutionBreached(false);
            }

            ticket.setStatus(newStatus);
            ticket.setUpdatedAt(Instant.now());
            refreshSlaBreachFlags(ticket);
            Ticket saved = ticketRepository.save(ticket);

            // ✅ NOTIFICATION: Tell the reporter their ticket status changed
            String statusLabel = newStatus.name().replace("_", " ");
            Notification.NotificationType notifType;
            String emoji;

            switch (newStatus) {
                case RESOLVED -> { notifType = Notification.NotificationType.SUCCESS; emoji = "✅"; }
                case CLOSED   -> { notifType = Notification.NotificationType.SUCCESS; emoji = "🔒"; }
                case IN_PROGRESS -> { notifType = Notification.NotificationType.WARNING; emoji = "🔧"; }
                default       -> { notifType = Notification.NotificationType.INFO;    emoji = "📋"; }
            }

            notificationService.sendNotification(
                ticket.getReporterEmail(),
                emoji + " Ticket Status Updated",
                "Your ticket \"" + ticket.getTitle() + "\" is now " + statusLabel + ".",
                notifType,
                true  // Urgent — the user needs to know immediately
            );

            return saved;

        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value");
        }
    }

    // --- ADD COMMENT ---
    public Ticket addComment(String ticketId, CommentRequest request, String authorEmail, String authorRole) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        TicketComment comment = new TicketComment();
        comment.setAuthorEmail(authorEmail);
        comment.setAuthorName(author.getName());
        comment.setAuthorRole(authorRole);
        comment.setBody(request.getBody());
        comment.setCreatedAt(Instant.now());

        ticket.getComments().add(comment);
        ticket.setUpdatedAt(Instant.now());

        if (ticket.getFirstResponseAt() == null &&
                (authorRole.equals("ADMIN") || authorRole.equals("TECHNICIAN"))) {
            ticket.setFirstResponseAt(Instant.now());
        }

        refreshSlaBreachFlags(ticket);
        Ticket saved = ticketRepository.save(ticket);

        boolean isStaff = authorRole.equals("ADMIN") || authorRole.equals("TECHNICIAN");

        if (isStaff) {
            // ✅ NOTIFICATION: Staff replied → notify the reporter
            // Don't notify if the staff member IS the reporter
            if (!authorEmail.equals(ticket.getReporterEmail())) {
                notificationService.sendNotification(
                    ticket.getReporterEmail(),
                    "💬 Staff Replied to Your Ticket",
                    author.getName() + " commented on your ticket \"" + ticket.getTitle() + "\": " + truncate(request.getBody(), 80),
                    Notification.NotificationType.INFO,
                    true
                );
            }
        } else {
            // ✅ NOTIFICATION: User replied → notify all staff
            notifyAllStaff(
                "💬 User Replied on Ticket",
                ticket.getReporterName() + " added a comment on \"" + ticket.getTitle() + "\": " + truncate(request.getBody(), 80),
                Notification.NotificationType.INFO,
                false
            );
        }

        return saved;
    }

    // ========== HELPERS ==========

    /** Truncate a string to maxLen characters, adding "…" if cut */
    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() <= maxLen ? text : text.substring(0, maxLen) + "…";
    }

    private void refreshSlaBreachFlags(Ticket ticket) {
        Instant now = Instant.now();

        if (ticket.getFirstResponseAt() != null) {
            long minutesTaken = Duration.between(ticket.getCreatedAt(), ticket.getFirstResponseAt()).toMinutes();
            ticket.setSlaResponseBreached(minutesTaken > ticket.getSlaResponseMinutes());
        } else if (ticket.getStatus() != Ticket.TicketStatus.CLOSED) {
            long minutesElapsed = Duration.between(ticket.getCreatedAt(), now).toMinutes();
            ticket.setSlaResponseBreached(minutesElapsed > ticket.getSlaResponseMinutes());
        }

        if (ticket.getResolvedAt() != null) {
            long minutesTaken = Duration.between(ticket.getCreatedAt(), ticket.getResolvedAt()).toMinutes();
            ticket.setSlaResolutionBreached(minutesTaken > ticket.getSlaResolutionMinutes());
        } else if (ticket.getStatus() != Ticket.TicketStatus.CLOSED &&
                   ticket.getStatus() != Ticket.TicketStatus.RESOLVED) {
            long minutesElapsed = Duration.between(ticket.getCreatedAt(), now).toMinutes();
            ticket.setSlaResolutionBreached(minutesElapsed > ticket.getSlaResolutionMinutes());
        }
    }
}
