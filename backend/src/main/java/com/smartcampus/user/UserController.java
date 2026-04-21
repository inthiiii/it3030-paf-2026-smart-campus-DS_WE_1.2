package com.smartcampus.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserRepository userRepository;

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
            user.setRole(User.Role.valueOf(newRole));
            User updatedUser = userRepository.save(user);
            return ResponseEntity.ok(updatedUser);
        }).orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
}