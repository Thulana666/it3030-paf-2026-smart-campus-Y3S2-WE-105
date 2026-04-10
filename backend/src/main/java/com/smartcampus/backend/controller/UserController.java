package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.AuthResponse;
import com.smartcampus.backend.dto.PasswordChangeRequest;
import com.smartcampus.backend.dto.ProfileUpdateRequest;
import com.smartcampus.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * PUT /api/users/profile
     * Endpoint completely protected by implicit JWT Security filters.
     * Extracts exact caller from memory instead of trusting request bodies.
     */
    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        String validatedEmailContext = SecurityContextHolder.getContext().getAuthentication().getName();
        AuthResponse updatedResponsePayload = userService.updateProfile(validatedEmailContext, request);
        return ResponseEntity.ok(updatedResponsePayload);
    }

    /**
     * POST /api/users/change-password
     * Verifies old credentials before updating to new ones.
     */
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.changePassword(email, request);
        return ResponseEntity.ok("Password changed successfully!");
    }
}
