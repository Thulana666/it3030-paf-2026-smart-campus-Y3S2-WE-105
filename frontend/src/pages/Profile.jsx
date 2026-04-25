import React, { useState, useEffect } from 'react';
import { getMe, updateProfile, changePassword } from '../services/userService';
import { getPasswordStrength, getPasswordRequirements, validatePassword } from '../utils/validators';

const FieldError = ({ msg }) =>
  msg ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', color: '#ef4444', fontSize: '0.8rem' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {msg}
    </div>
  ) : null;

const EyeIcon = ({ show }) => show
  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

const eyeBtnStyle = { position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0' };

const PasswordRequirements = ({ password }) => {
  if (!password) return null;
  const reqs = getPasswordRequirements(password);
  return (
    <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {reqs.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', color: r.met ? '#16a34a' : '#ef4444', transition: 'color 0.2s' }}>
          {r.met
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
          {r.label}
        </div>
      ))}
    </div>
  );
};

const PasswordStrengthBar = ({ password }) => {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '4px', background: i <= score ? color : 'var(--border-light)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ fontSize: '0.78rem', marginTop: '4px', color, fontWeight: '500' }}>{label}</div>
    </div>
  );
};

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Editable Form State
  const [formData, setFormData] = useState({ name: '', profilePicture: '' });
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [touched, setTouched] = useState({ oldPassword: false, newPassword: false, confirmPassword: false });

  const newPasswordErr = touched.newPassword ? validatePassword(passwordData.newPassword) : null;
  const confirmPasswordErr = touched.confirmPassword
    ? (!passwordData.confirmPassword ? 'Please confirm your password.' : passwordData.confirmPassword !== passwordData.newPassword ? 'Passwords do not match.' : null)
    : null;

  const blur = (field) => setTouched(t => ({ ...t, [field]: true }));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMe();
        setProfile(data);
        setFormData({ name: data.name || '', profilePicture: data.profilePicture || '' });
      } catch (err) {
        setError('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name === 'name' ? value.replace(/[^a-zA-Z\s'\-]/g, '') : value;
    setFormData({ ...formData, [name]: sanitized });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const data = await updateProfile(formData);
      setProfile(data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setTouched({ oldPassword: true, newPassword: true, confirmPassword: true });
    setError('');
    setSuccess('');

    if (validatePassword(passwordData.newPassword) || passwordData.newPassword !== passwordData.confirmPassword) {
      return;
    }

    try {
      await changePassword(passwordData);
      setSuccess('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error changing password.');
    }
  };

  if (loading) return <div className="page-container flex-center">Loading profile...</div>;
  if (!profile) return <div className="page-container flex-center">Error loading profile data.</div>;

  return (
    <div className="page-container" style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', padding: '2rem', animation: 'slideUp 0.4s ease backwards' }}>
      
      {/* Navigation Return */}
      <div style={{ width: '100%', maxWidth: '800px', marginBottom: '1rem' }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.95rem', fontWeight: '500' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Dashboard
        </button>
      </div>

      <div className="glass" style={{ width: '100%', maxWidth: '800px', display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '2rem', padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
        
        {/* Left Side: Avatar Display */}
        <div style={{ background: 'rgba(79, 70, 229, 0.05)', padding: '3rem 2rem', textAlign: 'center', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {profile.profilePicture ? (
            <img src={profile.profilePicture} alt="Profile" style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary-color)', boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)' }} />
          ) : (
            <div style={{ width: '130px', height: '130px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--general-color))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)' }}>
              {profile.name?.charAt(0).toUpperCase() || profile.email.charAt(0).toUpperCase()}
            </div>
          )}
          <h2 style={{ marginTop: '1.5rem', color: 'var(--text-dark)', fontSize: '1.5rem' }}>{profile.name || "Unnamed User"}</h2>
          <span className="badge badge-booking" style={{ marginTop: '0.5rem', display: 'inline-block' }}>{profile.role}</span>
        </div>

        {/* Right Side: Details & Forms */}
        <div style={{ padding: '3rem 3rem 3rem 1rem' }}>
          
          {/* Section Selector (for local users) */}
          {(!profile.provider || profile.provider === 'LOCAL' || profile.provider === 'local') && (
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
              <button 
                onClick={() => { setIsChangingPassword(false); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', padding: '0.5rem 0', color: !isChangingPassword ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', borderBottom: !isChangingPassword ? '2px solid var(--primary-color)' : 'none', transition: 'all 0.2s' }}
              >
                Account Info
              </button>
              <button 
                onClick={() => { setIsChangingPassword(true); setIsEditing(false); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', padding: '0.5rem 0', color: isChangingPassword ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', borderBottom: isChangingPassword ? '2px solid var(--primary-color)' : 'none', transition: 'all 0.2s' }}
              >
                Security
              </button>
            </div>
          )}

          {!isChangingPassword ? (
            <>
              <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--text-dark)' }}>Account Settings</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Manage your personal credentials and visibility.</p>
                </div>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="btn btn-outline" style={{ padding: '0.4rem 1rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    Edit Profile
                  </button>
                )}
              </div>

              {error && <div className="error-alert">{error}</div>}
              {success && <div className="error-alert" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#15803d', border: '1px solid rgba(34,197,94,0.3)', marginBottom: '1.5rem' }}>{success}</div>}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Display Name</label>
                  {isEditing ? (
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid var(--border-light)' }} />
                  ) : (
                    <div style={{ padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}>
                      {profile.name || 'Not provided'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Email Address</label>
                    <div style={{ padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', color: 'var(--text-main)', opacity: 0.7 }}>
                      {profile.email}
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Auth Provider</label>
                    <div style={{ padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', color: 'var(--text-main)', opacity: 0.7, textTransform: 'capitalize' }}>
                      {profile.provider}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>Save Changes</button>
                    <button type="button" className="btn" onClick={() => { setIsEditing(false); setFormData({ name: profile.name || '', profilePicture: profile.profilePicture || '' }); setError(''); setSuccess(''); }} style={{ background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '0.8rem 2rem' }}>Cancel</button>
                  </div>
                )}
              </form>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-dark)' }}>Security Settings</h3>
                <p style={{ color: 'var(--text-muted)' }}>Update your account password to stay secure.</p>
              </div>

              {error && <div className="error-alert" style={{ marginBottom: '1.5rem' }}>{error}</div>}
              {success && <div className="error-alert" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#15803d', border: '1px solid rgba(34,197,94,0.3)', marginBottom: '1.5rem' }}>{success}</div>}

              <form onSubmit={handlePasswordSubmit} className="auth-form">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showOld ? 'text' : 'password'}
                      name="oldPassword" 
                      value={passwordData.oldPassword} 
                      onChange={handlePasswordChange} 
                      onBlur={() => blur('oldPassword')}
                      required 
                      placeholder="Verify your identity"
                      style={{ paddingRight: '2.8rem', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid var(--border-light)' }} 
                    />
                    <button type="button" onClick={() => setShowOld(v => !v)} style={eyeBtnStyle} tabIndex={-1}><EyeIcon show={showOld} /></button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ color: 'var(--text-dark)', fontWeight: '600' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        name="newPassword" 
                        value={passwordData.newPassword} 
                        onChange={handlePasswordChange} 
                        onBlur={() => blur('newPassword')}
                        required 
                        placeholder="Enter new password"
                        style={{ paddingRight: '2.8rem', background: 'rgba(255, 255, 255, 0.5)', borderColor: newPasswordErr ? '#ef4444' : touched.newPassword && !newPasswordErr ? '#22c55e' : 'var(--border-light)' }} 
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} style={eyeBtnStyle} tabIndex={-1}><EyeIcon show={showPassword} /></button>
                    </div>
                    <PasswordStrengthBar password={passwordData.newPassword} />
                    <PasswordRequirements password={passwordData.newPassword} />
                    <FieldError msg={newPasswordErr} />
                  </div>
                  <div className="form-group">
                    <label style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showConfirm ? 'text' : 'password'}
                        name="confirmPassword" 
                        value={passwordData.confirmPassword} 
                        onChange={handlePasswordChange} 
                        onBlur={() => blur('confirmPassword')}
                        required 
                        style={{ paddingRight: '2.8rem', background: 'rgba(255, 255, 255, 0.5)', borderColor: confirmPasswordErr ? '#ef4444' : touched.confirmPassword && !confirmPasswordErr ? '#22c55e' : 'var(--border-light)' }} 
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} style={eyeBtnStyle} tabIndex={-1}><EyeIcon show={showConfirm} /></button>
                    </div>
                    <FieldError msg={confirmPasswordErr} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>Update Password</button>
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={() => { setIsChangingPassword(false); setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' }); setError(''); setSuccess(''); }} 
                    style={{ background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '0.8rem 2rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
