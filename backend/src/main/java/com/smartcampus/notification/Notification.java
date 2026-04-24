package com.smartcampus.notification;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    
    private String recipientEmail;
    private String title;
    private String message;
    private NotificationType type; // SUCCESS, WARNING, INFO, ERROR
    
    private boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum NotificationType {
        SUCCESS, WARNING, INFO, ERROR
    }
}