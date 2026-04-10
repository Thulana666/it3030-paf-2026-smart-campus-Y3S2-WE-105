import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ animation: 'slideUp 0.5s ease backwards' }}>
      
      {/* Header Section */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '20px', marginBottom: '2rem', borderLeft: '6px solid var(--primary-color)' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Student Overview</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Welcome back, <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>{user?.name || user?.email}</span>. Your workspace is ready.
        </p>
      </div>

      {/* Module Grid */}
      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        
        {/* Booking System Card */}
        <div className="card glass" style={{ padding: '2rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--primary-color)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)' }}>Booking System</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', flex: 1 }}>Reserve technical labs, auditoriums, and private study rooms.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <span className="badge badge-booking">0 Active</span>
            <button onClick={() => navigate('/dashboard/bookings')} className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>Manage</button>
          </div>
        </div>

        {/* Facilities Card */}
        <div className="card glass" style={{ padding: '2rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--general-color)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)' }}>Facilities</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', flex: 1 }}>View availability and live conditions of structural assets.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <span className="badge badge-general">100% Online</span>
            <button onClick={() => navigate('/dashboard/facilities')} className="btn btn-outline" style={{ padding: '0.4rem 1rem' }}>View Assets</button>
          </div>
        </div>

        {/* Incident Tickets Card */}
        <div className="card glass" style={{ padding: '2rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', color: '#ef4444' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)' }}>Incident Tickets</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', flex: 1 }}>Report infrastructure failures or track existing maintenance queries.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <span className="badge badge-ticket" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>Critical Priority</span>
            <button onClick={() => navigate('/dashboard/incident-tickets')} className="btn btn-outline" style={{ padding: '0.4rem 1rem', borderColor: '#ef4444', color: '#ef4444' }}>Submit Issue</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserDashboard;
