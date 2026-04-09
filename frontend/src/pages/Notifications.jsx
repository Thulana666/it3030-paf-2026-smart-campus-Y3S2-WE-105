import React, { useState, useEffect } from 'react';
import api from '../services/api';
import NotificationItem from '../components/NotificationItem';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      // Sort newest first based on createdAt
      const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(sorted);
    } catch (err) {
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Optimistically update UI
      setNotifications(prev => 
        prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  if (loading) {
    return <div className="page-container flex-center"><div className="loader">Loading your updates...</div></div>;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="page-container">
      <div className="notifications-header">
        <h2>Your Notifications</h2>
        <span className="subtitle">You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</span>
      </div>

      {error && <div className="error-alert">{error}</div>}

      <div className="notifications-list">
        {notifications.length === 0 && !error ? (
          <div className="empty-state glass">
            <p>You're all caught up! No notifications right now.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <NotificationItem 
              key={notif.id} 
              notification={notif} 
              onMarkRead={handleMarkAsRead} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
