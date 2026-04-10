import React from 'react';

const Facilities = () => {
  return (
    <div className="glass" style={{ padding: '2rem', borderRadius: '15px' }}>
      <h1 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Campus Facilities</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Track the real-time availability and maintenance status of all campus infrastructure.
      </p>
      
      <div className="empty-state" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '15px' }}>
        <h3 style={{ color: 'var(--text-dark)' }}>All Systems Nominal</h3>
        <p style={{ marginTop: '0.5rem' }}>No offline facilities detected across operational zones.</p>
      </div>
    </div>
  );
};

export default Facilities;
