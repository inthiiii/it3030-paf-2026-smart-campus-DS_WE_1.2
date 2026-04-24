package com.smartcampus.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.smartcampus.audit.AuditService;
import com.smartcampus.notification.Notification;
import com.smartcampus.notification.NotificationService;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Value("${google.client.id}")
    private String googleClientId;

    @Value("${admin.email:ihthishamirshad781@gmail.com}")
    private String adminEmail;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuditService auditService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/google")
    public ResponseEntity<?> authenticateWithGoogle(@RequestBody Map<String, String> payload) {
        String googleToken = payload.get("token");

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(googleToken);
            if (idToken != null) {
                GoogleIdToken.Payload googlePayload = idToken.getPayload();
                String email = googlePayload.getEmail();
                String name = (String) googlePayload.get("name");
                String pictureUrl = (String) googlePayload.get("picture");

                User user = userRepository.findByEmail(email).orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setName(name);
                    newUser.setPictureUrl(pictureUrl);
                    
                    // Master Admin Check
                    if (adminEmail.equals(email)) {
                        newUser.setRole(User.Role.ADMIN);
                    } else {
                        newUser.setRole(User.Role.USER);
                    }
                    
                    User savedUser = userRepository.save(newUser);
                    
                    notificationService.sendNotification(
                        savedUser.getEmail(), 
                        "Welcome to Smart Campus! 🎉", 
                        "Your account has been created successfully. You can now book facilities.", 
                        Notification.NotificationType.SUCCESS,
                        false // Welcome notifications are not urgent
                    );
                    
                    return savedUser;
                });

                // --- NEW IAM SECURITY CHECK: Block Suspended/Deleted Users ---
                if (user.getAccountStatus() == User.AccountStatus.SUSPENDED) {
                    auditService.logAction(email, "FAILED_LOGIN", "Suspended user attempted to log in.");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Login Denied: Your account has been suspended by an Administrator.");
                }
                if (user.getAccountStatus() == User.AccountStatus.DELETED) {
                    auditService.logAction(email, "FAILED_LOGIN", "Deleted user attempted to log in.");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Login Denied: This account no longer exists.");
                }
                // --------------------------------------------------------------

                String jwt = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

                try {
                    Map<String, String> aiPayload = Map.of(
                        "email", user.getEmail(),
                        "timestamp", java.time.Instant.now().toString()
                    );
                    
                    Map aiResponse = restTemplate.postForObject("http://localhost:8000/api/anomaly/login", aiPayload, Map.class);
                    boolean isSuspicious = (Boolean) aiResponse.get("is_suspicious");

                    if (isSuspicious) {
                        auditService.logAction(user.getEmail(), "SUSPICIOUS_LOGIN", "🚨 AI DETECTED ANOMALOUS LOGIN TIME!");
                    } else {
                        auditService.logAction(user.getEmail(), "LOGIN", "Standard user authentication.");
                    }
                } catch (Exception e) {
                    auditService.logAction(user.getEmail(), "LOGIN", "User authenticated (AI Check Offline).");
                }

                return ResponseEntity.ok(Map.of(
                        "token", jwt, "role", user.getRole(), "name", user.getName(), 
                        "email", user.getEmail(), "picture", user.getPictureUrl()
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Google Token");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Authentication Failed: " + e.getMessage());
        }
    }
}