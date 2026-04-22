import React from 'react';

const STATUS_META = {
  PENDING:  { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)'  },
  APPROVED: { label: 'Approved',  color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)'  },
  REJECTED: { label: 'Rejected',  color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  CANCELLED:{ label: 'Cancelled', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
};

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export default function BookingList({ bookings, loading, user, handleCancel, handleStatusUpdate, cancellingId, openModal, handleEdit, currentUserId }) {
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

                {/* All Actions and Status on the Top Line */}
                <div className="bk-card-header-actions">
                  <span className="bk-status-badge" style={{ 
                    color: meta.color, 
                    background: meta.bg, 
                    border: `1px solid ${meta.border}`,
                    padding: '0.2rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {meta.label}
                  </span>

                  {/* Student Actions: Allow Cancel for PENDING or APPROVED */}
                  {user?.role !== 'ADMIN' && currentUserId === b.studentId && (b.status === 'PENDING' || b.status === 'APPROVED') && (
                    <div className="bk-action-group">
                      <button
                        className="btn btn-sm btn-outline bk-action-btn-slim"
                        onClick={() => handleEdit && handleEdit(b)}
                        title="Edit booking"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" 
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-delete-slim"
                        onClick={() => handleCancel(b.id)}
                        disabled={cancellingId === b.id}
                        title="Cancel booking"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px', opacity: 0.8 }}
                      >
                        {cancellingId === b.id ? (
                          <div className="bk-btn-spinner" />
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                            Cancel
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Admin Actions */}
                  {b.status === 'PENDING' && user?.role === 'ADMIN' && (
                    <div className="bk-action-group">
                      <button 
                        className="btn btn-sm btn-success-slim" 
                        onClick={() => {
                          const r = prompt("Add an optional approval note:");
                          handleStatusUpdate(b.id, 'APPROVED', r || '');
                        }}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn btn-sm btn-danger-slim" 
                        onClick={() => {
                          const r = prompt("Reason for rejection (required):");
                          if (r !== null) handleStatusUpdate(b.id, 'REJECTED', r);
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
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

              <p className="bk-card-purpose">
                <em>"{b.purpose}"</em>
                {b.expectedAttendees && (
                  <span style={{ marginLeft: '1rem', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: '600' }}>
                    • {b.expectedAttendees} Attendees
                  </span>
                )}
              </p>

              {b.adminReason && (
                <div className="bk-admin-note" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666', background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '4px', borderLeft: '3px solid #ccc' }}>
                  <strong>Admin Note:</strong> {b.adminReason}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
