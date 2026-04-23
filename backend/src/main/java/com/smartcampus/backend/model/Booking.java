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

    /** Identifier of the campus resource being booked (e.g., "Hall A", "Lab 1"). */
    private String resourceId;

    /** ID or email of the student making the reservation. */
    private String studentId;

    /** Start timestamp of the booking window. */
    private LocalDateTime startTime;

    /** End timestamp of the booking window. */
    private LocalDateTime endTime;

    /** Detailed purpose or description for the reservation. */
    private String purpose;

    /** Estimated number of attendees for the session. */
    private Integer expectedAttendees;

    /** Justification or feedback provided by the administrator. */
    private String adminReason;

    /** Current lifecycle status (PENDING, APPROVED, REJECTED, CANCELLED). */
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;
}
