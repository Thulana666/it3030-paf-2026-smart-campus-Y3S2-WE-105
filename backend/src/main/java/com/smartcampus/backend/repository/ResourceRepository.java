package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {
    Optional<Resource> findByResourceCode(String resourceCode);
    List<Resource> findByStatus(String status);
    List<Resource> findByCategory(String category);
    List<Resource> findByBuilding(String building);
    List<Resource> findByNameContainingIgnoreCase(String name);
}
