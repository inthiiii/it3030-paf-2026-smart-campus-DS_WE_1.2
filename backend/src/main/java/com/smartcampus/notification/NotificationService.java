package com.smartcampus.notification;

import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private RestTemplate restTemplate; // NEW: To talk to Python!

    // UPGRADED MASTER METHOD
    public void sendNotification(String userEmail, String title, String message, Notification.NotificationType type, boolean isUrgent) {
        
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user != null && !user.isNotificationsEnabled()) {
            return; // User muted notifications
        }

        // --- ML FEATURE: Check Smart Delivery AI ---
        try {
            LocalDateTime now = LocalDateTime.now();
            double hourOfDay = now.getHour() + (now.getMinute() / 60.0);

            Map<String, Object> payload = Map.of(
                "user_email", userEmail,
                "hour_of_day", hourOfDay,
                "is_urgent", isUrgent
            );

            Map response = restTemplate.postForObject("http://localhost:8000/api/notifications/smart-delivery", payload, Map.class);
            String action = (String) response.get("action");

            if ("HOLD_FOR_DIGEST".equals(action)) {
                System.out.println("🤖 AI Intercepted Notification for " + userEmail + ". Holding for Morning Digest.");
                // We save it to MongoDB, but we DO NOT blast the WebSocket so their phone doesn't buzz!
                saveToMongo(userEmail, title, message, type);
                return; 
            }
        } catch (Exception e) {
            System.out.println("AI Engine Offline. Defaulting to SEND_NOW.");
        }

        // --- Send Now Flow ---
        Notification saved = saveToMongo(userEmail, title, message, type);
        messagingTemplate.convertAndSend("/topic/notifications/" + userEmail, saved);
    }

    private Notification saveToMongo(String userEmail, String title, String message, Notification.NotificationType type) {
        Notification notification = new Notification();
        notification.setRecipientEmail(userEmail);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(String email) {
        return notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email);
    }

    public void markAsRead(String id) {
        notificationRepository.findById(id).ifPresent(notif -> {
            notif.setRead(true);
            notificationRepository.save(notif);
        });
    }

    public void deleteNotification(String id) {
        notificationRepository.deleteById(id);
    }
}