package com.smartcampus.audit;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Document(collection = "audit_logs")
public class AuditLog {
    @Id
    private String id;
    private String userEmail;
    private String action; // e.g., "LOGIN", "CREATE_RESOURCE", "PROMOTE_USER"
    private String details;
    private LocalDateTime timestamp;
}