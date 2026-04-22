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
    private Instant firstResponseAt;
    private Instant resolvedAt;
    private long slaResponseMinutes = 240;
    private long slaResolutionMinutes = 1440;
    private boolean slaResponseBreached = false;
    private boolean slaResolutionBreached = false;

    // ========== ML DAMAGE ASSESSMENT FIELDS ==========

    // e.g. "AV_EQUIPMENT", "IT_HARDWARE", "FURNITURE", etc.
    private String mlFaultCategory;

    // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    private String mlSeverity;

    // 1 = critical/highest, 4 = low priority
    private Integer mlPriorityLevel;

    // e.g. "AV_TECHNICIAN", "IT_TECHNICIAN", "ELECTRICIAN"
    private String mlAssignedTechnicianRole;

    // 2-3 sentence summary from Gemini
    private String mlSummary;

    public enum TicketStatus {
        OPEN,
        IN_PROGRESS,
        RESOLVED,
        CLOSED
    }
}
