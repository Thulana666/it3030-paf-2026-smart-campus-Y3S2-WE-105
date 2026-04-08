package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response body returned after a successful register or login.
 * Contains the JWT token and basic user information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    /** Bearer token to be sent in subsequent requests */
    private String token;

    private String name;
    private String email;
    private Role role;
}
