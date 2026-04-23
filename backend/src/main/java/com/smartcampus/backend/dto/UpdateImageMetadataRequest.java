package com.smartcampus.backend.dto;

/**
 * DTO for updating image metadata (description, primary status, etc.)
 */
public class UpdateImageMetadataRequest {
    private String description;      // Image description
    private boolean isPrimary;       // Whether to set as primary image

    // Constructors
    public UpdateImageMetadataRequest() {}

    public UpdateImageMetadataRequest(String description, boolean isPrimary) {
        this.description = description;
        this.isPrimary = isPrimary;
    }

    // Getters and Setters
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
