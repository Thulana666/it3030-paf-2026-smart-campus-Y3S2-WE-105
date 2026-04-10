import React, { useState, useEffect } from 'react';
import api from '../services/api';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const response = await api.get('/notifications');
        const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications(sorted);
      } catch (e) {
        console.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch(e) {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-dropdown glass" style={{ animation: 'slideUp 0.2s ease forwards' }}>
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, color: 'var(--text-dark)' }}>Alerts</h4>
        {unreadCount > 0 && <span className="badge badge-booking">{unreadCount} New</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>Scanning network...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>All clear! You're caught up.</div>
        ) : (
          notifications.map(notif => (
            <NotificationItem key={notif.id} notification={notif} onMarkRead={handleMarkAsRead} />
          ))
        )}
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>Close Panel</button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
