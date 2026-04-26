package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.ResourceImage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repository for ResourceImage entity
 * Provides database operations for managing resource images
 */
@Repository
public interface ResourceImageRepository extends MongoRepository<ResourceImage, String> {
    
    /**
     * Find all images for a specific resource
     */
    List<ResourceImage> findByResourceId(String resourceId);
    
    /**
     * Find the primary image for a resource
     */
    Optional<ResourceImage> findByResourceIdAndIsPrimaryTrue(String resourceId);
    
    /**
     * Find all images uploaded by a specific user
     */
    List<ResourceImage> findByUploadedBy(String userId);
    
    /**
     * Delete all images for a resource (cleanup when resource is deleted)
     */
    long deleteByResourceId(String resourceId);
    
    /**
     * Count images for a resource
     */
    long countByResourceId(String resourceId);
}
