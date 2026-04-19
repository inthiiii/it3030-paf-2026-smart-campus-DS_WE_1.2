package com.smartcampus.resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*") // Allows your React frontend to connect later
public class ResourceController {

    @Autowired
    private ResourceService service;

    // 1. POST: Create a new resource
    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        Resource created = service.createResource(resource);
        return new ResponseEntity<>(created, HttpStatus.CREATED); // Returns 201 Created
    }

    // 2. GET: Retrieve all resources
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        return ResponseEntity.ok(service.getAllResources()); // Returns 200 OK
    }

    // 3. GET: Retrieve a single resource by ID
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable String id) {
        return service.getResourceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build()); // Returns 404 Not Found if missing
    }

    // 4. PUT: Update an existing resource
    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable String id, @RequestBody Resource resource) {
        try {
            Resource updated = service.updateResource(id, resource);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 5. DELETE: Remove a resource
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        service.deleteResource(id);
        return ResponseEntity.noContent().build(); // Returns 204 No Content
    }
}
