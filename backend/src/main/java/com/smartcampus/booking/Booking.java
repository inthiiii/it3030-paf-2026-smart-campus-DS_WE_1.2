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
    private String userEmail; 
    
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    
    private String purpose;
    private BookingStatus status;

    private boolean checkedIn;

    private Double aiRiskScore;

    public enum BookingStatus {
        PENDING,
        CONFIRMED,
        REJECTED,
        CANCELLED,
        COMPLETED,
        NO_SHOW
    }
}
