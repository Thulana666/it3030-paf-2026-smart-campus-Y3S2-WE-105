package com.smartcampus.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standardised error response body returned by GlobalExceptionHandler.
 * Every error — 400, 401, 404, 500 — uses this envelope.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    /** HTTP status code (e.g. 400, 401, 404, 500) */
    private int status;

    /** Human-readable error message */
    private String message;

    /** Timestamp when the error occurred */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
