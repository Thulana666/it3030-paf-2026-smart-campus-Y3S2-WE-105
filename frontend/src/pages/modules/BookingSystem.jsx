import React from 'react';

const BookingSystem = () => {
  return (
    <div className="glass" style={{ padding: '2rem', borderRadius: '15px' }}>
      <h1 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Booking System</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Reserve campus rooms, auditoriums, and technical labs.
      </p>
      
      <div className="empty-state" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '15px' }}>
        <h3 style={{ color: 'var(--text-dark)' }}>No active bookings</h3>
        <p style={{ marginTop: '0.5rem' }}>Select a facility to begin requesting a reservation slot.</p>
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>+ New Booking</button>
      </div>
    </div>
  );
};

export default BookingSystem;
