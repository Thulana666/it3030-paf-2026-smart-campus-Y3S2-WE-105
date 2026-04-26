package com.smartcampus.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

/**
 * ResourceImage Model - Stores images associated with resources
 * Multiple images can be associated with a single resource
 */
@Document(collection = "resource_images")
public class ResourceImage {
    @Id
    private String id;

    private String resourceId;           // Foreign key to Resource
    private String fileName;             // Original file name
    private String mimeType;             // e.g., image/jpeg, image/png
    private long fileSize;               // File size in bytes
    private String imageData;            // Base64 encoded image data
    private boolean isPrimary;           // Whether this is the primary/featured image
    private String description;          // Optional image description
    private String uploadedBy;           // User ID who uploaded the image
    private LocalDateTime uploadedAt;    // Timestamp of upload
    private LocalDateTime updatedAt;     // Last update timestamp

    // Constructors
    public ResourceImage() {
        this.uploadedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isPrimary = false;
    }

    public ResourceImage(String resourceId, String fileName, String mimeType, 
                        long fileSize, String imageData, String uploadedBy) {
        this();
        this.resourceId = resourceId;
        this.fileName = fileName;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.imageData = imageData;
        this.uploadedBy = uploadedBy;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public String getImageData() {
        return imageData;
    }

    public void setImageData(String imageData) {
        this.imageData = imageData;
    }

    public boolean isPrimary() {
        return isPrimary;
    }

    public void setPrimary(boolean primary) {
        isPrimary = primary;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
