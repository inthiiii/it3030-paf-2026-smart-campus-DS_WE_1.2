package com.smartcampus.user;

import com.smartcampus.audit.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder; // IMPORT ADDED
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
    private AuditService auditService; // INJECTED

    // GET: Fetch all registered users
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // PUT: Update a user's role (Admin Only feature)
    @PutMapping("/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String newRole = payload.get("role");
        
        return userRepository.findById(id).map(user -> {
            String oldRole = user.getRole().name();
            user.setRole(User.Role.valueOf(newRole));
            User updatedUser = userRepository.save(user);

            // LOG THE ACTION
            String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            auditService.logAction(adminEmail, "UPDATE_ROLE", 
                "Changed role of " + updatedUser.getEmail() + " from " + oldRole + " to " + newRole);

            return ResponseEntity.ok(updatedUser);
        }).orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
}