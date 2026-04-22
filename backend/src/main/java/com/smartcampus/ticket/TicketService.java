package com.smartcampus.ticket;

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

    // RestTemplate for calling the Python AI service
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String AI_SERVICE_URL = "http://localhost:8000";

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
                // Never fail ticket creation if AI is down
                System.out.println("ML assessment skipped (AI service unavailable): " + e.getMessage());
            }
        }

        // SLA clock starts at createdAt (already set by default in Ticket)
        return ticketRepository.save(ticket);
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
            return ticketRepository.save(ticket);
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
        return ticketRepository.save(ticket);
    }

    // ========== SLA HELPER ==========
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
