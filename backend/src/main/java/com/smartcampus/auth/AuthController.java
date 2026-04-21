package com.smartcampus.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;

import com.smartcampus.audit.AuditService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Value("${google.client.id}")
    private String googleClientId;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuditService auditService;

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/google")
    public ResponseEntity<?> authenticateWithGoogle(@RequestBody Map<String, String> payload) {
        String googleToken = payload.get("token");

        try {
            // 1. Verify the token with Google
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(googleToken);
            if (idToken != null) {
                GoogleIdToken.Payload googlePayload = idToken.getPayload();
                String email = googlePayload.getEmail();
                String name = (String) googlePayload.get("name");
                String pictureUrl = (String) googlePayload.get("picture");

                // 2. Find user in DB, or create a new one!
                User user = userRepository.findByEmail(email).orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setName(name);
                    newUser.setPictureUrl(pictureUrl);
                    // Master Admin Check
                    if ("ihthishamirshad781@gmail.com".equals(email)) {
                        newUser.setRole(User.Role.ADMIN);
                    } else {
                        newUser.setRole(User.Role.USER); 
                    }
                    return userRepository.save(newUser);
                });

                // 3. Generate our secure JWT
                String jwt = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

                // --------------------------------------------------------
                // 4. THE ML FEATURE: Suspicious Login Detection
                // --------------------------------------------------------
                try {
                    Map<String, String> aiPayload = Map.of(
                        "email", user.getEmail(),
                        "timestamp", java.time.LocalDateTime.now().toString()
                    );
                    
                    // Ping the Python AI Server
                    Map aiResponse = restTemplate.postForObject("http://localhost:8000/api/anomaly/login", aiPayload, Map.class);
                    
                    boolean isSuspicious = (Boolean) aiResponse.get("is_suspicious");

                    // Log the result into the Audit Trail
                    if (isSuspicious) {
                        auditService.logAction(user.getEmail(), "SUSPICIOUS_LOGIN", "🚨 AI DETECTED ANOMALOUS LOGIN TIME!");
                    } else {
                        auditService.logAction(user.getEmail(), "LOGIN", "Standard user authentication.");
                    }
                } catch (Exception e) {
                    // Fallback just in case you forgot to turn the Python server on!
                    auditService.logAction(user.getEmail(), "LOGIN", "User authenticated (AI Check Offline).");
                }
                // --------------------------------------------------------

                // 5. Send the user data and token back to React
                return ResponseEntity.ok(Map.of(
                        "token", jwt,
                        "role", user.getRole(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "picture", user.getPictureUrl()
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Google Token");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Authentication Failed: " + e.getMessage());
        }
    }
}