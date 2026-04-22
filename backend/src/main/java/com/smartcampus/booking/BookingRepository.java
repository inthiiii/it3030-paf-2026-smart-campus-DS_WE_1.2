package com.smartcampus.booking;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    
    List<Booking> findByUserEmailOrderByStartTimeDesc(String email);
    List<Booking> findByResourceIdOrderByStartTimeAsc(String resourceId);
    
    // NEW: Fetch all bookings for the Admin Dashboard
    List<Booking> findAllByOrderByStartTimeDesc();

<<<<<<< HEAD
    // CRITICAL: Find overlapping bookings to prevent double-booking!
    // The logic here: A booking overlaps if an existing booking starts BEFORE the new End Time 
    // AND the existing booking ends AFTER the new Start Time.

    // FETCH all bookings for the admin dashboard
    List<Booking> findAllByOrderByStartTimeDesc();
    
    // Updated : Find overlapping bookings that are either PENDING or CONFIRMED 
    List<Booking> findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusNot(
        String resourceId, LocalDateTime newEndTime, LocalDateTime newStartTime, Booking.BookingStatus status);

    // New: Find overlapping bookings with a list of statuses (PENDING, CONFIRMED)
    List<Booking> findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusIn(
        String resourceId, LocalDateTime newEndTime, LocalDateTime newStartTime, List<Booking.BookingStatus> statuses);
}
=======
    // UPDATED: Find overlapping bookings that are either PENDING or CONFIRMED
    List<Booking> findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusIn(
        String resourceId, LocalDateTime newEndTime, LocalDateTime newStartTime, List<Booking.BookingStatus> statuses);
}
>>>>>>> e6ab7df (Booking Admin UI)
