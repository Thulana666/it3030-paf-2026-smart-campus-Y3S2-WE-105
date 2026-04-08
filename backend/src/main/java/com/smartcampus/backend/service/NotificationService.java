package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.NotificationResponse;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.Notification;
import com.smartcampus.backend.model.NotificationType;
import com.smartcampus.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service responsible for all Notification operations:
 *
 *  - Fetching notifications for the authenticated user
 *  - Marking a notification as read
 *  - Creating notifications (called internally by Booking / Ticket services)
 *
 * Future booking/ticket services should inject this service and call
 * createNotification() whenever a status-changing event occurs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // -------------------------------------------------------
    // Read operations
    // -------------------------------------------------------

    /**
     * Returns all notifications for the given user, newest first.
     */
    public List<NotificationResponse> getUserNotifications(String userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------
    // Write operations
    // -------------------------------------------------------

    /**
     * Marks a single notification as read.
     *
     * @param notificationId the MongoDB document ID
     * @return the updated notification
     * @throws ResourceNotFoundException if no notification with that ID exists
     */
    public NotificationResponse markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification", "id", notificationId));

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);

        log.info("Notification {} marked as read", notificationId);
        return NotificationResponse.from(saved);
    }

    /**
     * Creates and persists a new notification for a user.
     *
     * This method is called by other services (Booking, Ticket) to
     * trigger notifications on status-change events.
     *
     * Example usage in BookingService:
     *   notificationService.createNotification(
     *       booking.getUserId(),
     *       "Your booking for Room A has been APPROVED",
     *       NotificationType.BOOKING
     *   );
     *
     * @param userId  recipient user ID
     * @param message notification text
     * @param type    category (BOOKING / TICKET / GENERAL)
     * @return the saved notification as a response DTO
     */
    public NotificationResponse createNotification(
            String userId,
            String message,
            NotificationType type) {

        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .type(type)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Notification created for user {} — type: {}", userId, type);
        return NotificationResponse.from(saved);
    }
}
