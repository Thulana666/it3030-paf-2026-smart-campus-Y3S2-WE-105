import api from './api';

/**
 * bookingService.js
 * Thin service layer that wraps every /api/bookings endpoint.
 * All methods return the Axios response data directly so callers
 * only need to hold onto the payload.
 */

const BASE = '/bookings';

// ── Create a new booking (POST /api/bookings) ────────────────────────────────
export const createBooking = async ({ resourceId, studentId, startTime, endTime, purpose }) => {
  const response = await api.post(BASE, { resourceId, studentId, startTime, endTime, purpose });
  return response.data;
};

// ── Fetch all bookings for a user (GET /api/bookings/user/:id) ────────────────
export const getBookingsByUser = async (studentId) => {
  const response = await api.get(`${BASE}/user/${studentId}`);
  return response.data;
};

// ── Update booking status – admin only (PUT /api/bookings/:id/status) ─────────
export const updateBookingStatus = async (id, status) => {
  const response = await api.put(`${BASE}/${id}/status`, null, { params: { status } });
  return response.data;
};

// ── Cancel / delete a booking (DELETE /api/bookings/:id) ──────────────────────
export const cancelBooking = async (id) => {
  await api.delete(`${BASE}/${id}`);
};
