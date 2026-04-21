package com.smartcampus.backend.dto;

/**
 * DTO for uploading resource images
 * Contains base64 encoded image data and metadata
 */
public class UploadResourceImageRequest {
    private String fileName;              // Original file name
    private String mimeType;              // e.g., image/jpeg
    private String imageData;             // Base64 encoded image
    private String description;           // Optional description
    private boolean isPrimary;            // Whether to set as primary image

    // Constructors
    public UploadResourceImageRequest() {}

    public UploadResourceImageRequest(String fileName, String mimeType, 
                                     String imageData, String description, boolean isPrimary) {
        this.fileName = fileName;
        this.mimeType = mimeType;
        this.imageData = imageData;
        this.description = description;
        this.isPrimary = isPrimary;
    }

    // Getters and Setters
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

    public String getImageData() {
        return imageData;
    }

    public void setImageData(String imageData) {
        this.imageData = imageData;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isPrimary() {
        return isPrimary;
    }

    public void setPrimary(boolean primary) {
        isPrimary = primary;
    }
}
