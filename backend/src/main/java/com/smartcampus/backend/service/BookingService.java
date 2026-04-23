package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.BookingConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.*;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.UserRepository;
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
    private final com.smartcampus.backend.repository.ResourceRepository resourceRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository,
                          com.smartcampus.backend.repository.ResourceRepository resourceRepository,
                          NotificationService notificationService,
                          UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    /**
     * Resolves a studentId (which may be a MongoDB ObjectId OR an email address)
     * to the correct MongoDB user document ID required for notifications.
     * Falls back gracefully — returns the original value if lookup fails.
     */
    private String resolveUserId(String studentId) {
        if (studentId == null || studentId.isBlank()) return studentId;
        // If it looks like an email, look up by email
        if (studentId.contains("@")) {
            return userRepository.findByEmail(studentId)
                    .map(User::getId)
                    .orElse(studentId);
        }
        // Otherwise assume it's already a MongoDB ID
        return studentId;
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

        // ── Resource validation ───────────────────────────────────────────
        com.smartcampus.backend.model.Resource resource = resourceRepository.findById(booking.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", booking.getResourceId()));

        if (resource.getStatus() != com.smartcampus.backend.model.ResourceStatus.ACTIVE) {
            throw new IllegalStateException("This resource is currently " + resource.getStatus() + " and cannot be booked.");
        }

        // ── Conflict check (Strict: block if any PENDING or APPROVED overlap exists) ──
        List<Booking> conflicts = bookingRepository.findOverlappingBookings(
                booking.getResourceId(),
                booking.getStartTime(),
                booking.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            log.warn("Booking conflict detected for resource '{}': {} active booking(s) overlap",
                    booking.getResourceId(), conflicts.size());
            throw new BookingConflictException(
                    "Resource is already reserved or requested for this time: " + booking.getResourceId()
            );
        }

        // ── No conflict — enforce PENDING status and persist ──────────────
        booking.setStatus(BookingStatus.PENDING);
        Booking saved = bookingRepository.save(booking);
        log.info("Booking created successfully with id '{}' for resource '{}'",
                saved.getId(), saved.getResourceId());

        // ── Notify all ADMINs of new booking request ──────────────────────
        try {
            String resourceName = resource.getName() != null ? resource.getName() : saved.getResourceId();
            String adminMsg = "📅 New booking request for \"" + resourceName + "\" is awaiting your approval.";
            userRepository.findByRole(Role.ADMIN).forEach(admin ->
                notificationService.createNotification(admin.getId(), adminMsg, NotificationType.BOOKING)
            );
        } catch (Exception e) {
            log.warn("Failed to send admin notifications for new booking '{}': {}", saved.getId(), e.getMessage());
        }

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
    public Booking updateBookingStatus(String id, BookingStatus newStatus, String reason) {
        log.debug("Updating status of booking '{}' to {} with reason: {}", id, newStatus, reason);

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        booking.setStatus(newStatus);
        booking.setAdminReason(reason);
        Booking updated = bookingRepository.save(booking);
        log.info("Booking lifecycle update: ID {} transitioned to status {} | Admin reason logged: {}", 
                id, newStatus, (reason != null && !reason.isEmpty()));

        // ── Auto-reject overlapping pending bookings if APPROVED ──────────
        if (newStatus == BookingStatus.APPROVED) {
            List<Booking> overlappingPending = bookingRepository.findOverlappingPendingBookings(
                    updated.getResourceId(),
                    updated.getStartTime(),
                    updated.getEndTime()
            );
            
            // Exclude current booking
            overlappingPending.removeIf(b -> b.getId().equals(id));
            
            if (!overlappingPending.isEmpty()) {
                log.info("Auto-rejecting {} overlapping pending booking(s) for resource '{}'", 
                        overlappingPending.size(), updated.getResourceId());
                for (Booking pb : overlappingPending) {
                    pb.setStatus(BookingStatus.REJECTED);
                    pb.setAdminReason("Automated conflict resolution: Another request for this time slot was approved.");
                    // Notify rejected user
                    try {
                        String rejectedUserId = resolveUserId(pb.getStudentId());
                        notificationService.createNotification(
                            rejectedUserId,
                            "❌ Your booking request was rejected — another booking for the same slot was approved.",
                            NotificationType.BOOKING
                        );
                    } catch (Exception e) {
                        log.warn("Failed to notify student '{}' of auto-rejection: {}", pb.getStudentId(), e.getMessage());
                    }
                }
                bookingRepository.saveAll(overlappingPending);
            }
        }

        // ── Notify the booking owner of the status change ─────────────────
        try {
            // Resolve studentId to a real MongoDB user ID (in case it was stored as email)
            String targetUserId = resolveUserId(updated.getStudentId());
            String userMsg;
            if (newStatus == BookingStatus.APPROVED) {
                userMsg = "✅ Your booking request has been APPROVED."
                        + (reason != null && !reason.isBlank() ? " Note: " + reason : "");
            } else if (newStatus == BookingStatus.REJECTED) {
                userMsg = "❌ Your booking request has been REJECTED."
                        + (reason != null && !reason.isBlank() ? " Reason: " + reason : "");
            } else if (newStatus == BookingStatus.CANCELLED) {
                userMsg = "🚫 Your booking has been CANCELLED."
                        + (reason != null && !reason.isBlank() ? " Reason: " + reason : "");
            } else {
                userMsg = "ℹ️ Your booking status has been updated to " + newStatus + ".";
            }
            notificationService.createNotification(targetUserId, userMsg, NotificationType.BOOKING);
        } catch (Exception e) {
            log.warn("Failed to notify student of booking status change '{}': {}", id, e.getMessage());
        }

        return updated;
    }

    /**
     * Updates an existing booking.
     *
     * @param id            the MongoDB id of the booking to update
     * @param updatedBooking the new details for the booking
     * @param currentUserId the ID of the user trying to update
     * @return the updated {@link Booking} document
     * @throws ResourceNotFoundException if no booking exists
     * @throws com.smartcampus.backend.exception.UnauthorizedException if the user does not own the booking
     */
    public Booking updateBooking(String id, Booking updatedBooking, String currentUserId) {
        log.debug("Updating booking '{}' by user '{}'", id, currentUserId);
        
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
                
        if (!booking.getStudentId().equals(currentUserId)) {
            throw new com.smartcampus.backend.exception.UnauthorizedException("You do not have permission to edit this booking");
        }
        
        if (booking.getStatus() != BookingStatus.PENDING && 
            booking.getStatus() != BookingStatus.APPROVED &&
            booking.getStatus() != BookingStatus.REJECTED) {
            throw new IllegalArgumentException("Only PENDING, APPROVED, or REJECTED bookings can be edited");
        }
        
        booking.setPurpose(updatedBooking.getPurpose());
        booking.setExpectedAttendees(updatedBooking.getExpectedAttendees());
        
        // If time or resource changed, check for conflicts
        if (!booking.getStartTime().equals(updatedBooking.getStartTime()) || 
            !booking.getEndTime().equals(updatedBooking.getEndTime()) || 
            !booking.getResourceId().equals(updatedBooking.getResourceId())) {
            
            // ── Resource validation for new resource ──────────────────────────
            com.smartcampus.backend.model.Resource resource = resourceRepository.findById(updatedBooking.getResourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", updatedBooking.getResourceId()));

            if (resource.getStatus() != com.smartcampus.backend.model.ResourceStatus.ACTIVE) {
                throw new IllegalStateException("This resource is currently " + resource.getStatus() + " and cannot be booked.");
            }

            booking.setStartTime(updatedBooking.getStartTime());
            booking.setEndTime(updatedBooking.getEndTime());
            booking.setResourceId(updatedBooking.getResourceId());
            
            List<Booking> conflicts = bookingRepository.findOverlappingBookings(
                    booking.getResourceId(),
                    booking.getStartTime(),
                    booking.getEndTime()
            );
            // Ignore this booking itself
            conflicts.removeIf(b -> b.getId().equals(id));
            
            if (!conflicts.isEmpty()) {
                throw new BookingConflictException("Resource is already reserved or requested for this new time: " + booking.getResourceId());
            }
        }
        
        // Reset status to PENDING if user edited the booking
        booking.setStatus(BookingStatus.PENDING);
        booking.setAdminReason(null); // Clear previous admin feedback
        
        Booking saved = bookingRepository.save(booking);
        log.info("Booking '{}' updated successfully by user '{}'", id, currentUserId);
        return saved;
    }

    // -----------------------------------------------------------------------
    // DELETE — cancel / remove a booking
    // -----------------------------------------------------------------------

    /**
     * Permanently deletes a booking by its id.
     * Used for the {@code DELETE /api/bookings/{id}} endpoint.
     *
     * @param id            the MongoDB id of the booking to delete
     * @param currentUserId the ID of the user trying to delete
     * @throws ResourceNotFoundException if no booking exists
     * @throws com.smartcampus.backend.exception.UnauthorizedException if user doesn't own booking
     */
    public void deleteBooking(String id, String currentUserId) {
        log.debug("User action (Cancel/Delete) on booking '{}' by user '{}'", id, currentUserId);

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        if (!booking.getStudentId().equals(currentUserId)) {
            log.warn("Unauthorized delete attempt: booking owner is '{}', requester is '{}'", booking.getStudentId(), currentUserId);
            throw new com.smartcampus.backend.exception.UnauthorizedException("You do not have permission to delete this booking");
        }

        // If it's already CANCELLED or REJECTED, permanently delete it
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.REJECTED) {
            bookingRepository.deleteById(id);
            log.info("Booking '{}' permanently deleted by owner", id);
        } 
        // If it's PENDING or APPROVED, change to CANCELLED (soft delete)
        else if (booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.APPROVED) {
            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
            log.info("Booking '{}' cancelled (status set to CANCELLED)", id);
        } else {
            log.warn("Invalid delete attempt: booking '{}' status is {}", id, booking.getStatus());
            throw new IllegalArgumentException("Only PENDING, APPROVED, CANCELLED or REJECTED bookings can be processed.");
        }
    }

    /**
     * Deletes a booking indiscriminately (for admin use).
     *
     * @param id the MongoDB id of the booking to delete
     */
    public void adminDeleteBooking(String id) {
        log.debug("Admin is permanently deleting booking '{}'", id);
        if (!bookingRepository.existsById(id)) {
            throw new ResourceNotFoundException("Booking", "id", id);
        }
        bookingRepository.deleteById(id);
        log.info("Admin successfully deleted booking '{}'", id);
    }
}
