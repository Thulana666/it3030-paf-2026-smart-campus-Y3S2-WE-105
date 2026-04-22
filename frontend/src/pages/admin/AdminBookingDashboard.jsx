import React, { useState, useEffect, useMemo } from 'react';
import { getAllBookings, updateBookingStatus } from '../../services/bookingService';
import { getAllResources } from '../../services/resourceService';

const STATUS_META = {
  PENDING:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  APPROVED: { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  REJECTED: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  CANCELLED:{ label: 'Cancelled',color: '#64748b', bg: 'rgba(100,116,139,0.12)' }
};

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export default function AdminBookingDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [resources, setResources] = useState([]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getAllBookings();
      // Sort by start time descending (newest first)
      const sorted = (data || []).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      setBookings(sorted);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch bookings. Ensure you are an admin.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const data = await getAllResources();
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchResources();
  }, []);

  const resourceMap = resources.reduce((acc, r) => {
    acc[r.id] = r;
    return acc;
  }, {});

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const resourceName = resourceMap[b.resourceId]?.name || '';
      const matchesSearch = 
        b.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.purpose && b.purpose.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const handleStatusUpdateAction = async (id, status) => {
    let reason = '';
    
    if (status === 'APPROVED') {
       const userNote = prompt("Add an optional approval note:");
       if (userNote === null) return; // Cancelled
       reason = userNote;
    } else if (status === 'REJECTED') {
       const userReason = prompt("Reason for rejection (required):");
       if (userReason === null) return; // Cancelled
       if (!userReason.trim()) {
           alert("Rejection reason is required.");
           return;
       }
       reason = userReason;
    } else if (status === 'CANCELLED') {
       if (!window.confirm("Are you sure you want to revoke this approval? This will cancel the booking.")) return;
       reason = "Revoked by Administrator";
    }
    
    try {
      await updateBookingStatus(id, status, reason);
      fetchBookings();
    } catch (err) {
      alert(`Failed to update booking status`);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="bk-spinner" />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1250px', animation: 'slideUp 0.4s ease both' }}>
      
      {/* ── Header ── */}
      <div className="bk-page-header">
        <div>
          <h1 className="bk-page-title">
            <span className="bk-title-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: 'var(--general-color)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            Booking Management
          </h1>
          <p className="bk-page-subtitle">Monitor and oversee all facility reservation requests across the campus</p>
        </div>
        <button className="btn btn-outline" onClick={fetchBookings}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
          Sync Data
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bk-filter-bar glass" style={{ marginBottom: '2rem', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
        <div className="bk-search-wrapper" style={{ flex: 1 }}>
          <svg className="bk-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search by Resource, Student ID or Purpose..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bk-search-input"
            style={{ paddingLeft: '2.8rem', height: '45px' }}
          />
        </div>
        
        <select 
          className="bk-filter-dropdown"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ height: '45px', width: '200px' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">⏳ Pending Only</option>
          <option value="APPROVED">✅ Approved Only</option>
          <option value="REJECTED">❌ Rejected Only</option>
          <option value="CANCELLED">🚫 Cancelled Only</option>
        </select>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>{error}</div>}

      <div style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', marginBottom: '2rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ minWidth: '160px', padding: '0.75rem 1.5rem', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resource</th>
                <th style={{ minWidth: '200px', padding: '0.75rem 1rem', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requester</th>
                <th style={{ minWidth: '160px', padding: '0.75rem 1rem', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule</th>
                <th style={{ minWidth: '260px', padding: '0.75rem 1rem', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</th>
                <th style={{ minWidth: '120px', padding: '0.75rem 1rem', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Status</th>
                <th style={{ minWidth: '180px', padding: '0.75rem 1.5rem', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ background: '#ffffff' }}>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>No matching records found in the database.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const meta = STATUS_META[b.status] || STATUS_META.PENDING;
                  return (
                    <tr 
                      key={b.id} 
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Resource */}
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px', color: '#64748b' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.875rem' }}>
                              {resourceMap[b.resourceId]?.name || b.resourceId}
                            </span>
                            {resourceMap[b.resourceId]?.category && (
                              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                {resourceMap[b.resourceId].category}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Requester */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', flexShrink: 0, borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '11px' }}>
                            {b.studentId ? b.studentId.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '500' }}>{b.studentId}</div>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td style={{ padding: '1rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: '500' }}>{fmt(b.startTime)}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>to {fmt(b.endTime)}</span>
                        </div>
                      </td>

                      {/* Details */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#334155', marginBottom: '6px', lineHeight: '1.4' }}>
                          {b.purpose}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {b.expectedAttendees && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eef2ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                              👥 {b.expectedAttendees} Attendees
                            </span>
                          )}
                          {b.adminReason && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                              📝 Note attached
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: '800',
                          color: meta.color, background: meta.bg, textTransform: 'uppercase', letterSpacing: '0.05em',
                          border: `1px solid ${meta.color}22`
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: meta.color }}></div>
                          {meta.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {b.status === 'PENDING' ? (
                            <>
                              <button 
                                onClick={() => handleStatusUpdateAction(b.id, 'APPROVED')}
                                style={{ background: '#dcfce7', border: 'none', color: '#166534', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => e.target.style.background = '#bbf7d0'}
                                onMouseLeave={(e) => e.target.style.background = '#dcfce7'}
                                title="Approve this booking (You can add an optional note)"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleStatusUpdateAction(b.id, 'REJECTED')}
                                style={{ background: '#ffe4e6', border: 'none', color: '#9f1239', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => e.target.style.background = '#fecdd3'}
                                onMouseLeave={(e) => e.target.style.background = '#ffe4e6'}
                                title="Reject this booking (A rejection reason is required)"
                              >
                                Reject
                              </button>
                            </>
                          ) : b.status === 'APPROVED' ? (
                            <button
                              onClick={() => handleStatusUpdateAction(b.id, 'CANCELLED')}
                              title="Revoke Approval Status"
                              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                              onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                              onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                            >
                              Revoke
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500' }}>
                              Processed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
