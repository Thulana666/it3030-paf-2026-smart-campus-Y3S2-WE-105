package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request payload for Google Sign-In containing the secure ID token.
 */
@Data
public class GoogleAuthRequest {

    @NotBlank(message = "Google ID token is required")
    private String token;
}
