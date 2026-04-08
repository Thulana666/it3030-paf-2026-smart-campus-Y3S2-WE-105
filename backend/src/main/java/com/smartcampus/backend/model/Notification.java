package com.smartcampus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * MongoDB document representing a notification sent to a specific user.
 * Notifications are created by services (e.g. booking/ticket services)
 * and consumed through the NotificationController.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    /** The ID of the user this notification belongs to */
    private String userId;

    /** Human-readable notification message */
    private String message;

    /** Category of the event that triggered this notification */
    private NotificationType type;

    /** Whether the user has read/acknowledged this notification */
    @Builder.Default
    private boolean read = false;

    /** When the notification was created */
    private LocalDateTime createdAt;
}
