package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.BookingConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.repository.BookingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service layer for Module B: Booking Management and Conflict Checking.
 *
 * <p>All business rules are enforced here — especially the time-conflict
 * guard in {@link #createBooking}, which delegates to the repository's
 * {@code findOverlappingBookings} query before persisting any new booking.</p>
 *
 * <p>Constructor injection is used deliberately (no {@code @Autowired}) so
 * that the dependency is final, immutable, and easily testable.</p>
 */
@Slf4j
@Service
public class BookingService {

    private final BookingRepository bookingRepository;

    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    // -----------------------------------------------------------------------
    // CREATE — with time-conflict guard
    // -----------------------------------------------------------------------

    /**
     * Creates and persists a new booking after validating that no conflicting
     * booking already exists for the same resource in the requested time window.
     *
     * <p>Conflict rule:
     * <pre>
     *   requestedStart &lt; existingEnd  AND  requestedEnd &gt; existingStart
     * </pre>
     * If any overlap is found, a {@link BookingConflictException} is thrown
     * and mapped to HTTP 409 by the global exception handler.</p>
     *
     * @param booking the incoming booking request (status field is ignored on input)
     * @return the saved {@link Booking} document with a generated id and status PENDING
     * @throws BookingConflictException if the resource is already booked for the time range
     */
    public Booking createBooking(Booking booking) {
        log.debug("Creating booking for resource '{}' from {} to {}",
                booking.getResourceId(), booking.getStartTime(), booking.getEndTime());

        // ── Conflict check ────────────────────────────────────────────────
        List<Booking> conflicts = bookingRepository.findOverlappingBookings(
                booking.getResourceId(),
                booking.getStartTime(),
                booking.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            log.warn("Booking conflict detected for resource '{}': {} overlapping booking(s)",
                    booking.getResourceId(), conflicts.size());
            throw new BookingConflictException(
                    "Resource is already booked for this time: " + booking.getResourceId()
            );
        }

        // ── No conflict — enforce PENDING status and persist ──────────────
        booking.setStatus(BookingStatus.PENDING);
        Booking saved = bookingRepository.save(booking);
        log.info("Booking created successfully with id '{}' for resource '{}'",
                saved.getId(), saved.getResourceId());
        return saved;
    }

    // -----------------------------------------------------------------------
    // READ — bookings by student
    // -----------------------------------------------------------------------

    /**
     * Retrieves all bookings submitted by a specific student.
     *
     * @param studentId the student whose bookings to fetch
     * @return list of bookings (may be empty if the student has no bookings)
     */
    public List<Booking> getBookingsByUser(String studentId) {
        log.debug("Fetching bookings for studentId '{}'", studentId);
        return bookingRepository.findByStudentId(studentId);
    }

    // -----------------------------------------------------------------------
    // READ — all bookings (admin)
    // -----------------------------------------------------------------------

    /**
     * Retrieves every booking in the collection regardless of student.
     *
     * <p>Intended for admin / staff use only. The controller layer is
     * responsible for enforcing role-based access control before calling
     * this method.</p>
     *
     * @return complete list of all {@link Booking} documents
     */
    public List<Booking> getAllBookings() {
        log.debug("Admin: fetching all bookings");
        return bookingRepository.findAll();
    }

    // -----------------------------------------------------------------------
    // UPDATE — change booking status
    // -----------------------------------------------------------------------

    /**
     * Updates the status of an existing booking (e.g., PENDING → APPROVED).
     *
     * @param id        the MongoDB id of the booking to update
     * @param newStatus the new {@link BookingStatus} to apply
     * @return the updated {@link Booking} document
     * @throws ResourceNotFoundException if no booking exists for the given id
     */
    public Booking updateBookingStatus(String id, BookingStatus newStatus) {
        log.debug("Updating status of booking '{}' to {}", id, newStatus);

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        booking.setStatus(newStatus);
        Booking updated = bookingRepository.save(booking);
        log.info("Booking '{}' status updated to {}", id, newStatus);
        return updated;
    }

    // -----------------------------------------------------------------------
    // DELETE — cancel / remove a booking
    // -----------------------------------------------------------------------

    /**
     * Permanently deletes a booking by its id.
     * Used for the {@code DELETE /api/bookings/{id}} endpoint.
     *
     * @param id the MongoDB id of the booking to delete
     * @throws ResourceNotFoundException if no booking exists for the given id
     */
    public void cancelBooking(String id) {
        log.debug("Cancelling booking '{}'", id);

        // Verify the booking exists before attempting deletion
        if (!bookingRepository.existsById(id)) {
            throw new ResourceNotFoundException("Booking", "id", id);
        }

        bookingRepository.deleteById(id);
        log.info("Booking '{}' cancelled and removed successfully", id);
    }
}
