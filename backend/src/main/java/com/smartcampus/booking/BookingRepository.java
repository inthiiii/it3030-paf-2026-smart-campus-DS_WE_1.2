package com.smartcampus.booking;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    
    // Fetch all bookings made by a specific user
    List<Booking> findByUserEmailOrderByStartTimeDesc(String email);
    
    // Fetch all bookings for a specific resource (useful for calendar views)
    List<Booking> findByResourceIdOrderByStartTimeAsc(String resourceId);

    // CRITICAL: Find overlapping bookings to prevent double-booking!
    // The logic here: A booking overlaps if an existing booking starts BEFORE the new End Time 
    // AND the existing booking ends AFTER the new Start Time.

    // FETCH all bookings for the admin dashboard
    List<Booking> findAllByOrderByStartTimeDesc();
    
    // Updated : Find overlapping bookings that are either PENDING or CONFIRMED 
    List<Booking> findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusNot(
        String resourceId, LocalDateTime newEndTime, LocalDateTime newStartTime, Booking.BookingStatus status);
}
