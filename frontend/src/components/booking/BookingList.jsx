import React from 'react';

const STATUS_META = {
  PENDING:  { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)'  },
  APPROVED: { label: 'Approved',  color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)'  },
  REJECTED: { label: 'Rejected',  color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  CANCELLED:{ label: 'Cancelled', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function BookingList({ 
  bookings, 
  loading, 
  user, 
  handleCancel, 
  handleStatusUpdate, 
  cancellingId, 
  openModal, 
  handleEdit, 
  currentUserId,
  resources = [] 
}) {
  // Optimization: Cache resources by ID for O(1) lookup during list rendering
  const resourceCache = resources.reduce((acc, r) => {
    acc[r.id] = r;
    return acc;
  }, {});
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
    <div className="bk-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', width: '100%', maxWidth: 'none' }}>
      {bookings.map(b => {
        const meta = STATUS_META[b.status] || STATUS_META.PENDING;
        const resource = resourceCache[b.resourceId];
        
        return (
          <div key={b.id} className="bk-card glass" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '1.25rem', 
            borderLeft: `5px solid ${meta.color}`,
            background: 'rgba(255, 255, 255, 0.7)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Header: Resource Info and Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '6px', borderRadius: '8px', color: 'var(--primary-color)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  {resource?.name || b.resourceId}
                </div>
                {resource?.category && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '34px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {resource.category}
                  </span>
                )}
              </div>
              <span className="bk-status-badge" style={{ 
                color: meta.color, 
                background: meta.bg, 
                border: `1px solid ${meta.border}`,
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.65rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {meta.label}
              </span>
            </div>

            {/* Time and Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'center', minWidth: '45px', borderRight: '1px solid rgba(0,0,0,0.08)', paddingRight: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{new Date(b.startTime).toLocaleString('en-US', { month: 'short' })}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: '1' }}>{new Date(b.startTime).getDate()}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {fmtTime(b.startTime)} <span style={{ opacity: 0.4 }}>→</span> {fmtTime(b.endTime)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Duration: {Math.round((new Date(b.endTime) - new Date(b.startTime)) / 3600000 * 10) / 10} hours
                </div>
              </div>
            </div>

            {/* Purpose & Attendees */}
            <div style={{ marginBottom: '1rem', flex: 1 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontStyle: 'italic', opacity: 0.85, lineHeight: '1.4' }}>
                "{b.purpose}"
              </p>
              {b.expectedAttendees && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: '600' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {b.expectedAttendees} Expected Attendees
                </div>
              )}
            </div>

            {/* Admin Feedback Section */}
            {(b.status === 'APPROVED' || b.status === 'REJECTED' || b.adminReason) && (
              <div className="bk-feedback-container" style={{ 
                background: b.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                borderLeft: `4px solid ${meta.color}`,
                border: `1px solid ${meta.color}22`,
              }}>
                <div className="bk-feedback-label" style={{ color: meta.color }}>
                  <span>💬</span>
                  Admin Feedback
                </div>
                <p style={{ 
                  fontSize: '0.825rem', 
                  color: 'var(--text-dark)', 
                  lineHeight: '1.5', 
                  margin: 0,
                  fontWeight: '500',
                  opacity: 0.9
                }}>
                  {b.adminReason ? b.adminReason : <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No specific feedback from admin.</span>}
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem' }}>
              {/* User Edit/Cancel Actions */}
              {user?.role !== 'ADMIN' && currentUserId === b.studentId && (b.status === 'PENDING' || b.status === 'APPROVED') && (
                <>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleEdit && handleEdit(b)}
                    style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleCancel(b.id)}
                    disabled={cancellingId === b.id}
                    style={{ 
                      borderRadius: '8px', 
                      background: 'rgba(239, 68, 68, 0.08)', 
                      color: '#ef4444', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px' 
                    }}
                  >
                    {cancellingId === b.id ? <div className="bk-btn-spinner" /> : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        Cancel
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Admin Quick Actions */}
              {b.status === 'PENDING' && user?.role === 'ADMIN' && (
                <>
                  <button 
                    className="btn btn-sm" 
                    style={{ background: '#dcfce7', color: '#166534', borderRadius: '8px' }}
                    onClick={() => {
                      const r = prompt("Add an optional approval note:");
                      handleStatusUpdate(b.id, 'APPROVED', r || '');
                    }}
                  >
                    Approve
                  </button>
                  <button 
                    className="btn btn-sm" 
                    style={{ background: '#ffe4e6', color: '#9f1239', borderRadius: '8px' }}
                    onClick={() => {
                      const r = prompt("Reason for rejection (required):");
                      if (r !== null) handleStatusUpdate(b.id, 'REJECTED', r);
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
