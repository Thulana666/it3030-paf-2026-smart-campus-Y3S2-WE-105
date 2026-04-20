import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  createBooking,
  getBookingsByUser,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
} from '../../services/bookingService';


// ── Campus resources available for booking ────────────────────────────────────
const RESOURCES = [
  'Hall A',
  'Hall B',
  'Auditorium',
  'Lab 1',
  'Lab 2',
  'Lab 3',
  'Meeting Room 1',
  'Meeting Room 2',
];

// ── Status badge meta ─────────────────────────────────────────────────────────
const STATUS_META = {
  PENDING:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  APPROVED: { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  REJECTED: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const toIso = (local) => (local ? new Date(local).toISOString() : '');

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  resourceId: RESOURCES[0],
  startTime:  '',
  endTime:    '',
  purpose:    '',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function BookingSystem() {
  const { user } = useContext(AuthContext);

  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState('');
  const [conflictMsg, setConflictMsg] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [toast,       setToast]       = useState(null);   // { msg, type }

  // Derive studentId – prefer `user.id` injected by /auth/me, fallback to email
  const studentId = user?.id || user?.email || '';

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch bookings ───────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = user.role === 'ADMIN' 
        ? await getAllBookings() 
        : await getBookingsByUser(studentId);
      // Sort newest first by startTime
      data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [user, studentId]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Stats cards ──────────────────────────────────────────────────────────────
  const stats = {
    total:    bookings.length,
    pending:  bookings.filter(b => b.status === 'PENDING').length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
  };

  // ── Form change ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormError('');
    setConflictMsg('');
  };

  // ── Submit new booking ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setConflictMsg('');

    // Basic validation
    if (!form.startTime || !form.endTime) {
      setFormError('Please select both start and end date/time.');
      return;
    }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      setFormError('End time must be after start time.');
      return;
    }
    if (!form.purpose.trim()) {
      setFormError('Please describe the purpose of your booking.');
      return;
    }

    try {
      setSubmitting(true);
      await createBooking({
        resourceId: form.resourceId,
        studentId,
        startTime:  toIso(form.startTime),
        endTime:    toIso(form.endTime),
        purpose:    form.purpose.trim(),
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      showToast('Booking submitted! Awaiting approval.');
      await fetchBookings();
    } catch (err) {
      if (err?.response?.status === 409) {
        // ── ⚠️ Conflict detected by backend ──────────────────────────────────
        setConflictMsg(
          `⚠️ Time slot conflict! "${form.resourceId}" is already booked between the selected times. Please choose a different time or resource.`
        );
      } else {
        setFormError(err?.response?.data?.message || 'Failed to submit booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel booking ───────────────────────────────────────────────────────────
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      setCancellingId(id);
      await cancelBooking(id);
      showToast('Booking cancelled.', 'info');
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      showToast('Failed to cancel booking.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  // ── Update booking status (Admin) ────────────────────────────────────────────
  const handleStatusUpdate = async (id, status) => {
    try {
      await updateBookingStatus(id, status);
      showToast(`Booking ${status.toLowerCase()}!`, 'success');
      await fetchBookings();
    } catch (err) {
      showToast(`Failed to update booking status.`, 'error');
    }
  };

  // ── Open / close modal ───────────────────────────────────────────────────────
  const openModal  = () => { setForm(EMPTY_FORM); setFormError(''); setConflictMsg(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setForm(EMPTY_FORM); setFormError(''); setConflictMsg(''); };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-container" style={{ animationName: 'slideUp', animationDuration: '0.4s', animationFillMode: 'both' }}>

      {/* ── Page Header ── */}
      <div className="bk-page-header">
        <div>
          <h1 className="bk-page-title">
            <span className="bk-title-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            Booking System
          </h1>
          <p className="bk-page-subtitle">Reserve campus rooms, auditoriums, and technical labs</p>
        </div>
        <button id="new-booking-btn" className="btn btn-primary bk-new-btn" onClick={openModal}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Booking
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="bk-stats-row">
        {[
          { label: 'Total Bookings', value: stats.total,    color: '#4f46e5', icon: '📋' },
          { label: 'Pending',        value: stats.pending,  color: '#f59e0b', icon: '⏳' },
          { label: 'Approved',       value: stats.approved, color: '#10b981', icon: '✅' },
          { label: 'Rejected',       value: stats.rejected, color: '#ef4444', icon: '❌' },
        ].map(s => (
          <div key={s.label} className="bk-stat-card glass">
            <div className="bk-stat-icon">{s.icon}</div>
            <div className="bk-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="bk-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Bookings List ── */}
      {loading ? (
        <div className="flex-center" style={{ minHeight: '200px' }}>
          <div className="bk-spinner" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass bk-empty">
          <div className="bk-empty-icon">🗓️</div>
          <h3>No bookings yet</h3>
          <p>Click <strong>New Booking</strong> to reserve a campus resource.</p>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={openModal}>
            + New Booking
          </button>
        </div>
      ) : (
        <div className="bk-list">
          {bookings.map(b => {
            const meta = STATUS_META[b.status] || STATUS_META.PENDING;
            return (
              <div key={b.id} className="bk-card glass">
                {/* Left accent bar */}
                <div className="bk-card-accent" style={{ background: meta.color }} />

                <div className="bk-card-body">
                  <div className="bk-card-top">
                    <div className="bk-card-resource">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                      {b.resourceId}
                    </div>
                    <span className="bk-status-badge" style={{ color: meta.color, background: meta.bg }}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="bk-card-times">
                    <span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {fmt(b.startTime)}
                    </span>
                    <span className="bk-time-arrow">→</span>
                    <span>{fmt(b.endTime)}</span>
                  </div>

                  {b.purpose && (
                    <p className="bk-card-purpose">
                      <em>"{b.purpose}"</em>
                    </p>
                  )}
                </div>

                {/* Cancel – only if PENDING and user is NOT admin */}
                {b.status === 'PENDING' && user?.role !== 'ADMIN' && (
                  <button
                    id={`cancel-booking-${b.id}`}
                    className="bk-cancel-btn"
                    onClick={() => handleCancel(b.id)}
                    disabled={cancellingId === b.id}
                    title="Cancel this booking"
                  >
                    {cancellingId === b.id ? (
                      <div className="bk-btn-spinner" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                  </button>
                )}

                {/* Admin controls */}
                {b.status === 'PENDING' && user?.role === 'ADMIN' && (
                  <div style={{ display: 'flex', gap: '8px', padding: '0 1.25rem', alignItems: 'center', flexShrink: 0 }}>
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={() => handleStatusUpdate(b.id, 'APPROVED')} 
                      style={{ background: '#10b981', border: 'none' }}
                    >
                      Approve
                    </button>
                    <button 
                      className="btn btn-sm btn-outline" 
                      onClick={() => handleStatusUpdate(b.id, 'REJECTED')} 
                      style={{ color: '#ef4444', borderColor: '#ef4444' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── New Booking Modal ── */}
      {showModal && (
        <div className="bk-modal-overlay" onClick={closeModal}>
          <div
            id="new-booking-modal"
            className="bk-modal glass"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bk-modal-header">
              <h2>New Booking Request</h2>
              <button className="bk-modal-close" onClick={closeModal} title="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* ── Conflict Alert ── */}
            {conflictMsg && (
              <div className="bk-conflict-alert">
                <div className="bk-conflict-icon">⚠️</div>
                <div className="bk-conflict-text">{conflictMsg}</div>
              </div>
            )}

            {/* ── General Error ── */}
            {formError && (
              <div className="error-alert" style={{ marginBottom: '1rem' }}>{formError}</div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="bk-modal-form">
              <div className="form-group">
                <label htmlFor="bk-resource">Campus Resource</label>
                <select
                  id="bk-resource"
                  name="resourceId"
                  value={form.resourceId}
                  onChange={handleChange}
                  required
                >
                  {RESOURCES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="bk-form-row">
                <div className="form-group">
                  <label htmlFor="bk-start">Start Date &amp; Time</label>
                  <input
                    id="bk-start"
                    type="datetime-local"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bk-end">End Date &amp; Time</label>
                  <input
                    id="bk-end"
                    type="datetime-local"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                    required
                    min={form.startTime || new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bk-purpose">Purpose / Reason</label>
                <textarea
                  id="bk-purpose"
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Briefly describe why you need this resource…"
                  required
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.8)',
                    fontSize: '1rem', resize: 'vertical', outline: 'none',
                    fontFamily: 'inherit', transition: 'all 0.2s ease',
                  }}
                />
              </div>

              <div className="bk-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  id="submit-booking-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="bk-btn-spinner" /> Submitting…
                    </span>
                  ) : 'Submit Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className="bk-toast"
          style={{
            background: toast.type === 'error'   ? '#ef4444'
                       : toast.type === 'info'   ? '#0ea5e9'
                       :                           '#10b981',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
