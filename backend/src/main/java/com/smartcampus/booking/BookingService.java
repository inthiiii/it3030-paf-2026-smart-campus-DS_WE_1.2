package com.smartcampus.booking;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smartcampus.audit.AuditService;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    public Booking createBooking(Booking newBooking, String userEmail) {
        newBooking.setUserEmail(userEmail);
        // 1. All new requests start as PENDING
        newBooking.setStatus(Booking.BookingStatus.PENDING);

        if (newBooking.getStartTime().isAfter(newBooking.getEndTime())) {
            throw new RuntimeException("End time must be after the start time.");
        }
        if (newBooking.getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book a resource in the past.");
        }

        // 2. CONFLICT ALGORITHM: Block if someone already has a PENDING or CONFIRMED booking here
        List<Booking.BookingStatus> blockingStatuses = List.of(Booking.BookingStatus.PENDING, Booking.BookingStatus.CONFIRMED);
        List<Booking> overlapping = bookingRepository.findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusIn(
                newBooking.getResourceId(), newBooking.getEndTime(), newBooking.getStartTime(), blockingStatuses
        );

        if (!overlapping.isEmpty()) {
            throw new RuntimeException("This time slot is currently locked or already booked by another user.");
        }

        Booking saved = bookingRepository.save(newBooking);
        auditService.logAction(userEmail, "REQUEST_BOOKING", "Requested resource ID: " + newBooking.getResourceId());
        return saved;
    }

    // NEW ADMIN METHOD: Get all bookings
    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByOrderByStartTimeDesc();
    }

    // NEW ADMIN METHOD: Approve or Reject
    public Booking updateBookingStatus(String bookingId, Booking.BookingStatus newStatus, String adminEmail) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        booking.setStatus(newStatus);
        Booking updated = bookingRepository.save(booking);
        
        auditService.logAction(adminEmail, "REVIEW_BOOKING", "Set booking " + bookingId + " to " + newStatus.name());
        return updated;
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
