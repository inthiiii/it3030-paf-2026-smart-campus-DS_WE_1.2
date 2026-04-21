package com.smartcampus.ticket;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TicketRepository extends MongoRepository<Ticket, String> {

    // Used by the user to find their own tickets
    List<Ticket> findByReporterEmailOrderByCreatedAtDesc(String reporterEmail);

    // Used by admin/technician to find all tickets sorted newest-first
    List<Ticket> findAllByOrderByCreatedAtDesc();
}
