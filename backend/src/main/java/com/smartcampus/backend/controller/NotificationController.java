package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.NotificationResponse;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the Notification system.
 *
 * All endpoints require authentication (Bearer token).
 * The logged-in user's ID is resolved from the JWT via @AuthenticationPrincipal.
 *
 * Endpoints:
 *  GET  /api/notifications         → get all notifications for the current user
 *  PUT  /api/notifications/{id}/read → mark a notification as read
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /**
     * GET /api/notifications
     *
     * Returns all notifications belonging to the authenticated user,
     * ordered by createdAt descending (newest first).
     *
     * Requires: Authorization: Bearer <token>
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        // Resolve the MongoDB user ID from the principal's email
        String userId = resolveUserId(userDetails.getUsername());
        List<NotificationResponse> notifications =
                notificationService.getUserNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * PUT /api/notifications/{id}/read
     *
     * Marks a specific notification as read.
     * Returns 200 OK with the updated notification.
     * Returns 404 if the notification ID does not exist.
     *
     * Requires: Authorization: Bearer <token>
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable String id) {
        NotificationResponse updated = notificationService.markAsRead(id);
        return ResponseEntity.ok(updated);
    }

    // -------------------------------------------------------
    // Helper
    // -------------------------------------------------------

    /**
     * Looks up the MongoDB user document by email to get the user's String ID.
     * This bridges the email-based JWT principal to the userId stored in notifications.
     */
    private String resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in DB"));
    }
}
