import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const TechnicianDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ animation: 'slideUp 0.5s ease backwards' }}>
      
      {/* Header Section */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '20px', marginBottom: '2rem', borderLeft: '6px solid var(--general-color)' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Technician Portal</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Maintenance & Operations active. <span style={{ color: 'var(--general-color)', fontWeight: '600' }}>Welcome, {user?.name || user?.email}</span> — Operations Hub is ready.
        </p>
      </div>

      {/* Technician Module Grid */}
      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        
        {/* Maintenance Tasks Card */}
        <div className="card glass" style={{ padding: '2rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', color: '#ef4444' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)' }}>Assigned Tickets</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', flex: 1 }}>Resolve infrastructure failures, manage hardware repairs, and track operational incident resolutions.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <span className="badge badge-ticket" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>No Pending</span>
            <button onClick={() => navigate('/dashboard/incident-tickets')} className="btn btn-outline" style={{ padding: '0.4rem 1rem', borderColor: '#ef4444', color: '#ef4444' }}>Worklist</button>
          </div>
        </div>

        {/* Inventory Hub Card */}
        <div className="card glass" style={{ padding: '2rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"></path><path d="M1 3h22v5H1z"></path><path d="M10 12h4"></path></svg>
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)' }}>Inventory & Stock</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', flex: 1 }}>Manage logistical supplies, track electrical component stock, and oversee hardware parts inventory.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <span className="badge badge-booking" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>Stable Levels</span>
            <button onClick={() => navigate('/dashboard/inventory')} className="btn btn-outline" style={{ padding: '0.4rem 1rem', borderColor: '#3b82f6', color: '#3b82f6' }}>Supplies</button>
          </div>
        </div>

        {/* Operations Schedule Card */}
        <div className="card glass" style={{ padding: '2rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)' }}>Operational Schedule</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', flex: 1 }}>View weekly maintenance patrols, scheduled facility shutdowns, and team deployment rotations.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <span className="badge badge-general" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>Live Cycles</span>
            <button onClick={() => navigate('/dashboard/schedule')} className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>Shift Info</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TechnicianDashboard;
