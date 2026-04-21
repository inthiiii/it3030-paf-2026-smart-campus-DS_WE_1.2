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
    private Role role;

    public enum Role {
        ADMIN,
        USER,
        TECHNICIAN
    }
}