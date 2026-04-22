package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.CreateResourceRequest;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    // Get all resources (PUBLIC - accessible to all roles)
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    // Get active resources only (PUBLIC)
    @GetMapping("/active")
    public ResponseEntity<List<Resource>> getActiveResources() {
        return ResponseEntity.ok(resourceService.getActiveResources());
    }

    // Get resource by ID
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(resourceService.getResourceById(id));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Search resources by name
    @GetMapping("/search")
    public ResponseEntity<List<Resource>> searchResources(@RequestParam String keyword) {
        return ResponseEntity.ok(resourceService.searchResourcesByName(keyword));
    }

    // Get resources by category
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Resource>> getResourcesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(resourceService.getResourcesByCategory(category));
    }

    // Get resources by building
    @GetMapping("/building/{building}")
    public ResponseEntity<List<Resource>> getResourcesByBuilding(@PathVariable String building) {
        return ResponseEntity.ok(resourceService.getResourcesByBuilding(building));
    }

    // Get resources by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Resource>> getResourcesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(resourceService.getResourcesByStatus(status));
    }

    // ========== ADMIN ONLY ENDPOINTS ==========

    // Create new resource (ADMIN ONLY)
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createResource(@RequestBody CreateResourceRequest request) {
        try {
            // Validate required fields
            if (request.getResourceCode() == null || request.getResourceCode().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Resource code is required"));
            }
            if (request.getName() == null || request.getName().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
            }
            if (request.getCapacity() == null || request.getCapacity() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Capacity must be greater than 0"));
            }

            Resource created = resourceService.createResource(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Update resource (ADMIN ONLY)
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateResource(@PathVariable String id, @RequestBody CreateResourceRequest request) {
        try {
            Resource updated = resourceService.updateResource(id, request);
            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Change resource status (ADMIN ONLY)
    @PatchMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changeStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String newStatus = request.get("status");
            if (newStatus == null || newStatus.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            Resource updated = resourceService.changeResourceStatus(id, newStatus);
            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status value"));
        }
    }

    // Upload image (ADMIN ONLY)
    @PostMapping("/admin/{id}/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadImage(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String imageUrl = request.get("imageUrl");
            if (imageUrl == null || imageUrl.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Image URL is required"));
            }
            Resource updated = resourceService.uploadImage(id, imageUrl);
            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Soft delete resource (ADMIN ONLY)
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteResource(@PathVariable String id) {
        try {
            Resource deleted = resourceService.deleteResource(id);
            return ResponseEntity.ok(Map.of("message", "Resource deleted successfully", "resource", deleted));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Hard delete resource (permanent deletion) - ADMIN ONLY
    @DeleteMapping("/admin/{id}/permanent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> hardDeleteResource(@PathVariable String id) {
        try {
            resourceService.hardDeleteResource(id);
            return ResponseEntity.ok(Map.of("message", "Resource permanently deleted successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

