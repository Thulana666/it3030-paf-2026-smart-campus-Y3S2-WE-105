package com.smartcampus.backend.model;

/**
 * Categorises what triggered a notification.
 */
public enum NotificationType {
    BOOKING,    // Booking status change
    TICKET,     // Ticket / maintenance update
    GENERAL     // General system announcements
}
