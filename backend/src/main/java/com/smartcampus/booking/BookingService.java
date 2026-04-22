package com.smartcampus.booking;

import com.smartcampus.audit.AuditService;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    public Booking createBooking(Booking newBooking, String userEmail) {
        // 1. Enforce business rules
        newBooking.setUserEmail(userEmail);
        newBooking.setStatus(Booking.BookingStatus.CONFIRMED);

        if (newBooking.getStartTime().isAfter(newBooking.getEndTime())) {
            throw new RuntimeException("End time must be after the start time.");
        }

        if (newBooking.getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book a resource in the past.");
        }

        // 2. CONFLICT DETECTION ALGORITHM
        // Check if any existing CONFIRMED or PENDING booking overlaps with this time slot
        List<Booking> overlapping = bookingRepository.findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusNot(
                newBooking.getResourceId(), 
                newBooking.getEndTime(), 
                newBooking.getStartTime(), 
                Booking.BookingStatus.CANCELLED
        );

        if (!overlapping.isEmpty()) {
            throw new RuntimeException("Double-Booking Prevented: This resource is already reserved for the selected time slot.");
        }

        // 3. Save and Log
        Booking saved = bookingRepository.save(newBooking);
        auditService.logAction(userEmail, "CREATE_BOOKING", "Reserved resource ID: " + newBooking.getResourceId());
        
        return saved;
    }

    public List<Booking> getUserBookings(String userEmail) {
        return bookingRepository.findByUserEmailOrderByStartTimeDesc(userEmail);
    }

    public List<Booking> getResourceBookings(String resourceId) {
        return bookingRepository.findByResourceIdOrderByStartTimeAsc(resourceId);
    }

    public Booking cancelBooking(String bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // SECURITY CHECK: Only the owner OR an Admin can cancel this
        User currentUser = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!booking.getUserEmail().equals(userEmail) && currentUser.getRole() != User.Role.ADMIN) {
             throw new RuntimeException("Security Violation: You do not have permission to cancel this booking.");
        }
        
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        Booking updated = bookingRepository.save(booking);

        auditService.logAction(userEmail, "CANCEL_BOOKING", "Cancelled booking ID: " + bookingId);
        
        return updated;
    }
}