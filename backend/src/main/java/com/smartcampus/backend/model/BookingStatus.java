package com.smartcampus.backend.model;

/**
 * Lifecycle states for a {@link Booking} document.
 *
 * <ul>
 *   <li>{@code PENDING}  – Booking submitted, awaiting staff review.</li>
 *   <li>{@code APPROVED} – Booking confirmed by an admin / staff member.</li>
 *   <li>{@code REJECTED} – Booking declined (e.g., conflict or policy).</li>
 * </ul>
 */
public enum BookingStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED
}
