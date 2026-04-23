package com.smartcampus.booking;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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

    @Autowired
    private RestTemplate restTemplate;

    @Autowired 
    private com.smartcampus.notification.NotificationService notificationService;

    public Booking createBooking(Booking newBooking, String userEmail) {
        newBooking.setUserEmail(userEmail);

        if (newBooking.getStartTime().isAfter(newBooking.getEndTime())) {
            throw new RuntimeException("End time must be after the start time.");
        }
        if (newBooking.getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book a resource in the past.");
        }

        // CONFLICT ALGORITHM
        List<Booking.BookingStatus> blockingStatuses = List.of(Booking.BookingStatus.PENDING, Booking.BookingStatus.CONFIRMED);
        List<Booking> overlapping = bookingRepository.findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusIn(
                newBooking.getResourceId(), newBooking.getEndTime(), newBooking.getStartTime(), blockingStatuses
        );

        if (!overlapping.isEmpty()) {
            throw new RuntimeException("This time slot is currently locked or already booked by another user.");
        }

        // --- NEW AI FEATURE: Autonomous Orchestration ---
        try {
            // 1. Calculate User's Historical Trust Score
            long totalBookings = bookingRepository.countByUserEmail(userEmail);
            long totalNoShows = bookingRepository.countByUserEmailAndStatus(userEmail, Booking.BookingStatus.NO_SHOW);
            double noShowRate = totalBookings == 0 ? 0.0 : (double) totalNoShows / totalBookings;

            // 2. Calculate Booking Details
            double hourOfDay = newBooking.getStartTime().getHour() + (newBooking.getStartTime().getMinute() / 60.0);
            double duration = java.time.Duration.between(newBooking.getStartTime(), newBooking.getEndTime()).toMinutes() / 60.0;

            // 3. Ask the Python Engine
            java.util.Map<String, Double> payload = java.util.Map.of(
                "past_no_show_rate", noShowRate,
                "hour_of_day", hourOfDay,
                "duration_hours", duration
            );
            
            java.util.Map response = restTemplate.postForObject("http://localhost:8000/api/predict/no-show", payload, java.util.Map.class);
            
            Double riskScore = (Double) response.get("risk_score");
            Boolean autoApprove = (Boolean) response.get("auto_approve");

            newBooking.setAiRiskScore(riskScore);

            // 4. Autonomous Decision Making!
            if (autoApprove) {
                newBooking.setStatus(Booking.BookingStatus.CONFIRMED);
                auditService.logAction(userEmail, "AI_AUTO_APPROVE", "AI instantly confirmed booking (Risk: " + riskScore + "%)");
                
                // Tell the user the AI approved it instantly!
                notificationService.sendNotification(
                    userEmail, 
                    "Booking Auto-Approved! 🤖✅", 
                    "The system instantly confirmed your reservation for resource " + newBooking.getResourceId().substring(0, 6) + ".", 
                    com.smartcampus.notification.Notification.NotificationType.SUCCESS,
                    true // Urgent so it pops instantly
                );
            } else {
                newBooking.setStatus(Booking.BookingStatus.PENDING);
                auditService.logAction(userEmail, "AI_FLAGGED", "AI routed booking to Admin inbox (Risk: " + riskScore + "%)");
            }
        } catch (Exception e) {
            // THE MISSING CATCH BLOCK IS BACK!
            newBooking.setStatus(Booking.BookingStatus.PENDING);
            newBooking.setAiRiskScore(null);
            auditService.logAction(userEmail, "REQUEST_BOOKING", "Requested resource (AI Offline)");
        }

        Booking savedBooking = bookingRepository.save(newBooking);

        // Alert the Master Admin (Using your actual email)
        notificationService.sendNotification(
            "ihthishamirshad781@gmail.com", 
            "New Booking Request", 
            userEmail + " has requested resource " + newBooking.getResourceId().substring(0, 6) + ".", 
            com.smartcampus.notification.Notification.NotificationType.INFO,
            false // Not urgent, AI can queue this
        );

        return savedBooking;
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

        // Alert the User that the Admin made a decision!
        String title = newStatus == Booking.BookingStatus.CONFIRMED ? "Booking Approved! ✅" : "Booking Rejected ❌";
        com.smartcampus.notification.Notification.NotificationType type = newStatus == Booking.BookingStatus.CONFIRMED 
            ? com.smartcampus.notification.Notification.NotificationType.SUCCESS 
            : com.smartcampus.notification.Notification.NotificationType.ERROR;

        notificationService.sendNotification(
            booking.getUserEmail(), 
            title, 
            "Your reservation for resource " + booking.getResourceId().substring(0, 6) + " has been " + newStatus.name().toLowerCase() + ".", 
            type,
            true // Urgent! The user needs to know their status immediately.
        );

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
        
        // Alert the Admin that a user freed up a room (UPDATED EMAIL HERE)
        notificationService.sendNotification(
            "ihthishamirshad781@gmail.com", 
            "Booking Cancelled", 
            userEmail + " cancelled their booking for resource " + booking.getResourceId().substring(0,6), 
            com.smartcampus.notification.Notification.NotificationType.WARNING,
            false
        );

        return updated;
    }

    public Booking saveBooking(Booking b) { return bookingRepository.save(b); }
}