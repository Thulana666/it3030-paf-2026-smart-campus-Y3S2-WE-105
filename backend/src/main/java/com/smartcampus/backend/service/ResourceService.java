package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.CreateResourceRequest;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceStatus;
import com.smartcampus.backend.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    // Create new resource
    public Resource createResource(CreateResourceRequest request) {
        // Validate unique resource code
        if (resourceRepository.findByResourceCode(request.getResourceCode()).isPresent()) {
            throw new IllegalArgumentException("Resource code already exists: " + request.getResourceCode());
        }

        Resource resource = new Resource(
                request.getResourceCode(),
                request.getName(),
                request.getType(),
                request.getCategory(),
                request.getCapacity(),
                request.getBuilding(),
                request.getFloor(),
                request.getLocation(),
                request.getAvailabilityStartTime(),
                request.getAvailabilityEndTime(),
                request.getDescription(),
                ResourceStatus.valueOf(request.getStatus())
        );

        return resourceRepository.save(resource);
    }

    // Get all resources
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    // Get active resources only
    public List<Resource> getActiveResources() {
        return resourceRepository.findByStatus(ResourceStatus.ACTIVE.name());
    }

    // Get resource by ID
    public Resource getResourceById(String id) {
        Optional<Resource> resource = resourceRepository.findById(id);
        if (resource.isEmpty()) {
            throw new ResourceNotFoundException("Resource not found with id: " + id);
        }
        return resource.get();
    }

    // Get resource by code
    public Resource getResourceByCode(String code) {
        Optional<Resource> resource = resourceRepository.findByResourceCode(code);
        if (resource.isEmpty()) {
            throw new ResourceNotFoundException("Resource not found with code: " + code);
        }
        return resource.get();
    }

    // Get resources by category
    public List<Resource> getResourcesByCategory(String category) {
        return resourceRepository.findByCategory(category);
    }

    // Get resources by building
    public List<Resource> getResourcesByBuilding(String building) {
        return resourceRepository.findByBuilding(building);
    }

    // Search resources by name
    public List<Resource> searchResourcesByName(String name) {
        return resourceRepository.findByNameContainingIgnoreCase(name);
    }

    // Update resource
    public Resource updateResource(String id, CreateResourceRequest request) {
        Resource resource = getResourceById(id);

        // Check if new code already exists (if different from current)
        if (!resource.getResourceCode().equals(request.getResourceCode()) &&
            resourceRepository.findByResourceCode(request.getResourceCode()).isPresent()) {
            throw new IllegalArgumentException("Resource code already exists: " + request.getResourceCode());
        }

        resource.setResourceCode(request.getResourceCode());
        resource.setName(request.getName());
        resource.setType(request.getType());
        resource.setCategory(request.getCategory());
        resource.setCapacity(request.getCapacity());
        resource.setBuilding(request.getBuilding());
        resource.setFloor(request.getFloor());
        resource.setLocation(request.getLocation());
        resource.setAvailabilityStartTime(request.getAvailabilityStartTime());
        resource.setAvailabilityEndTime(request.getAvailabilityEndTime());
        resource.setDescription(request.getDescription());
        resource.setStatus(ResourceStatus.valueOf(request.getStatus()));

        return resourceRepository.save(resource);
    }

    // Change resource status
    public Resource changeResourceStatus(String id, String newStatus) {
        Resource resource = getResourceById(id);
        resource.setStatus(ResourceStatus.valueOf(newStatus));
        return resourceRepository.save(resource);
    }

    // Upload image URL
    public Resource uploadImage(String id, String imageUrl) {
        Resource resource = getResourceById(id);
        resource.setImageUrl(imageUrl);
        return resourceRepository.save(resource);
    }

    // Update resource image URL (used by ResourceImageService)
    public Resource updateResourceImageUrl(String id, String imageUrl) {
        Resource resource = getResourceById(id);
        resource.setImageUrl(imageUrl);
        return resourceRepository.save(resource);
    }

    // Soft delete (set status to INACTIVE)
    public Resource deleteResource(String id) {
        Resource resource = getResourceById(id);
        resource.setStatus(ResourceStatus.INACTIVE);
        return resourceRepository.save(resource);
    }

    // Hard delete (permanently delete from database)
    public void hardDeleteResource(String id) {
        Resource resource = getResourceById(id); // Check if exists first
        resourceRepository.deleteById(id);
    }

    // Get resources by status
    public List<Resource> getResourcesByStatus(String status) {
        return resourceRepository.findByStatus(status);
    }
}
