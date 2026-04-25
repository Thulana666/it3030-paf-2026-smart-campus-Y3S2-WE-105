package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.UploadResourceImageRequest;
import com.smartcampus.backend.dto.UpdateImageMetadataRequest;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.ResourceImage;
import com.smartcampus.backend.service.ResourceImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Resource Image Management
 * Handles image upload, retrieval, update, and deletion with role-based access control
 *
 * Roles:
 * - ADMIN: Full image management (upload, update, delete)
 * - USER: View images only
 * - TECHNICIAN: View images for repair reference
 */
@RestController
@RequestMapping("/api/resources/{resourceId}/images")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ResourceImageController {

    @Autowired
    private ResourceImageService resourceImageService;

    /**
     * Upload image for a resource (ADMIN ONLY)
     * POST /api/resources/{resourceId}/images
     *
     * @param resourceId Resource ID
     * @param request Upload request with base64 image data
     * @param authentication Authentication object to get user ID
     * @return Uploaded ResourceImage
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadImage(
            @PathVariable String resourceId,
            @RequestBody UploadResourceImageRequest request,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            ResourceImage uploaded = resourceImageService.uploadImage(resourceId, request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(uploaded);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    /**
     * Get all images for a resource (PUBLIC - authenticated users)
     * GET /api/resources/{resourceId}/images
     *
     * @param resourceId Resource ID
     * @return List of ResourceImages
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getResourceImages(@PathVariable String resourceId) {
        try {
            List<ResourceImage> images = resourceImageService.getResourceImages(resourceId);
            return ResponseEntity.ok(images);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get a specific image by ID (PUBLIC - authenticated users)
     * GET /api/resources/{resourceId}/images/{imageId}
     *
     * @param resourceId Resource ID
     * @param imageId Image ID
     * @return ResourceImage
     */
    @GetMapping("/{imageId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getImage(
            @PathVariable String resourceId,
            @PathVariable String imageId) {
        try {
            ResourceImage image = resourceImageService.getImageById(imageId);
            return ResponseEntity.ok(image);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get the primary image for a resource (PUBLIC - authenticated users)
     * GET /api/resources/{resourceId}/images/primary
     *
     * @param resourceId Resource ID
     * @return Primary ResourceImage
     */
    @GetMapping("/primary/image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getPrimaryImage(@PathVariable String resourceId) {
        try {
            ResourceImage image = resourceImageService.getPrimaryImage(resourceId);
            return ResponseEntity.ok(image);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Update image metadata (description, primary status) (ADMIN ONLY)
     * PUT /api/resources/{resourceId}/images/{imageId}
     *
     * @param resourceId Resource ID
     * @param imageId Image ID
     * @param request Update request
     * @return Updated ResourceImage
     */
    @PutMapping("/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateImageMetadata(
            @PathVariable String resourceId,
            @PathVariable String imageId,
            @RequestBody UpdateImageMetadataRequest request) {
        try {
            ResourceImage updated = resourceImageService.updateImageMetadata(imageId, request);
            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Set an image as primary (ADMIN ONLY)
     * PATCH /api/resources/{resourceId}/images/{imageId}/primary
     *
     * @param resourceId Resource ID
     * @param imageId Image ID
     * @return Updated ResourceImage
     */
    @PatchMapping("/{imageId}/primary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setAsPrimary(
            @PathVariable String resourceId,
            @PathVariable String imageId) {
        try {
            UpdateImageMetadataRequest request = new UpdateImageMetadataRequest(null, true);
            ResourceImage updated = resourceImageService.updateImageMetadata(imageId, request);
            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete an image (ADMIN ONLY)
     * DELETE /api/resources/{resourceId}/images/{imageId}
     *
     * @param resourceId Resource ID
     * @param imageId Image ID
     * @return Success message
     */
    @DeleteMapping("/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteImage(
            @PathVariable String resourceId,
            @PathVariable String imageId) {
        try {
            resourceImageService.deleteImage(imageId);
            return ResponseEntity.ok(Map.of(
                    "message", "Image deleted successfully",
                    "imageId", imageId
            ));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get image count for a resource (PUBLIC - authenticated users)
     * GET /api/resources/{resourceId}/images/count
     *
     * @param resourceId Resource ID
     * @return Image count
     */
    @GetMapping("/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getImageCount(@PathVariable String resourceId) {
        try {
            long count = resourceImageService.getImageCount(resourceId);
            return ResponseEntity.ok(Map.of("resourceId", resourceId, "imageCount", count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
