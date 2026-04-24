package com.smartcampus.user;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);

    // NEW: Find all users with a specific role (e.g. ADMIN or TECHNICIAN)
    List<User> findByRole(User.Role role);
}
