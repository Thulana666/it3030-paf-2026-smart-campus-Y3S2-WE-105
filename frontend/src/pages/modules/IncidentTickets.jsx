import React from 'react';

const IncidentTickets = () => {
  return (
    <div className="glass" style={{ padding: '2rem', borderRadius: '15px' }}>
      <h1 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Incident Tickets</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Report and track resolution metrics for hardware, software, or campus environment issues.
      </p>
      
      <div className="empty-state" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '15px' }}>
        <button className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>File New Report</button>
      </div>
    </div>
  );
};

export default IncidentTickets;
