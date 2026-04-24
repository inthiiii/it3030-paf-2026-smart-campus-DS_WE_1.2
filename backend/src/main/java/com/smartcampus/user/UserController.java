package com.smartcampus.user;

import com.smartcampus.audit.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    // --- ADMIN ENDPOINTS ---

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String newRole = payload.get("role");
        return userRepository.findById(id).map(user -> {
            String oldRole = user.getRole().name();
            user.setRole(User.Role.valueOf(newRole));
            User updatedUser = userRepository.save(user);

            String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            auditService.logAction(adminEmail, "UPDATE_ROLE", 
                "Changed role of " + updatedUser.getEmail() + " from " + oldRole + " to " + newRole);

            return ResponseEntity.ok(updatedUser);
        }).orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    // NEW: Admin Suspends/Activates a User
    @PutMapping("/{id}/status")
    public ResponseEntity<User> updateUserStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findById(id).map(user -> {
            if ("ihthishamirshad781@gmail.com".equals(user.getEmail())) {
                throw new RuntimeException("Cannot modify the Master Admin's account status.");
            }
            String oldStatus = user.getAccountStatus().name();
            user.setAccountStatus(User.AccountStatus.valueOf(newStatus));
            User updated = userRepository.save(user);
            
            auditService.logAction(adminEmail, "UPDATE_STATUS", "Changed status of " + user.getEmail() + " from " + oldStatus + " to " + newStatus);
            return ResponseEntity.ok(updated);
        }).orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    // --- USER ENDPOINTS ---

    // NEW: Get current user profile
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // NEW: User updates their own profile
    @PutMapping("/me")
    public ResponseEntity<User> updateProfile(@RequestBody Map<String, Object> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).map(user -> {
            if (payload.containsKey("name")) user.setName((String) payload.get("name"));
            if (payload.containsKey("phoneNumber")) user.setPhoneNumber((String) payload.get("phoneNumber"));
            if (payload.containsKey("department")) user.setDepartment((String) payload.get("department"));
            if (payload.containsKey("notificationsEnabled")) user.setNotificationsEnabled((Boolean) payload.get("notificationsEnabled"));
            
            User updated = userRepository.save(user);
            auditService.logAction(email, "UPDATE_PROFILE", "User updated their personal details.");
            return ResponseEntity.ok(updated);
        }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    // NEW: Soft Delete Account
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).map(user -> {
            // Soft Deletion: We scramble the data so they are anonymous, but keep the email intact for DB relations
            user.setAccountStatus(User.AccountStatus.DELETED);
            user.setName("Former User");
            user.setPictureUrl("https://ui-avatars.com/api/?name=Former+User&background=random");
            user.setPhoneNumber(null);
            user.setDepartment(null);
            user.setNotificationsEnabled(false);
            
            userRepository.save(user);
            auditService.logAction(email, "DELETE_ACCOUNT", "User permanently soft-deleted their account.");
            return ResponseEntity.ok().build();
        }).orElseThrow(() -> new RuntimeException("User not found"));
    }
}