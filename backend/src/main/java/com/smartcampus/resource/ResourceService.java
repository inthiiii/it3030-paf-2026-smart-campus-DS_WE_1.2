package com.smartcampus.resource;

import com.smartcampus.booking.Booking;
import com.smartcampus.booking.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository repository;

    @Autowired
    private BookingRepository bookingRepository; // To calculate Wear and Tear

    @Autowired
    private RestTemplate restTemplate;

    private final String AI_SERVICE_URL = "http://localhost:8000/api";

    public Resource createResource(Resource resource) {
        // 1. Save to MongoDB first to get the ID
        if (resource.getCreatedAt() == null) {
            resource.setCreatedAt(LocalDateTime.now());
        }
        Resource savedResource = repository.save(resource);

        // 2. Build the descriptive text for the AI to understand
        String featuresText = resource.getFeatures() != null ? String.join(", ", resource.getFeatures()) : "";
        String textToEmbed = savedResource.getName() + ". Type: " + savedResource.getType() + 
                             ". Location: " + savedResource.getLocation() + ". Features: " + featuresText;

        // 3. Send to Python/Pinecone (Fire and Forget)
        try {
            Map<String, String> payload = Map.of(
                "id", savedResource.getId(),
                "text", textToEmbed
            );
            restTemplate.postForObject(AI_SERVICE_URL + "/index", payload, String.class);
            System.out.println("✅ Successfully indexed resource in Pinecone: " + savedResource.getName());
        } catch (Exception e) {
            System.err.println("⚠️ Failed to index in Pinecone. Is the Python server running? " + e.getMessage());
        }

        return savedResource;
    }

    // --- SEMANTIC SEARCH LOGIC ---
    public List<Resource> semanticSearch(String query) {
        try {
            Map<String, Object> payload = Map.of("query", query, "top_k", 5);
            Map response = restTemplate.postForObject(AI_SERVICE_URL + "/search", payload, Map.class);
            
            List<String> matchIds = (List<String>) response.get("matches");

            if (matchIds != null && !matchIds.isEmpty()) {
                List<Resource> resources = repository.findAllById(matchIds);
                return matchIds.stream()
                        .map(id -> resources.stream().filter(r -> r.getId().equals(id)).findFirst().orElse(null))
                        .filter(r -> r != null)
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            System.err.println("⚠️ Semantic Search Failed: " + e.getMessage());
        }
        return List.of(); 
    }

    // --- PREDICTIVE MAINTENANCE LOGIC ---
    
    // This autonomous robot runs in the background. 
    // Right now, it runs every 60 seconds (60000ms) so can test
    @Scheduled(fixedRate = 60000)
    public void runAutonomousHealthCheck() {
        System.out.println("⚙️ [AI_CRON] Running Autonomous Asset Health Diagnostics...");
        List<Resource> allResources = repository.findAll();
        
        for (Resource resource : allResources) {
            updateResourceHealth(resource);
        }
    }

    public void updateResourceHealth(Resource resource) {
        try {
            // 1. Calculate how many hours this room has been used
            List<Booking> pastBookings = bookingRepository.findByResourceIdOrderByStartTimeAsc(resource.getId());
            double totalHours = 0;
            
            for (Booking b : pastBookings) {
                // Only count confirmed or completed bookings as "wear and tear"
                if (b.getStatus() == Booking.BookingStatus.COMPLETED || b.getStatus() == Booking.BookingStatus.CONFIRMED) {
                    totalHours += Duration.between(b.getStartTime(), b.getEndTime()).toMinutes() / 60.0;
                }
            }

            // 2. Calculate asset age in days
            LocalDateTime createdAt = resource.getCreatedAt() != null ? resource.getCreatedAt() : LocalDateTime.now();
            long ageInDays = ChronoUnit.DAYS.between(createdAt, LocalDateTime.now());

            // 3. Ask Python AI for the health forecast
            Map<String, Object> payload = Map.of(
                "asset_type", resource.getType(),
                "total_booked_hours", totalHours,
                "age_in_days", ageInDays
            );

            Map response = restTemplate.postForObject(AI_SERVICE_URL + "/assets/predict-health", payload, Map.class);
            
            Double healthScore = (Double) response.get("health_score");
            Boolean needsMaintenance = (Boolean) response.get("needs_maintenance");

            resource.setCurrentHealthScore(healthScore);
            resource.setMaintenanceAlert(needsMaintenance);
            
            // 4. AUTONOMOUS ACTION: If the AI says it's critical, take the room offline instantly!
            if (needsMaintenance && resource.getStatus() != Resource.ResourceStatus.MAINTENANCE) {
                resource.setStatus(Resource.ResourceStatus.MAINTENANCE);
                System.out.println("🚨 AI AUTO-LOCKED RESOURCE: " + resource.getName() + " (Health: " + healthScore + "%)");
            }

            repository.save(resource);

        } catch (Exception e) {
            
        }
    }

    // --- STANDARD CRUD OPERATIONS ---
    public List<Resource> getAllResources() { return repository.findAll(); }
    
    public Optional<Resource> getResourceById(String id) { return repository.findById(id); }
    
    public void deleteResource(String id) { repository.deleteById(id); }
    
    public Resource updateResource(String id, Resource updatedResource) {
        return repository.findById(id).map(existing -> {
            existing.setName(updatedResource.getName());
            existing.setType(updatedResource.getType());
            existing.setCapacity(updatedResource.getCapacity());
            existing.setLocation(updatedResource.getLocation());
            existing.setStatus(updatedResource.getStatus());
            existing.setFeatures(updatedResource.getFeatures());
            existing.setImageUrl(updatedResource.getImageUrl());
            return repository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
    }
}