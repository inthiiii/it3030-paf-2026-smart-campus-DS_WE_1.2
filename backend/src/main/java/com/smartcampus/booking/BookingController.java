package com.smartcampus.booking;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository; // Injected to save the Check-In status

    // ==========================================
    //          USER ENDPOINTS
    // ==========================================

    // POST: User submits a reservation (Defaults to PENDING)
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            Booking created = bookingService.createBooking(booking, email);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET: User looks at their own personal schedule
    @GetMapping("/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(bookingService.getUserBookings(email));
    }

    // GET: Fetch bookings for a specific resource (useful for calendar views)
    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<List<Booking>> getResourceBookings(@PathVariable String resourceId) {
        return ResponseEntity.ok(bookingService.getResourceBookings(resourceId));
    }

    // PUT: User cancels their own booking
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

    // PUT: User physically checks into the room (Anti-Ghost Booking Feature)
    @PutMapping("/{id}/check-in")
    public ResponseEntity<?> checkInToBooking(@PathVariable String id) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            
            Booking booking = bookingService.getUserBookings(email).stream()
                .filter(b -> b.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Booking not found or unauthorized"));

            if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
                return ResponseEntity.badRequest().body("Only confirmed bookings can be checked into.");
            }

            // Mark them as physically present!
            booking.setCheckedIn(true);
            bookingRepository.save(booking); 
            
            return ResponseEntity.ok("Successfully checked in!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==========================================
    //          ADMIN ENDPOINTS
    // ==========================================

    // GET: Admin fetches all system bookings for the Approval Inbox
    @GetMapping("/all")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // PUT: Admin Approves or Rejects a booking
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
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