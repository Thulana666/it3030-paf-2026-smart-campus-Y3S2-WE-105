package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.UploadResourceImageRequest;
import com.smartcampus.backend.dto.UpdateImageMetadataRequest;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceImage;
import com.smartcampus.backend.repository.ResourceImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing resource images
 * Handles upload, update, delete operations with validation
 */
@Service
public class ResourceImageService {

    @Autowired
    private ResourceImageRepository resourceImageRepository;

    @Autowired
    private ResourceService resourceService;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final String[] ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"};

    /**
     * Upload a new image for a resource
     * @param resourceId The resource ID
     * @param request Upload request with image data
     * @param userId User ID of the uploader
     * @return Uploaded ResourceImage
     */
    public ResourceImage uploadImage(String resourceId, UploadResourceImageRequest request, String userId) {
        // Validate resource exists
        Resource resource = resourceService.getResourceById(resourceId);

        // Validate image data
        validateImageData(request);

        // If this is set as primary, unset any existing primary images
        if (request.isPrimary()) {
            Optional<ResourceImage> primaryImage = resourceImageRepository
                    .findByResourceIdAndIsPrimaryTrue(resourceId);
            if (primaryImage.isPresent()) {
                ResourceImage existing = primaryImage.get();
                existing.setPrimary(false);
                resourceImageRepository.save(existing);
            }
        }

        // Create and save new image
        ResourceImage image = new ResourceImage(
                resourceId,
                request.getFileName(),
                request.getMimeType(),
                request.getImageData().length(), // Approximate size of base64 string
                request.getImageData(),
                userId
        );
        image.setDescription(request.getDescription());
        image.setPrimary(request.isPrimary());

        ResourceImage saved = resourceImageRepository.save(image);

        // Update resource's imageUrl if this is the primary image
        if (request.isPrimary()) {
            resource.setImageUrl("data:" + request.getMimeType() + ";base64," + request.getImageData());
            resourceService.updateResourceImageUrl(resourceId, resource.getImageUrl());
        }

        return saved;
    }

    /**
     * Get all images for a resource
     */
    public List<ResourceImage> getResourceImages(String resourceId) {
        resourceService.getResourceById(resourceId); // Validate resource exists
        return resourceImageRepository.findByResourceId(resourceId);
    }

    /**
     * Get a specific image by ID
     */
    public ResourceImage getImageById(String imageId) {
        Optional<ResourceImage> image = resourceImageRepository.findById(imageId);
        if (image.isEmpty()) {
            throw new ResourceNotFoundException("Image not found with id: " + imageId);
        }
        return image.get();
    }

    /**
     * Get the primary image for a resource
     */
    public ResourceImage getPrimaryImage(String resourceId) {
        resourceService.getResourceById(resourceId); // Validate resource exists
        Optional<ResourceImage> primaryImage = resourceImageRepository
                .findByResourceIdAndIsPrimaryTrue(resourceId);
        if (primaryImage.isEmpty()) {
            throw new ResourceNotFoundException("No primary image found for resource: " + resourceId);
        }
        return primaryImage.get();
    }

    /**
     * Update image metadata (description, primary status)
     */
    public ResourceImage updateImageMetadata(String imageId, UpdateImageMetadataRequest request) {
        ResourceImage image = getImageById(imageId);

        image.setDescription(request.getDescription());
        image.setUpdatedAt(LocalDateTime.now());

        // If setting as primary, unset other primary images for this resource
        if (request.isPrimary() && !image.isPrimary()) {
            Optional<ResourceImage> currentPrimary = resourceImageRepository
                    .findByResourceIdAndIsPrimaryTrue(image.getResourceId());
            if (currentPrimary.isPresent()) {
                ResourceImage existing = currentPrimary.get();
                existing.setPrimary(false);
                resourceImageRepository.save(existing);
            }

            image.setPrimary(true);

            // Update resource's imageUrl
            Resource resource = resourceService.getResourceById(image.getResourceId());
            String imageUrl = "data:" + image.getMimeType() + ";base64," + image.getImageData();
            resource.setImageUrl(imageUrl);
            resourceService.updateResourceImageUrl(image.getResourceId(), imageUrl);
        }

        return resourceImageRepository.save(image);
    }

    /**
     * Delete an image
     */
    public void deleteImage(String imageId) {
        ResourceImage image = getImageById(imageId);

        // If this was the primary image, clear resource's imageUrl
        if (image.isPrimary()) {
            Resource resource = resourceService.getResourceById(image.getResourceId());
            resource.setImageUrl(null);
            resourceService.updateResourceImageUrl(image.getResourceId(), null);

            // Try to set another image as primary if available
            List<ResourceImage> remainingImages = resourceImageRepository
                    .findByResourceId(image.getResourceId());
            if (!remainingImages.isEmpty()) {
                ResourceImage newPrimary = remainingImages.stream()
                        .filter(img -> !img.getId().equals(imageId))
                        .findFirst()
                        .orElse(null);
                if (newPrimary != null) {
                    newPrimary.setPrimary(true);
                    resourceImageRepository.save(newPrimary);
                    String newImageUrl = "data:" + newPrimary.getMimeType() + ";base64," 
                            + newPrimary.getImageData();
                    resource.setImageUrl(newImageUrl);
                    resourceService.updateResourceImageUrl(image.getResourceId(), newImageUrl);
                }
            }
        }

        resourceImageRepository.deleteById(imageId);
    }

    /**
     * Delete all images for a resource (typically called when resource is deleted)
     */
    public long deleteResourceImages(String resourceId) {
        return resourceImageRepository.deleteByResourceId(resourceId);
    }

    /**
     * Get image count for a resource
     */
    public long getImageCount(String resourceId) {
        return resourceImageRepository.countByResourceId(resourceId);
    }

    /**
     * Validate image data
     */
    private void validateImageData(UploadResourceImageRequest request) {
        if (request.getImageData() == null || request.getImageData().isEmpty()) {
            throw new IllegalArgumentException("Image data is required");
        }

        if (request.getFileName() == null || request.getFileName().isEmpty()) {
            throw new IllegalArgumentException("File name is required");
        }

        if (request.getMimeType() == null || request.getMimeType().isEmpty()) {
            throw new IllegalArgumentException("MIME type is required");
        }

        // Check if MIME type is allowed
        boolean isAllowed = false;
        for (String allowedType : ALLOWED_MIME_TYPES) {
            if (request.getMimeType().equals(allowedType)) {
                isAllowed = true;
                break;
            }
        }
        if (!isAllowed) {
            throw new IllegalArgumentException("MIME type not allowed. Allowed types: " + 
                    String.join(", ", ALLOWED_MIME_TYPES));
        }

        // Validate approximate file size (base64 encoded size)
        long approximateSize = (request.getImageData().length() * 3) / 4; // Rough estimate
        if (approximateSize > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 5MB");
        }
    }
}
