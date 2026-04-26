import React, { useState, useEffect } from 'react';
import { createBooking, updateBooking } from '../../services/bookingService';

import { getActiveResources } from '../../services/resourceService';

const toIso = (local) => (local ? new Date(local).toISOString() : '');

// Helper to format ISO date to datetime-local string (YYYY-MM-DDTHH:mm)
const toLocalInput = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

const EMPTY_FORM = {
  resourceId: '',
  startTime:  '',
  endTime:    '',
  purpose:    '',
  expectedAttendees: '',
};

export default function BookingForm({ studentId, onSuccess, onClose, showToast, editBooking, initialResource }) {
  const [resources, setResources] = useState([]); // List of ACTIVE resources from Module A
  const [loadingResources, setLoadingResources] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM); // Current form state
  const [submitting, setSubmitting] = useState(false); // Submission loading state
  const [formError, setFormError] = useState(''); // General validation errors
  const [conflictMsg, setConflictMsg] = useState(''); // Specific overlap conflict messages
  const [errors, setErrors] = useState({}); // New: Track which fields have validation errors

  const isEdit = !!editBooking;

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getActiveResources();
        setResources(data);
        if (data.length > 0 && !editBooking) {
          setForm(prev => ({ ...prev, resourceId: initialResource || data[0].id }));
        }
      } catch (err) {
        console.error("Failed to fetch resources", err);
        setFormError("Failed to load available resources.");
      } finally {
        setLoadingResources(false);
      }
    };
    fetchResources();

    if (editBooking) {
      setForm({
        resourceId: editBooking.resourceId,
        startTime:  toLocalInput(editBooking.startTime),
        endTime:    toLocalInput(editBooking.endTime),
        purpose:    editBooking.purpose || '',
        expectedAttendees: editBooking.expectedAttendees || '',
      });
    }
  }, [editBooking]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormError('');
    setConflictMsg('');
    setErrors(prev => ({ ...prev, [name]: false })); // Clear field error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setConflictMsg('');

    const newErrors = {};
    if (!form.startTime) newErrors.startTime = true;
    if (!form.endTime) newErrors.endTime = true;
    if (!form.purpose.trim()) newErrors.purpose = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError('Please fill in all required fields.');
      return;
    }

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    const now = new Date();
    const maxDate = new Date();
    maxDate.setMonth(now.getMonth() + 6);

    if (start < now && !isEdit) {
      setErrors({ startTime: true });
      setFormError('Start time cannot be in the past.');
      return;
    }

    if (start >= end) {
      setErrors({ startTime: true, endTime: true });
      setFormError('End time must be after start time.');
      return;
    }

    if (start > maxDate) {
      setErrors({ startTime: true });
      setFormError('Bookings can only be made up to 6 months in advance.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        resourceId: form.resourceId,
        studentId,
        startTime:  toIso(form.startTime),
        endTime:    toIso(form.endTime),
        purpose:    form.purpose.trim(),
        expectedAttendees: form.expectedAttendees ? parseInt(form.expectedAttendees) : null,
      };

      if (isEdit) {
        await updateBooking(editBooking.id, payload, studentId);
        showToast('Booking updated successfully!');
      } else {
        await createBooking(payload);
        showToast('Booking submitted! Awaiting approval.');
      }
      
      onSuccess(); // refresh list and close modal
    } catch (err) {
      console.error("Booking error details:", err);
      if (err?.response?.status === 409) {
        setConflictMsg(
          `⚠️ Time slot conflict! "${form.resourceId}" is already booked between the selected times. Please choose a different time or resource.`
        );
      } else {
        const msg = err?.response?.data?.message || err?.message || `Failed to ${isEdit ? 'update' : 'submit'} booking. Please try again.`;
        setFormError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bk-modal-overlay" onClick={onClose}>
      <div id="new-booking-modal" className="bk-modal glass" onClick={e => e.stopPropagation()}>
        <div className="bk-modal-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--text-dark)', fontWeight: '700' }}>{isEdit ? 'Edit Request' : 'New Reservation'}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Fill in the details to reserve a campus resource</p>
            </div>
          </div>
          <button className="bk-modal-close" onClick={onClose} title="Close" style={{ background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {conflictMsg && (
          <div className="bk-conflict-alert">
            <div className="bk-conflict-icon">⚠️</div>
            <div className="bk-conflict-text">{conflictMsg}</div>
          </div>
        )}

        {formError && (
          <div className="error-alert" style={{ marginBottom: '1rem', color: '#ef4444' }}>{formError}</div>
        )}

        <form onSubmit={handleSubmit} className="bk-modal-form">
          <div className="bk-form-row" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
            <div className="form-group">
              <label htmlFor="bk-resource" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Select Resource
              </label>
              <select
                id="bk-resource"
                name="resourceId"
                value={form.resourceId}
                onChange={handleChange}
                required
                disabled={loadingResources}
                style={{ background: '#f8fafc' }}
              >
                {loadingResources ? (
                  <option value="">Loading resources...</option>
                ) : (
                  resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.category})</option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="bk-attendees" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Attendees
              </label>
              <input
                id="bk-attendees"
                type="number"
                name="expectedAttendees"
                value={form.expectedAttendees}
                onChange={handleChange}
                placeholder="e.g. 50"
                min="1"
                style={{ background: '#f8fafc' }}
              />
            </div>
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
                style={{ borderColor: errors.startTime ? '#ef4444' : '' }}
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
                style={{ borderColor: errors.endTime ? '#ef4444' : '' }}
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
              placeholder="Briefly describe why you need this resource..."
              required
              style={{
                width: '100%', padding: '0.75rem 1rem',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.8)',
                fontSize: '1rem', resize: 'vertical', outline: 'none',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
                borderColor: errors.purpose ? '#ef4444' : '',
              }}
            />
          </div>

          <div className="bk-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button id="submit-booking-btn" type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="bk-btn-spinner" /> {isEdit ? 'Updating...' : 'Submitting...'}
                </span>
              ) : (isEdit ? 'Update Booking' : 'Submit Booking')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
