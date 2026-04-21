package com.smartcampus.ticket;

import lombok.Data;
import java.util.List;

@Data
public class TicketRequest {
    private String title;
    private String description;
    private String location;
    // Up to 3 base64 image strings sent from the browser
    private List<String> imageBase64;
}
