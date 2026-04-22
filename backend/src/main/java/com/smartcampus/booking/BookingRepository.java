package com.smartcampus.booking;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    
    // Fetch all bookings made by a specific user
    List<Booking> findByUserEmailOrderByStartTimeDesc(String email);
    
    // Fetch all bookings for a specific resource (useful for calendar views)
    List<Booking> findByResourceIdOrderByStartTimeAsc(String resourceId);

    // CRITICAL: Find overlapping bookings to prevent double-booking!
    // The logic here: A booking overlaps if an existing booking starts BEFORE the new End Time 
    // AND the existing booking ends AFTER the new Start Time.
    List<Booking> findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusNot(
        String resourceId, LocalDateTime newEndTime, LocalDateTime newStartTime, Booking.BookingStatus status);
}