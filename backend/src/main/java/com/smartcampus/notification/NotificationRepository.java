package com.smartcampus.notification;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    // Fetch a user's notifications, newest first
    List<Notification> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);
    // Count unread messages for the "Bell" icon badge
    long countByRecipientEmailAndIsReadFalse(String recipientEmail);
}