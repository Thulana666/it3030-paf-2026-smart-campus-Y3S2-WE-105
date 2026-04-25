import api from './api';

/**
 * bookingService.js
 * Thin service layer that wraps every /api/bookings endpoint.
 * All methods return the Axios response data directly so callers
 * only need to hold onto the payload.
 */

const BASE = '/bookings';

// ── Create a new booking (POST /api/bookings) ────────────────────────────────
export const createBooking = async ({ resourceId, studentId, startTime, endTime, purpose, expectedAttendees }) => {
  const response = await api.post(BASE, { resourceId, studentId, startTime, endTime, purpose, expectedAttendees });
  return response.data;
};

// ── Fetch all bookings for a user (GET /api/bookings/user/:id) ────────────────
export const getBookingsByUser = async (studentId) => {
  const response = await api.get(`${BASE}/user/${studentId}`);
  return response.data;
};

// ── Update booking status – admin only (PUT /api/bookings/:id/status) ─────────
export const updateBookingStatus = async (id, status, reason = '') => {
  const response = await api.put(`${BASE}/${id}/status`, null, { params: { status, reason } });
  return response.data;
};

// ── Update an existing booking (PUT /api/bookings/:id) ──────────────────────
export const updateBooking = async (id, { resourceId, startTime, endTime, purpose, expectedAttendees }, studentId) => {
  const response = await api.put(`${BASE}/${id}`, 
    { resourceId, startTime, endTime, purpose, expectedAttendees },
    { headers: { 'studentId': studentId } }
  );
  return response.data;
};

// ── Cancel / delete a booking (DELETE /api/bookings/:id) ──────────────────────
export const cancelBooking = async (id, studentId) => {
  await api.delete(`${BASE}/${id}`, { headers: { 'studentId': studentId } });
};

// ── Fetch ALL bookings – admin only (GET /api/bookings) ────────────────────────
export const getAllBookings = async () => {
  const response = await api.get(BASE);
  return response.data;
};

// ── Delete ANY booking – admin only (DELETE /api/bookings/admin/:id) ─────────
export const deleteAnyBooking = async (id) => {
  await api.delete(`${BASE}/admin/${id}`);
};

