package com.smartcampus.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown by {@link com.smartcampus.backend.service.BookingService} when a new
 * booking request overlaps with an already-existing booking for the same
 * campus resource.
 *
 * <p>Maps to HTTP {@code 409 Conflict} — semantically correct because the
 * request is well-formed but cannot be fulfilled due to a state conflict
 * in the resource's schedule.</p>
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class BookingConflictException extends RuntimeException {

    public BookingConflictException(String message) {
        super(message);
    }
}
