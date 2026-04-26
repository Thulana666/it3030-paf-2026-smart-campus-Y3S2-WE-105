import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import api from '../services/api';
import '../styles/index.css'; // Global styles

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  // Fetch unread count on mount and when dropdown closes
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications');
      const count = response.data.filter(n => !n.read).length;
      setUnreadCount(count);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 60s to keep badge fresh
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close notifications bubble if clicked outside bounds
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    fetchUnreadCount(); // Refresh count after closing panel
  };

  return (
    <nav className="navbar glass">
      <div className="nav-brand">
        <Link to={isAuthenticated ? "/dashboard" : "/login"}>Smart Campus Hub</Link>
      </div>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <div className="notification-container" ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', position: 'relative' }}
                title="Notifications"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: showNotifications ? 'var(--primary-color)' : 'var(--text-main)', transition: 'color 0.2s' }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: '700',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                    animation: 'pulse-glow 2s infinite',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && <NotificationDropdown onClose={handleCloseNotifications} />}
            </div>
            <Link to="/profile" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0' }}>
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--primary)' }} 
                />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
                </div>
              )}
            </Link>
            <button onClick={handleLogout} className="btn btn-outline" style={{ marginLeft: '10px' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
