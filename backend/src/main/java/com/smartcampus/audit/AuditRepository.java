package com.smartcampus.audit;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditRepository extends MongoRepository<AuditLog, String> {
    // Spring magically writes a query to fetch logs sorted by newest first!
    List<AuditLog> findAllByOrderByTimestampDesc();
}