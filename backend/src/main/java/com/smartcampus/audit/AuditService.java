package com.smartcampus.audit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

    @Autowired
    private AuditRepository repository;

    // Call this method anytime someone does something important!
    public void logAction(String email, String action, String details) {
        AuditLog log = new AuditLog();
        log.setUserEmail(email);
        log.setAction(action);
        log.setDetails(details);
        log.setTimestamp(LocalDateTime.now());
        repository.save(log);
    }

    public List<AuditLog> getRecentLogs() {
        return repository.findAllByOrderByTimestampDesc();
    }
}