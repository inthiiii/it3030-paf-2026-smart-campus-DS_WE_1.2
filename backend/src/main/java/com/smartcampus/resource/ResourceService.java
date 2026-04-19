package com.smartcampus.resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository repository;

    public Resource createResource(Resource resource) {
        // Here you can add future logic, like generating the 'searchableText' for the ML pipeline
        return repository.save(resource);
    }

    public List<Resource> getAllResources() {
        return repository.findAll();
    }

    public Optional<Resource> getResourceById(String id) {
        return repository.findById(id);
    }

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

    public void deleteResource(String id) {
        repository.deleteById(id);
    }
}
