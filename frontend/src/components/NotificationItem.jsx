import React from 'react';

const typeConfig = {
  BOOKING: {
    icon: '📅',
    label: 'Booking',
    color: '#4f46e5',
    bg: 'rgba(79, 70, 229, 0.08)',
    border: 'rgba(79, 70, 229, 0.15)',
  },
  TICKET: {
    icon: '🔧',
    label: 'Ticket',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.15)',
  },
  GENERAL: {
    icon: '📢',
    label: 'General',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.15)',
  },
};

const NotificationItem = ({ notification, onMarkRead }) => {
  const { id, message, type, read, createdAt } = notification;
  const config = typeConfig[type] || typeConfig.GENERAL;

  const formattedDate = new Date(createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div
      className={`notification-item ${read ? 'read' : 'unread'}`}
      style={{
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        background: read ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.92)',
        border: `1px solid ${read ? 'rgba(0,0,0,0.06)' : config.border}`,
        boxShadow: read ? 'none' : `0 2px 12px ${config.bg}`,
        transition: 'all 0.2s ease',
        opacity: read ? 0.72 : 1,
        position: 'relative',
      }}
    >
      {/* Unread indicator dot */}
      {!read && (
        <span style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: config.color,
          boxShadow: `0 0 6px ${config.color}`,
          animation: 'pulse-glow 2s infinite',
        }} />
      )}

      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
        {/* Type icon */}
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: config.bg,
          border: `1px solid ${config.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          flexShrink: 0,
        }}>
          {config.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: config.color,
              background: config.bg,
              border: `1px solid ${config.border}`,
              padding: '0.1rem 0.5rem',
              borderRadius: '20px',
            }}>
              {config.label}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {formattedDate}
            </span>
          </div>

          {/* Message */}
          <p style={{
            margin: 0,
            fontSize: '0.88rem',
            color: read ? 'var(--text-muted)' : 'var(--text-dark)',
            lineHeight: '1.5',
            wordBreak: 'break-word',
          }}>
            {message}
          </p>

          {/* Mark as read */}
          {!read && (
            <button
              onClick={() => onMarkRead(id)}
              style={{
                marginTop: '0.6rem',
                background: 'none',
                border: 'none',
                color: config.color,
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: '600',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
