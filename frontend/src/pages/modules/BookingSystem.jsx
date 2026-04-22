import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  getBookingsByUser,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
} from '../../services/bookingService';
import { getAllResources } from '../../services/resourceService';
import BookingForm from '../../components/booking/BookingForm';
import BookingList from '../../components/booking/BookingList';

export default function BookingSystem() {
  const { user } = useContext(AuthContext);

  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [toast,       setToast]       = useState(null);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [resources, setResources] = useState([]);

  const studentId = user?.id || user?.email || '';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = user.role === 'ADMIN' 
        ? await getAllBookings() 
        : await getBookingsByUser(studentId);
      data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [user, studentId]);

  const fetchResources = useCallback(async () => {
    try {
      const data = await getAllResources();
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
  }, []);

  useEffect(() => { 
    fetchBookings();
    fetchResources();
  }, [fetchBookings, fetchResources]);

  const stats = {
    total:    bookings.length,
    pending:  bookings.filter(b => b.status === 'PENDING').length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
    cancelled:bookings.filter(b => b.status === 'CANCELLED').length,
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        b.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.purpose && b.purpose.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      setCancellingId(id);
      await cancelBooking(id, studentId);
      showToast('Booking cancelled.', 'info');
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      showToast('Failed to cancel booking.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleStatusUpdate = async (id, status, reason = '') => {
    try {
      await updateBookingStatus(id, status, reason);
      showToast(`Booking ${status.toLowerCase()}!`, 'success');
      await fetchBookings();
    } catch (err) {
      showToast(`Failed to update booking status.`, 'error');
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setShowModal(true);
  };

  const openModal  = () => {
    setEditingBooking(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBooking(null);
  };

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
          <p className="bk-page-subtitle">Reserve campus resources, auditoriums, and labs</p>
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
          { label: 'Total Bookings', value: stats.total,    color: '#6366f1', icon: '📁' },
          { label: 'Pending',        value: stats.pending,  color: '#f59e0b', icon: '⏳' },
          { label: 'Approved',       value: stats.approved, color: '#10b981', icon: '✅' },
          { label: 'Rejected',       value: stats.rejected, color: '#ef4444', icon: '⚠️' },
          { label: 'Cancelled',      value: stats.cancelled,color: '#94a3b8', icon: '🚫' },
        ].map(s => (
          <div key={s.label} className="bk-stat-card glass">
            <div className="bk-stat-icon">{s.icon}</div>
            <div className="bk-stat-info">
              <div className="bk-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="bk-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bk-filter-bar glass">
        <div className="bk-search-wrapper">
          <svg className="bk-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search by resource or purpose..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bk-search-input"
          />
        </div>
        
        <select 
          className="bk-filter-dropdown"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* ── Bookings List Component ── */}
      <BookingList 
        bookings={filteredBookings} 
        loading={loading} 
        user={user} 
        currentUserId={studentId}
        handleCancel={handleCancel} 
        handleStatusUpdate={handleStatusUpdate} 
        handleEdit={handleEdit}
        cancellingId={cancellingId} 
        openModal={openModal}
        resources={resources}
      />

      {/* ── New Booking Modal Component ── */}
      {showModal && (
        <BookingForm 
          studentId={studentId} 
          editBooking={editingBooking}
          onSuccess={() => { closeModal(); fetchBookings(); }} 
          onClose={closeModal} 
          showToast={showToast} 
        />
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div className="bk-toast" style={{
            background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#0ea5e9' : '#10b981',
          }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

