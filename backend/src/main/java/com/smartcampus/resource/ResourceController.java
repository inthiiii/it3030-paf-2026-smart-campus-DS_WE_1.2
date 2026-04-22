package com.smartcampus.resource;

import com.smartcampus.audit.AuditService; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder; // IMPORT ADDED
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*") 
public class ResourceController {

    @Autowired
    private ResourceService service;

    @Autowired
    private AuditService auditService; // INJECTED

    // 1. POST: Create a new resource
    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        Resource created = service.createResource(resource);
        
        // LOG THE ACTION
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        auditService.logAction(userEmail, "CREATE_RESOURCE", "Added new resource: " + created.getName());
        
        return new ResponseEntity<>(created, HttpStatus.CREATED); 
    }

    // 2. GET: Retrieve all resources
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        return ResponseEntity.ok(service.getAllResources()); 
    }

    // Semantic AI Search Endpoint
    @GetMapping("/search")
    public ResponseEntity<List<Resource>> searchResources(@RequestParam("q") String query) {
        List<Resource> results = service.semanticSearch(query);
        return ResponseEntity.ok(results);
    }

    // 3. GET: Retrieve a single resource by ID
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable String id) {
        return service.getResourceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build()); 
    }

    // 4. PUT: Update an existing resource
    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable String id, @RequestBody Resource resource) {
        try {
            Resource updated = service.updateResource(id, resource);
            
            // LOG THE ACTION
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            auditService.logAction(userEmail, "UPDATE_RESOURCE", "Updated details for: " + updated.getName());
            
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 5. DELETE: Remove a resource
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        // Fetch the resource first just so we can log its name before deleting
        service.getResourceById(id).ifPresent(resource -> {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            auditService.logAction(userEmail, "DELETE_RESOURCE", "Removed resource: " + resource.getName());
        });

        service.deleteResource(id);
        return ResponseEntity.noContent().build(); 
    }
}