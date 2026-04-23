package com.smartcampus.booking;

import com.smartcampus.audit.AuditService;
import com.smartcampus.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class BookingCronJob {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private NotificationService notificationService;

    // This runs every 60 seconds (60000 milliseconds)
    @Scheduled(fixedRate = 60000)
    public void autoReleaseGhostBookings() {
        // Find the time 15 minutes ago
        LocalDateTime fifteenMinutesAgo = LocalDateTime.now().minusMinutes(15);

        // Find all CONFIRMED bookings where the start time was MORE than 15 minutes ago, but they haven't checked in
        List<Booking> ghostBookings = bookingRepository.findByStatusAndCheckedInFalseAndStartTimeLessThan(
                Booking.BookingStatus.CONFIRMED, fifteenMinutesAgo
        );

        if (!ghostBookings.isEmpty()) {
            System.out.println("🧹 CRON JOB: Found " + ghostBookings.size() + " ghost bookings. Auto-releasing...");

            for (Booking ghost : ghostBookings) {
                ghost.setStatus(Booking.BookingStatus.NO_SHOW);
                bookingRepository.save(ghost);

                // Log this autonomous action!
                auditService.logAction(
                    "SYSTEM_CRON", 
                    "AUTO_RELEASE", 
                    "Auto-cancelled booking " + ghost.getId() + " for " + ghost.getUserEmail() + " due to No-Show."
                );

                // Alert the User they missed their slot
                notificationService.sendNotification(
                ghost.getUserEmail(),
                "Booking Forfeited 👻",
                "You failed to check in. Your booking for " + ghost.getResourceId().substring(0,6) + " has been auto-released.",
                com.smartcampus.notification.Notification.NotificationType.ERROR,
                true // Urgent!
                );
            }
        }
    }
}