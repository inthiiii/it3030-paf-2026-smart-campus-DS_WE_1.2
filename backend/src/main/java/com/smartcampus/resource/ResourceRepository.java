package com.smartcampus.resource;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {

    List<Resource> findByType(Resource.ResourceType type);
    List<Resource> findByStatus(Resource.ResourceStatus status);
}
