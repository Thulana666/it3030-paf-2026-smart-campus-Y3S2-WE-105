package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Module B: Booking Management and Conflict Checking.
 *
 * <p>All endpoints are prefixed with {@code /api/bookings}.
 * Business rules (time-conflict detection, status transitions) are
 * enforced entirely within {@link BookingService} — this layer only
 * handles HTTP concerns.</p>
 *
 * <p>Endpoints summary:
 * <pre>
 *  POST   /api/bookings                    → create a booking       (201 Created)
 *  GET    /api/bookings/user/{studentId}   → get bookings by user   (200 OK)
 *  PUT    /api/bookings/{id}/status        → update booking status  (200 OK)
 *  DELETE /api/bookings/{id}               → cancel a booking       (204 No Content)
 * </pre>
 * </p>
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // -----------------------------------------------------------------------
    // POST /api/bookings
    // -----------------------------------------------------------------------

    /**
     * Creates a new booking after validating there are no time conflicts.
     *
     * <p>Returns {@code 201 Created} with the persisted booking document on success.
     * Returns {@code 409 Conflict} if the resource is already booked for the
     * requested time window (thrown by {@link BookingService#createBooking}).</p>
     *
     * @param booking the booking details from the request body
     * @return the saved {@link Booking} with generated id and status PENDING
     */
    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking) {
        Booking created = bookingService.createBooking(booking);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // -----------------------------------------------------------------------
    // GET /api/bookings  (admin — all bookings)
    // -----------------------------------------------------------------------

    /**
     * Retrieves all bookings in the system regardless of student.
     *
     * <p>Intended for admin / staff dashboards to review and act on
     * pending reservation requests. Returns {@code 200 OK} with the
     * complete list of {@link Booking} documents.</p>
     *
     * @return list of all {@link Booking} documents across all students
     */
    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        List<Booking> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(bookings);
    }

    // -----------------------------------------------------------------------
    // GET /api/bookings/user/{studentId}
    // -----------------------------------------------------------------------

    /**
     * Retrieves all bookings associated with a specific student.
     *
     * <p>Returns {@code 200 OK} with a (possibly empty) list of bookings.</p>
     *
     * @param studentId the ID of the student whose bookings to retrieve
     * @return list of the student's {@link Booking} documents
     */
    @GetMapping("/user/{studentId}")
    public ResponseEntity<List<Booking>> getBookingsByUser(@PathVariable String studentId) {
        List<Booking> bookings = bookingService.getBookingsByUser(studentId);
        return ResponseEntity.ok(bookings);
    }

    // -----------------------------------------------------------------------
    // PUT /api/bookings/{id}/status
    // -----------------------------------------------------------------------

    /**
     * Updates the lifecycle status of an existing booking.
     *
     * <p>Intended for admin / staff use to approve or reject a pending booking.
     * Returns {@code 200 OK} with the updated booking, or {@code 404 Not Found}
     * if the booking id does not exist.</p>
     *
     * <p>Example request:
     * <pre>PUT /api/bookings/664abc123/status?status=APPROVED</pre>
     * </p>
     *
     * @param id     the MongoDB id of the booking to update
     * @param status the new {@link BookingStatus} value (PENDING / APPROVED / REJECTED)
     * @return the updated {@link Booking} document
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Booking> updateBookingStatus(
            @PathVariable String id,
            @RequestParam BookingStatus status) {
        Booking updated = bookingService.updateBookingStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    // -----------------------------------------------------------------------
    // DELETE /api/bookings/{id}
    // -----------------------------------------------------------------------

    /**
     * Cancels and permanently removes a booking by its id.
     *
     * <p>Returns {@code 204 No Content} on successful deletion, or
     * {@code 404 Not Found} if the booking id does not exist.</p>
     *
     * @param id the MongoDB id of the booking to delete
     * @return empty 204 response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelBooking(@PathVariable String id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.noContent().build();
    }
}
