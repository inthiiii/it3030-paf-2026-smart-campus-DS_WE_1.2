package com.smartcampus.ticket;

import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

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

        if (request.getImageBase64() != null) {
            List<String> images = request.getImageBase64().stream().limit(3).toList();
            ticket.setImageBase64(images);
        }

        // SLA clock starts now (createdAt is already set by default)
        return ticketRepository.save(ticket);
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

            // SLA: Record resolution timestamp when status becomes RESOLVED
            if (newStatus == Ticket.TicketStatus.RESOLVED && ticket.getResolvedAt() == null) {
                ticket.setResolvedAt(Instant.now());
            }

            // If ticket is re-opened, clear the resolved timestamp
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

        // SLA: Record first response when a staff member (ADMIN/TECHNICIAN) comments
        if (ticket.getFirstResponseAt() == null &&
                (authorRole.equals("ADMIN") || authorRole.equals("TECHNICIAN"))) {
            ticket.setFirstResponseAt(Instant.now());
        }

        refreshSlaBreachFlags(ticket);
        return ticketRepository.save(ticket);
    }

    // ========== SLA HELPER ==========

    /**
     * Checks if an SLA deadline has been breached and updates the flags.
     * Called on every read/write so the flags are always up to date.
     */
    private void refreshSlaBreachFlags(Ticket ticket) {
        Instant now = Instant.now();

        // --- Response SLA ---
        if (ticket.getFirstResponseAt() != null) {
            // Already responded — check if it was late
            long minutesTaken = Duration.between(ticket.getCreatedAt(), ticket.getFirstResponseAt()).toMinutes();
            ticket.setSlaResponseBreached(minutesTaken > ticket.getSlaResponseMinutes());
        } else if (ticket.getStatus() != Ticket.TicketStatus.CLOSED) {
            // Not yet responded — check if we've passed the deadline
            long minutesElapsed = Duration.between(ticket.getCreatedAt(), now).toMinutes();
            ticket.setSlaResponseBreached(minutesElapsed > ticket.getSlaResponseMinutes());
        }

        // --- Resolution SLA ---
        if (ticket.getResolvedAt() != null) {
            // Already resolved — check if it was late
            long minutesTaken = Duration.between(ticket.getCreatedAt(), ticket.getResolvedAt()).toMinutes();
            ticket.setSlaResolutionBreached(minutesTaken > ticket.getSlaResolutionMinutes());
        } else if (ticket.getStatus() != Ticket.TicketStatus.CLOSED &&
                   ticket.getStatus() != Ticket.TicketStatus.RESOLVED) {
            // Not yet resolved — check if we've passed the deadline
            long minutesElapsed = Duration.between(ticket.getCreatedAt(), now).toMinutes();
            ticket.setSlaResolutionBreached(minutesElapsed > ticket.getSlaResolutionMinutes());
        }
    }
}
