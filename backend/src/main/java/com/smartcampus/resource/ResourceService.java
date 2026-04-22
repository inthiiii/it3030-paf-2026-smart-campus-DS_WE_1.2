package com.smartcampus.resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository repository;

    @Autowired
    private RestTemplate restTemplate;

    private final String AI_SERVICE_URL = "http://localhost:8000/api";

    public Resource createResource(Resource resource) {
        // 1. Save to MongoDB first to get the ID
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

    // --- NEW: Semantic Search Logic ---
    public List<Resource> semanticSearch(String query) {
        try {
            // 1. Ask Python to convert query to vector and search Pinecone
            Map<String, Object> payload = Map.of("query", query, "top_k", 5);
            Map response = restTemplate.postForObject(AI_SERVICE_URL + "/search", payload, Map.class);
            
            // 2. Extract the matching MongoDB IDs returned by Pinecone
            List<String> matchIds = (List<String>) response.get("matches");

            // 3. Fetch the full resource details from MongoDB using those IDs
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
            return repository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
    }
}