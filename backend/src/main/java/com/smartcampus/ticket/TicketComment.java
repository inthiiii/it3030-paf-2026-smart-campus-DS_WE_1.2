package com.smartcampus.ticket;

import lombok.Data;
import java.time.Instant;

@Data
public class TicketComment {

    private String authorEmail;
    private String authorName;
    private String authorRole;  // e.g. "USER", "ADMIN", "TECHNICIAN"
    private String body;
    private Instant createdAt;
}
