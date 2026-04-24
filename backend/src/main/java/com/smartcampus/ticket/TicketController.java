package com.smartcampus.ticket;

import io.jsonwebtoken.Claims;
import com.smartcampus.auth.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "http://localhost:5173")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private JwtUtil jwtUtil;

    // Helper: extract email from the Authorization header
    private String getEmailFromHeader(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Claims claims = jwtUtil.extractClaims(token);
        return claims.getSubject();
    }

    // Helper: extract role from the Authorization header
    private String getRoleFromHeader(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Claims claims = jwtUtil.extractClaims(token);
        return claims.get("role", String.class);
    }

    // POST /api/tickets — Create a new ticket (any logged-in user)
    @PostMapping
    public ResponseEntity<Ticket> createTicket(
            @RequestBody TicketRequest request,
            @RequestHeader("Authorization") String authHeader) {
        String email = getEmailFromHeader(authHeader);
        Ticket created = ticketService.createTicket(request, email);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // GET /api/tickets — Get ALL tickets (ADMIN or TECHNICIAN only)
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets(
            @RequestHeader("Authorization") String authHeader) {
        String role = getRoleFromHeader(authHeader);
        if (!role.equals("ADMIN") && !role.equals("TECHNICIAN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    // GET /api/tickets/mine — Get only MY tickets (any logged-in user)
    @GetMapping("/mine")
    public ResponseEntity<List<Ticket>> getMyTickets(
            @RequestHeader("Authorization") String authHeader) {
        String email = getEmailFromHeader(authHeader);
        return ResponseEntity.ok(ticketService.getMyTickets(email));
    }

    // GET /api/tickets/{id} — Get a single ticket by ID
    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(
            @PathVariable String id,
            @RequestHeader("Authorization") String authHeader) {
        String email = getEmailFromHeader(authHeader);
        String role = getRoleFromHeader(authHeader);
        Ticket ticket = ticketService.getTicketById(id);

        // Security: users can only view their own tickets unless admin/technician
        if (!role.equals("ADMIN") && !role.equals("TECHNICIAN") && !ticket.getReporterEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(ticket);
    }

    // PATCH /api/tickets/{id}/status — Update status (ADMIN or TECHNICIAN only)
    @PatchMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(
            @PathVariable String id,
            @RequestBody StatusUpdateRequest request,
            @RequestHeader("Authorization") String authHeader) {
        String role = getRoleFromHeader(authHeader);
        if (!role.equals("ADMIN") && !role.equals("TECHNICIAN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(ticketService.updateStatus(id, request));
    }

    // POST /api/tickets/{id}/comments — Add a comment (any logged-in user)
    @PostMapping("/{id}/comments")
    public ResponseEntity<Ticket> addComment(
            @PathVariable String id,
            @RequestBody CommentRequest request,
            @RequestHeader("Authorization") String authHeader) {
        String email = getEmailFromHeader(authHeader);
        String role = getRoleFromHeader(authHeader);
        return ResponseEntity.ok(ticketService.addComment(id, request, email, role));
    }

    // DELETE /api/tickets/{id} — Delete a ticket (ADMIN or TECHNICIAN)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable String id,
            @RequestHeader("Authorization") String authHeader) {
        String role = getRoleFromHeader(authHeader);
        if (!role.equals("ADMIN") && !role.equals("TECHNICIAN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }
}
