import React, { useEffect, useMemo, useState } from 'react';
import * as activationRequestService from '../../services/activationRequestService';

const ActivationRequests = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('PENDING_APPROVAL');

  const load = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      const data = await activationRequestService.getPendingActivationRequests();
      setRequests(data);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || e.message || 'Failed to load activation requests' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const approve = async (id) => {
    try {
      setMessage({ type: '', text: '' });
      await activationRequestService.approveActivationRequest(id);
      setMessage({ type: 'success', text: 'Approved. Resource is now ACTIVE.' });
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || e.message || 'Failed to approve request' });
    }
  };

  const reject = async (id) => {
    const reason = prompt('Reject reason (required):');
    if (!reason || !reason.trim()) return;
    try {
      setMessage({ type: '', text: '' });
      await activationRequestService.rejectActivationRequest(id, reason.trim());
      setMessage({ type: 'success', text: 'Rejected. Resource remains UNDER_MAINTENANCE.' });
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || e.message || 'Failed to reject request' });
    }
  };

  return (
    <div className="glass" style={{ padding: '2rem', borderRadius: '15px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Activation Requests</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Review technician repair completion details and approve/reject resource activation.
        </p>
      </div>

      {message.text && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444'
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={load} className="btn btn-outline" disabled={loading}>
          Refresh
        </button>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '0.55rem', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
          <option value="ALL">ALL (loaded set)</option>
        </select>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}

      {!loading && filtered.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>No activation requests found.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map((req) => (
            <div
              key={req.id}
              className="card"
              style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(99,102,241,0.12)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{req.resourceName} ({req.resourceCode})</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                    Technician: {req.technicianName || req.technicianEmail || req.technicianId}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                    Status: <strong>{req.status}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
                  <button className="btn btn-primary" onClick={() => approve(req.id)} disabled={req.status !== 'PENDING_APPROVAL'}>
                    Approve
                  </button>
                  <button className="btn btn-outline" onClick={() => reject(req.id)} disabled={req.status !== 'PENDING_APPROVAL'}>
                    Reject
                  </button>
                </div>
              </div>

              {req.repairCompletedAt && (
                <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Completed: {new Date(req.repairCompletedAt).toLocaleString()}
                </div>
              )}

              {req.repairNotes && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px solid rgba(99,102,241,0.16)'
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Repair notes</div>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>{req.repairNotes}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivationRequests;

