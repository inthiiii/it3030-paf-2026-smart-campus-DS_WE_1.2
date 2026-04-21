package com.smartcampus.ticket;

import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
            // Enforce max 3 images
            List<String> images = request.getImageBase64().stream().limit(3).toList();
            ticket.setImageBase64(images);
        }

        return ticketRepository.save(ticket);
    }

    // --- READ: all tickets for admin/technician ---
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc();
    }

    // --- READ: only my tickets ---
    public List<Ticket> getMyTickets(String reporterEmail) {
        return ticketRepository.findByReporterEmailOrderByCreatedAtDesc(reporterEmail);
    }

    // --- READ: single ticket ---
    public Ticket getTicketById(String id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
    }

    // --- UPDATE STATUS (admin/technician only) ---
    public Ticket updateStatus(String id, StatusUpdateRequest request) {
        Ticket ticket = getTicketById(id);
        try {
            Ticket.TicketStatus newStatus = Ticket.TicketStatus.valueOf(request.getStatus());
            ticket.setStatus(newStatus);
            ticket.setUpdatedAt(Instant.now());
            return ticketRepository.save(ticket);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value");
        }
    }

    // --- ADD COMMENT ---
    public Ticket addComment(String ticketId, CommentRequest request, String authorEmail, String authorRole) {
        Ticket ticket = getTicketById(ticketId);

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

        return ticketRepository.save(ticket);
    }
}
