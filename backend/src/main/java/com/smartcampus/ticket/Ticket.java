package com.smartcampus.ticket;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    // Who submitted it
    private String reporterEmail;
    private String reporterName;

    // Ticket details
    private String title;
    private String description;
    private String location;

    // Up to 3 images stored as Base64 strings
    private List<String> imageBase64 = new ArrayList<>();

    // State machine
    private TicketStatus status = TicketStatus.OPEN;

    // Comment thread
    private List<TicketComment> comments = new ArrayList<>();

    // Timestamps
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    // ========== SLA TRACKING FIELDS ==========

    // When staff (ADMIN/TECHNICIAN) posts the first comment
    private Instant firstResponseAt;

    // When status is changed to RESOLVED
    private Instant resolvedAt;

    // SLA targets in minutes (defaults: 4 hours and 24 hours)
    private long slaResponseMinutes = 240;    // 4 hours
    private long slaResolutionMinutes = 1440; // 24 hours

    // Whether each SLA was breached
    private boolean slaResponseBreached = false;
    private boolean slaResolutionBreached = false;

    public enum TicketStatus {
        OPEN,
        IN_PROGRESS,
        RESOLVED,
        CLOSED
    }
}
