import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import NotificationItem from '../components/NotificationItem';
import { AuthContext } from '../context/AuthContext';
import { updateNotificationPreferences } from '../services/userService';

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [disabledTypes, setDisabledTypes] = useState(user?.disabledNotificationTypes || []);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Sync state if user context updates slowly
  useEffect(() => {
    if (user && user.disabledNotificationTypes) {
      setDisabledTypes(user.disabledNotificationTypes);
    }
  }, [user]);

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
      // Remove from list after marking as read
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  if (loading) {
    return <div className="page-container flex-center"><div className="loader">Loading your updates...</div></div>;
  }

  const handleTogglePreference = async (type) => {
    const isCurrentlyDisabled = disabledTypes.includes(type);
    const newDisabledTypes = isCurrentlyDisabled
      ? disabledTypes.filter(t => t !== type)
      : [...disabledTypes, type];
    
    setDisabledTypes(newDisabledTypes);
    setSavingPrefs(true);
    try {
      await updateNotificationPreferences(newDisabledTypes);
      // We could update AuthContext here, but user state handles it naturally on next refresh
    } catch (err) {
      console.error("Failed to save preferences", err);
      // Revert on failure
      setDisabledTypes(disabledTypes);
    } finally {
      setSavingPrefs(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      <div className="notifications-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Your Notifications</h2>
          <span className="subtitle">You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</span>
        </div>
        
        {/* Settings Toggle */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setShowSettings(!showSettings)}
            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Preferences
          </button>

          {showSettings && (
            <div className="card glass" style={{ 
              position: 'absolute', top: '100%', right: 0, marginTop: '10px', 
              width: '280px', padding: '1.5rem', zIndex: 100,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', animation: 'slideUp 0.2s ease-out'
            }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-dark)' }}>Notification Types</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Choose which alerts you want to receive.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { id: 'BOOKING', label: 'Booking Updates', desc: 'Approvals & facility alerts' },
                  { id: 'TICKET', label: 'Incident Tickets', desc: 'Maintenance status changes' }
                ].map((type) => {
                  const isEnabled = !disabledTypes.includes(type.id);
                  return (
                    <label 
                      key={type.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0.75rem', 
                        borderRadius: '12px',
                        cursor: savingPrefs ? 'wait' : 'pointer',
                        transition: 'background 0.2s',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-dark)', fontSize: '0.95rem', fontWeight: '500' }}>{type.label}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{type.desc}</span>
                      </div>
                      
                      {/* Modern Toggle Switch UI */}
                      <div style={{
                        position: 'relative',
                        width: '40px',
                        height: '22px',
                        background: isEnabled ? 'var(--primary-color)' : '#e5e7eb',
                        borderRadius: '20px',
                        transition: 'background 0.3s',
                        opacity: savingPrefs ? 0.6 : 1
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          left: isEnabled ? '20px' : '2px',
                          width: '18px',
                          height: '18px',
                          background: 'white',
                          borderRadius: '50%',
                          transition: 'left 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                      
                      {/* Hidden actual checkbox */}
                      <input 
                        type="checkbox" 
                        checked={isEnabled}
                        onChange={() => handleTogglePreference(type.id)}
                        disabled={savingPrefs}
                        style={{ display: 'none' }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
