import React from 'react';

const STATUS_META = {
  PENDING:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  APPROVED: { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  REJECTED: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
};

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export default function BookingList({ bookings, loading, user, handleCancel, handleStatusUpdate, cancellingId, openModal }) {
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '200px' }}>
        <div className="bk-spinner" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="glass bk-empty">
        <div className="bk-empty-icon">🗓️</div>
        <h3>No bookings yet</h3>
        <p>Click <strong>New Booking</strong> to reserve a campus resource.</p>
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={openModal}>
          + New Booking
        </button>
      </div>
    );
  }

  return (
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
  );
}
