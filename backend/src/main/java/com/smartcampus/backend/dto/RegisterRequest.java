package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for POST /api/auth/register.
 * Validated automatically via @Valid in the controller.
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    /**
     * Optional role assignment.
     * Defaults to USER if not provided — ADMIN/TECHNICIAN accounts
     * should be seeded by a privileged administrator.
     */
    private Role role;
}
