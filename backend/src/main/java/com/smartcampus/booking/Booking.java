package com.smartcampus.booking;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;
    
    private String resourceId;
    private String userEmail; // We use email because it's guaranteed by Google Auth
    
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    
    private String purpose;
    private BookingStatus status;

    public enum BookingStatus {
        PENDING,
        CONFIRMED,
        REJECTED,
        CANCELLED,
        COMPLETED
    }
}
