package com.smartcampus.booking;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    
    // 1. Fetch all bookings made by a specific user (User Dashboard)
    List<Booking> findByUserEmailOrderByStartTimeDesc(String email);
    
    // 2. Fetch all bookings for a specific resource
    List<Booking> findByResourceIdOrderByStartTimeAsc(String resourceId);
    
    // 3. Fetch all system bookings (Admin Approval Inbox)
    List<Booking> findAllByOrderByStartTimeDesc();

    // 4. CONFLICT DETECTION: Find overlapping bookings that are PENDING or CONFIRMED
    List<Booking> findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusIn(
        String resourceId, LocalDateTime newEndTime, LocalDateTime newStartTime, List<Booking.BookingStatus> statuses);

    // 5. ANTI-GHOST CRON JOB: Find bookings that started but never checked in
    List<Booking> findByStatusAndCheckedInFalseAndStartTimeLessThan(
        Booking.BookingStatus status, LocalDateTime timeBuffer);

        // NEW FOR AI: Calculate User History
    long countByUserEmail(String email);
    long countByUserEmailAndStatus(String email, Booking.BookingStatus status);
}