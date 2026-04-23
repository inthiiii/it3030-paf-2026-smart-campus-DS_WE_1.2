package com.smartcampus.user;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "users")
public class User {

    @Id
    private String id;
    
    private String email;
    private String name;
    private String pictureUrl;
    
    // NEW PROFILE FIELDS
    private String phoneNumber; 
    private String department;
    
    private Role role;
    private boolean notificationsEnabled = true;
    
    // NEW SECURITY FIELD
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    public enum Role {
        ADMIN, USER, TECHNICIAN
    }

    // NEW ENUM FOR ACCESS CONTROL
    public enum AccountStatus {
        ACTIVE, SUSPENDED, DELETED
    }
}