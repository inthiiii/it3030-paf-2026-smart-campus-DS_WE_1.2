package com.smartcampus.booking;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}