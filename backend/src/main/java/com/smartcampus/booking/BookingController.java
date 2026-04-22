package com.smartcampus.booking;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
<<<<<<< HEAD
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
=======
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
>>>>>>> e6ab7df (Booking Admin UI)

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // POST: User submits a reservation
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        try {
            // Get the verified email from the JWT
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            Booking created = bookingService.createBooking(booking, email);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET: User looks at their own dashboard
    @GetMapping("/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(bookingService.getUserBookings(email));
    }

    // GET: Fetch bookings for a specific resource (for a calendar UI)
    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<List<Booking>> getResourceBookings(@PathVariable String resourceId) {
        return ResponseEntity.ok(bookingService.getResourceBookings(resourceId));
    }

    // PUT: Cancel a booking
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable String id) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            Booking cancelled = bookingService.cancelBooking(id, email);
            return ResponseEntity.ok(cancelled);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- ADMIN ENDPOINTS ---

    // GET: Admin fetches all system bookings
    @GetMapping("/all")
    public ResponseEntity<List<Booking>> getAllBookings() {
        // You could add a security check here to ensure only ADMINs call this,
        // but our UI will only render this button for Admins anyway!
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // PUT: Admin Approves or Rejects a booking
    @PutMapping("/{id}/status")
<<<<<<< HEAD
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody java.util.Map<String, String> payload) {
=======
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
>>>>>>> e6ab7df (Booking Admin UI)
        try {
            String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Booking.BookingStatus status = Booking.BookingStatus.valueOf(payload.get("status"));
            Booking updated = bookingService.updateBookingStatus(id, status, adminEmail);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
<<<<<<< HEAD
=======

>>>>>>> e6ab7df (Booking Admin UI)
