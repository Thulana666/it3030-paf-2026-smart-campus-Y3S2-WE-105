import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ animation: 'slideUp 0.6s ease backwards', minHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero Section */}
      <div 
        className="glass" 
        style={{ 
          padding: '4rem 2rem', 
          borderRadius: '24px', 
          textAlign: 'center',
          marginBottom: '3rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
        }}
      >
        {/* Decorative background blobs */}
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'var(--primary-color)', opacity: '0.1', borderRadius: '50%', filter: 'blur(50px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '300px', height: '300px', background: 'var(--secondary-color)', opacity: '0.1', borderRadius: '50%', filter: 'blur(50px)', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '1.5rem', letterSpacing: '-1px', lineHeight: '1.2' }}>
            Welcome to <span style={{ color: 'var(--primary-color)' }}>Smart Campus</span>
            <br />
            Operations Hub
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: '1.6' }}>
            A unified, intelligent platform to streamline facility management, handle incident reports, and automate campus operations.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', borderRadius: '30px' }}>
                Go to Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', borderRadius: '30px', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)' }}>
                  Get Started
                </button>
                <button onClick={() => navigate('/login')} className="btn btn-outline" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', borderRadius: '30px', background: 'white' }}>
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', flex: 1 }}>
        
        <div className="card glass" style={{ padding: '2rem', borderRadius: '20px', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' }}>
          <div style={{ background: 'rgba(79, 70, 229, 0.1)', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', marginBottom: '1.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '0.75rem' }}>Seamless Bookings</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Reserve state-of-art labs, lecture halls, and specialized equipment instantly with our automated approval workflow.
          </p>
        </div>

        <div className="card glass" style={{ padding: '2rem', borderRadius: '20px', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '1.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '0.75rem' }}>Incident Reporting</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Submit and track maintenance requests directly to technicians. Ensure campus infrastructure is always in top condition.
          </p>
        </div>

        <div className="card glass" style={{ padding: '2rem', borderRadius: '20px', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '1.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '0.75rem' }}>Global Analytics</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Gain administrative oversight with real-time KPI dashboards monitoring resource utilization and operational efficiency.
          </p>
        </div>

      </div>

    </div>
  );
};

export default Home;
