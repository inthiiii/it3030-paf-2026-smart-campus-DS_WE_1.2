package com.smartcampus.resource;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.util.List;

@Data // Lombok automatically creates Getters and Setters for you!
@Document(collection = "resources") // Tells MongoDB to save this in a 'resources' collection
public class Resource {

    @Id
    private String id;
    
    private String name;
    private ResourceType type; 
    private int capacity;
    private String location;
    private ResourceStatus status;
    private List<String> features;
    private String imageUrl; 

    // PREDICTIVE MAINTENANCE
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
    private Double currentHealthScore = 100.0; // Defaults to perfect health
    private boolean maintenanceAlert = false;
    
    // Enums to keep your data strict and avoid typos
    public enum ResourceType {
        LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT
    }

    public enum ResourceStatus {
        ACTIVE, MAINTENANCE, OUT_OF_SERVICE
    }
}
