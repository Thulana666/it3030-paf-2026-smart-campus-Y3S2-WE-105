import React from 'react';

const NotificationItem = ({ notification, onMarkRead }) => {
  const { id, message, type, read, createdAt } = notification;
  
  // Format the date simply
  const formattedDate = new Date(createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className={`notification-item glass ${read ? 'read' : 'unread'}`}>
      <div className="notification-content">
        <div className="notification-header">
          <span className={`badge badge-${type.toLowerCase()}`}>{type}</span>
          <span className="timestamp">{formattedDate}</span>
        </div>
        <p className="message">{message}</p>
      </div>
      <div className="notification-actions">
        {!read && (
          <button 
            className="btn btn-sm btn-outline" 
            onClick={() => onMarkRead(id)}
          >
            Mark as Read
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
