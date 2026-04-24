package com.smartcampus.ticket;

import lombok.Data;

@Data
public class StatusUpdateRequest {
    private String status; // "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"
}
