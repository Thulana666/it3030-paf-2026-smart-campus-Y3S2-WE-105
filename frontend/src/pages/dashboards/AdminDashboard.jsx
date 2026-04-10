import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ animation: 'slideUp 0.5s ease backwards' }}>
      
      {/* Header Section */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '20px', marginBottom: '2rem', borderLeft: '6px solid var(--primary-color)' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Administrator Hub</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          System diagnostics active. <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Welcome, {user?.name || user?.email}</span> — Admin Workspace is ready.
        </p>
      </div>

      {/* Admin Module Grid */}
      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        
        {/* User Management Card */}
        <div className="card glass" style={{ padding: '2rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--primary-color)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)' }}>System Users</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', flex: 1 }}>Manage organizational roles, oversee account security, and control system-wide access permissions.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <span className="badge badge-booking" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Network Secure</span>
            <button onClick={() => navigate('/dashboard/users')} className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>Browse List</button>
          </div>
        </div>

        {/* Facility Oversight Card */}
        <div className="card glass" style={{ padding: '2rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--general-color)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)' }}>Facility Oversight</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', flex: 1 }}>Review and authorize facility booking requests, manage asset availability, and oversee campus structural health.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <span className="badge badge-general" style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}>0 Pending</span>
            <button onClick={() => navigate('/dashboard/facility-approvals')} className="btn btn-outline" style={{ padding: '0.4rem 1rem' }}>Approvals</button>
          </div>
        </div>

        {/* Global Analytics Card */}
        <div className="card glass" style={{ padding: '2rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--accent-color)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)' }}>Global Analytics</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', flex: 1 }}>Monitor cross-module usage statistics, infrastructure failure rates, and system-wide performance indices.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <span className="badge badge-general" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>Live Metrics</span>
            <button onClick={() => navigate('/dashboard/analytics')} className="btn btn-outline" style={{ padding: '0.4rem 1rem', borderColor: '#f59e0b', color: '#f59e0b' }}>Reports</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
