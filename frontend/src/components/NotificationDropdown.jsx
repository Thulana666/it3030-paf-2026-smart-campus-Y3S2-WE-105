import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const response = await api.get('/notifications');
        const sorted = response.data
          .filter(n => !n.read)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications(sorted);
      } catch (e) {
        console.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.allSettled(unread.map(n => api.put(`/notifications/${n.id}/read`)));
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filters = [
    { key: 'ALL', label: 'All' },
    { key: 'BOOKING', label: '📅 Bookings' },
    { key: 'TICKET', label: '🔧 Tickets' }
  ];

  const filtered = activeFilter === 'ALL'
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  return (
    <div
      className="notification-dropdown glass"
      style={{
        animation: 'slideUp 0.2s ease forwards',
        width: '380px',
        maxHeight: '520px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        paddingBottom: '0.85rem',
        borderBottom: '1px solid var(--border-light)',
        marginBottom: '0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h4 style={{ margin: 0, color: 'var(--text-dark)', fontWeight: '700' }}>Notifications</h4>
          {unreadCount > 0 && (
            <span style={{
              background: 'var(--primary-color)',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: '700',
              padding: '0.15rem 0.5rem',
              borderRadius: '20px',
              minWidth: '22px',
              textAlign: 'center',
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-color)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: '600',
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.35rem',
        marginBottom: '0.85rem',
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            style={{
              padding: '0.3rem 0.7rem',
              borderRadius: '20px',
              border: `1px solid ${activeFilter === f.key ? 'var(--primary-color)' : 'rgba(99,102,241,0.15)'}`,
              background: activeFilter === f.key ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: activeFilter === f.key ? 'var(--primary-color)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: activeFilter === f.key ? '700' : '500',
              transition: 'all 0.15s ease',
            }}
          >
            {f.label}
            {f.key !== 'ALL' && (
              <span style={{ marginLeft: '0.3rem', opacity: 0.7 }}>
                ({notifications.filter(n => n.type === f.key && !n.read).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            {activeFilter === 'ALL' ? "All clear! You're caught up." : `No ${activeFilter.toLowerCase()} notifications.`}
          </div>
        ) : (
          filtered.slice(0, 8).map(notif => (
            <NotificationItem key={notif.id} notification={notif} onMarkRead={handleMarkAsRead} />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '0.85rem',
        borderTop: '1px solid var(--border-light)',
        paddingTop: '0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <button
          onClick={() => { navigate('/notifications'); onClose(); }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-color)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '600',
          }}
        >
          View all notifications →
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
