package com.smartcampus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * MongoDB document representing a campus resource booking.
 * <p>
 * Stores the essential fields needed to schedule and validate
 * reservations for shared resources (halls, labs, etc.).
 * Conflict detection is handled at the service layer by checking
 * for overlapping {@code startTime}/{@code endTime} windows on
 * the same {@code resourceId}.
 * </p>
 *
 * @see com.smartcampus.backend.service.BookingService
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {

    /** Auto-generated MongoDB ObjectId (hex string). */
    @Id
    private String id;

    /**
     * Identifier of the campus resource being booked
     * (e.g., "Hall A", "Lab 1", "Meeting Room 3").
     */
    private String resourceId;

    /**
     * Student / user ID of the person making the booking.
     * Typically the authenticated user's ID from the {@code users} collection.
     */
    private String studentId;

    /** Inclusive start of the requested reservation window. */
    private LocalDateTime startTime;

    /** Inclusive end of the requested reservation window. */
    private LocalDateTime endTime;

    /** Brief description of why the resource is being booked. */
    private String purpose;

    /**
     * Current lifecycle status of the booking.
     * Defaults to {@link BookingStatus#PENDING} on creation and
     * can be updated to {@code APPROVED} or {@code REJECTED} by staff.
     */
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;
}
