import React, { useState, useEffect } from 'react';
import { getAllUsers, adminCreateUser, adminDeleteUser, adminUpdateUserRole } from '../../services/userService';
import { validateEmail, validateName, validatePassword, getPasswordStrength, getPasswordRequirements } from '../../utils/validators';

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN'];

const FieldError = ({ msg }) =>
  msg ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', color: '#ef4444', fontSize: '0.8rem' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {msg}
    </div>
  ) : null;

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

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add User Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [formTouched, setFormTouched] = useState({ name: false, email: false, password: false });
  const [showFormPwd, setShowFormPwd] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Inline role editing state: { [userId]: selectedRole }
  const [roleEdits, setRoleEdits] = useState({});
  const [roleLoading, setRoleLoading] = useState({});

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError('Failed to load system users. Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // Strip numbers from the name field
    const sanitized = name === 'name' ? value.replace(/[^a-zA-Z\s'\-]/g, '') : value;
    setFormData({ ...formData, [name]: sanitized });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormTouched({ name: true, email: true, password: true });
    if (validateName(formData.name) || validateEmail(formData.email) || validatePassword(formData.password)) return;
    setFormError('');
    setFormLoading(true);
    try {
      await adminCreateUser(formData);
      setSuccess(`User "${formData.name}" created successfully!`);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'USER' });
      setFormTouched({ name: false, email: false, password: false });
      setShowFormPwd(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await adminDeleteUser(deleteTarget.id);
      setSuccess(`User "${deleteTarget.name || deleteTarget.email}" deleted.`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
      setDeleteTarget(null);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setRoleEdits(prev => ({ ...prev, [userId]: newRole }));
  };

  const handleRoleSave = async (user) => {
    const newRole = roleEdits[user.id];
    if (!newRole || newRole === user.role) return;
    setRoleLoading(prev => ({ ...prev, [user.id]: true }));
    try {
      await adminUpdateUserRole(user.id, newRole);
      setSuccess(`Role updated to ${newRole} for ${user.name || user.email}.`);
      setRoleEdits(prev => { const next = { ...prev }; delete next[user.id]; return next; });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
    } finally {
      setRoleLoading(prev => ({ ...prev, [user.id]: false }));
    }
  };

  if (loading) return <div className="page-container flex-center">Hydrating user directory...</div>;

  return (
    <div className="page-container" style={{ animation: 'slideUp 0.5s ease backwards' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>System User Directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage all registered accounts, roles, and access levels.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(''); }}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.4rem' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add User
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="error-alert" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="error-alert" style={{ background: 'rgba(34,197,94,0.1)', color: '#15803d', border: '1px solid rgba(34,197,94,0.3)', marginBottom: '1.5rem' }}>{success}</div>}

      {/* User Table */}
      <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-light)' }}>
            <tr>
              <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-dark)', fontWeight: '600' }}>User</th>
              <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-dark)', fontWeight: '600' }}>Role</th>
              <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-dark)', fontWeight: '600' }}>Provider</th>
              <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-dark)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '1.2rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                        {(user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{user.name || 'Anonymous User'}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                {/* Inline Role Selector */}
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={roleEdits[user.id] ?? user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      style={{ padding: '0.35rem 0.7rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.6)', color: 'var(--text-main)', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {roleEdits[user.id] && roleEdits[user.id] !== user.role && (
                      <button
                        onClick={() => handleRoleSave(user)}
                        disabled={roleLoading[user.id]}
                        style={{ padding: '0.35rem 0.75rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', opacity: roleLoading[user.id] ? 0.6 : 1 }}
                      >
                        {roleLoading[user.id] ? '...' : 'Save'}
                      </button>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                  {user.provider || 'local'}
                </td>
                <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                  <button
                    onClick={() => setDeleteTarget(user)}
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No system users found.</div>
        )}
      </div>

      {/* ── Add User Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '2.5rem', animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--text-dark)', fontSize: '1.4rem' }}>Create New User</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
            </div>

            {formError && <div className="error-alert" style={{ marginBottom: '1.5rem' }}>{formError}</div>}

            <form onSubmit={handleCreateUser} className="auth-form" noValidate>
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Display Name</label>
                <input
                  type="text" name="name" value={formData.name}
                  onChange={handleFormChange}
                  onBlur={() => setFormTouched(t => ({ ...t, name: true }))}
                  placeholder="Full name"
                  style={{ borderColor: (formTouched.name && validateName(formData.name)) ? '#ef4444' : (formTouched.name && !validateName(formData.name)) ? '#22c55e' : undefined }}
                />
                <FieldError msg={formTouched.name ? validateName(formData.name) : null} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Email Address</label>
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleFormChange}
                  onBlur={() => setFormTouched(t => ({ ...t, email: true }))}
                  placeholder="user@campus.edu"
                  style={{ borderColor: (formTouched.email && validateEmail(formData.email)) ? '#ef4444' : (formTouched.email && !validateEmail(formData.email)) ? '#22c55e' : undefined }}
                />
                <FieldError msg={formTouched.email ? validateEmail(formData.email) : null} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showFormPwd ? 'text' : 'password'} name="password" value={formData.password}
                    onChange={handleFormChange}
                    onBlur={() => setFormTouched(t => ({ ...t, password: true }))}
                    placeholder="Min 6 characters"
                    style={{ paddingRight: '2.8rem', borderColor: (formTouched.password && validatePassword(formData.password)) ? '#ef4444' : (formTouched.password && !validatePassword(formData.password)) ? '#22c55e' : undefined }}
                  />
                  <button type="button" onClick={() => setShowFormPwd(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0' }} tabIndex={-1}>
                    {showFormPwd
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <PasswordStrengthBar password={formData.password} />
                <PasswordRequirements password={formData.password} />
                <FieldError msg={formTouched.password ? validatePassword(formData.password) : null} />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Role</label>
                <select name="role" value={formData.role} onChange={handleFormChange} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create User'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '100%', maxWidth: '420px', borderRadius: '20px', padding: '2.5rem', animation: 'slideUp 0.3s ease', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
            </div>
            <h2 style={{ color: 'var(--text-dark)', marginBottom: '0.75rem' }}>Delete Account</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              You are about to permanently delete <strong>{deleteTarget.name || deleteTarget.email}</strong>. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleDeleteUser} style={{ flex: 1, padding: '0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>
                Yes, Delete
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-outline" style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
