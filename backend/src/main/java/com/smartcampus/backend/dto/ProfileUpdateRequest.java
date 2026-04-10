package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Payload struct for updating non-secure user profile variables.
 */
@Data
public class ProfileUpdateRequest {
    
    @NotBlank(message = "Name cannot be completely empty")
    private String name;
    
    /** Optional direct URL pointing to an uploaded user avatar */
    private String profilePicture;
}
