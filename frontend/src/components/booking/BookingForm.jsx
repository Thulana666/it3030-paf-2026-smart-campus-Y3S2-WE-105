import React, { useState } from 'react';
import { createBooking } from '../../../services/bookingService';

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

const toIso = (local) => (local ? new Date(local).toISOString() : '');

const EMPTY_FORM = {
  resourceId: RESOURCES[0],
  startTime:  '',
  endTime:    '',
  purpose:    '',
};

export default function BookingForm({ studentId, onSuccess, onClose, showToast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [conflictMsg, setConflictMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormError('');
    setConflictMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setConflictMsg('');

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
      showToast('Booking submitted! Awaiting approval.');
      onSuccess(); // refresh list and close modal
    } catch (err) {
      if (err?.response?.status === 409) {
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

  return (
    <div className="bk-modal-overlay" onClick={onClose}>
      <div id="new-booking-modal" className="bk-modal glass" onClick={e => e.stopPropagation()}>
        <div className="bk-modal-header">
          <h2>New Booking Request</h2>
          <button className="bk-modal-close" onClick={onClose} title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
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
              placeholder="Briefly describe why you need this resource..."
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
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button id="submit-booking-btn" type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="bk-btn-spinner" /> Submitting...
                </span>
              ) : 'Submit Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
