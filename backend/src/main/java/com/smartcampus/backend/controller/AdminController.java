package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.RegisterRequest;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for administrative operations.
 * All routes under /api/admin/** are restricted to ADMIN role via SecurityConfig.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;

    /** GET /api/admin/users — returns all registered users */
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /** POST /api/admin/users — creates a new user account with a specified role */
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@Valid @RequestBody RegisterRequest request) {
        User created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** DELETE /api/admin/users/{id} — permanently removes a user account */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully.");
    }

    /** PATCH /api/admin/users/{id}/role — updates a user's role */
    @PatchMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(
            @PathVariable String id,
            @RequestParam Role role) {
        User updated = userService.updateUserRole(id, role);
        return ResponseEntity.ok(updated);
    }
}
