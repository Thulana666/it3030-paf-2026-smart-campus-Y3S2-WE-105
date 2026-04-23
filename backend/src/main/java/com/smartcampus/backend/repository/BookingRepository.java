package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MongoDB repository for {@link Booking} documents.
 * <p>
 * Spring Data auto-generates all standard CRUD operations.
 * The custom {@link #findOverlappingBookings} query is used by the
 * service layer to enforce time-conflict rules before persisting a
 * new booking.
 * </p>
 */
@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    /**
     * Finds all existing bookings for a given resource whose time window
     * overlaps with the requested {@code [requestedStart, requestedEnd)} range.
     *
     * <p>Two intervals overlap when:
     * <pre>
     *   requestedStart  &lt;  existingEnd
     *   AND
     *   requestedEnd    &gt;  existingStart
     * </pre>
     * This correctly captures all overlap cases — partial, full, and contained.</p>
     *
     * @param resourceId     the campus resource to check (e.g., "Hall A", "Lab 1")
     * @param requestedStart inclusive start of the new booking window
     * @param requestedEnd   inclusive end of the new booking window
     * @return list of conflicting {@link Booking} documents; empty if no conflicts
     */
    @Query("{ 'resourceId': ?0, 'status': 'APPROVED', 'startTime': { $lt: ?2 }, 'endTime': { $gt: ?1 } }")
    List<Booking> findOverlappingApprovedBookings(String resourceId,
                                                  LocalDateTime requestedStart,
                                                  LocalDateTime requestedEnd);

    @Query("{ 'resourceId': ?0, 'status': 'PENDING', 'startTime': { $lt: ?2 }, 'endTime': { $gt: ?1 } }")
    List<Booking> findOverlappingPendingBookings(String resourceId,
                                                 LocalDateTime requestedStart,
                                                 LocalDateTime requestedEnd);

    @Query("{ 'resourceId': ?0, 'status': { $nin: ['REJECTED', 'CANCELLED'] }, 'startTime': { $lt: ?2 }, 'endTime': { $gt: ?1 } }")
    List<Booking> findOverlappingBookings(String resourceId,
                                          LocalDateTime requestedStart,
                                          LocalDateTime requestedEnd);

    /**
     * Retrieves all bookings belonging to a specific student, ordered
     * naturally by MongoDB insertion order.
     *
     * @param studentId the ID of the student whose bookings to retrieve
     * @return list of the student's {@link Booking} documents
     */
    List<Booking> findByStudentId(String studentId);
}
