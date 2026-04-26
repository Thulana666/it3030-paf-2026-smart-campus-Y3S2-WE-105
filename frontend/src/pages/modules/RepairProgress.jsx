import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as repairProgressService from '../../services/repairProgressService';

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const RepairProgress = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadRecords = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      const data = await repairProgressService.getAllRepairProgress();
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading repair progress records:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.message || 'Failed to load repair progress records'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <div className="glass" style={{ padding: '2rem', borderRadius: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Repair Progress Records</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Review repair updates saved from the operational schedule form.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={loadRecords} className="btn btn-outline" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={() => navigate('/dashboard/facilities')} className="btn btn-primary">
            Back to Facilities
          </button>
        </div>
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

      {loading && records.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading repair progress records...</p>
      ) : records.length === 0 ? (
        <div className="empty-state" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '15px' }}>
          <h3 style={{ color: 'var(--text-dark)' }}>No repair progress records yet</h3>
          <p style={{ marginTop: '0.5rem' }}>Use the Update Repair Progress form on Operational Schedule to add the first record.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(255,255,255,0.45)', borderRadius: '12px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: 'rgba(99,102,241,0.1)' }}>
                <th style={cellHeaderStyle}>Resource</th>
                <th style={cellHeaderStyle}>Code</th>
                <th style={cellHeaderStyle}>Status</th>
                <th style={cellHeaderStyle}>Notes</th>
                <th style={cellHeaderStyle}>Technician</th>
                <th style={cellHeaderStyle}>Created</th>
                <th style={cellHeaderStyle}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
                  <td style={cellStyle}>{record.resourceName || 'N/A'}</td>
                  <td style={cellStyle}>{record.resourceCode || 'N/A'}</td>
                  <td style={cellStyle}>
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.14)', color: 'var(--primary-color)' }}>
                      {record.progressStatus || 'N/A'}
                    </span>
                  </td>
                  <td style={cellStyle}>{record.repairNotes || 'N/A'}</td>
                  <td style={cellStyle}>{record.technicianName || 'N/A'}</td>
                  <td style={cellStyle}>{formatDateTime(record.createdAt)}</td>
                  <td style={cellStyle}>{formatDateTime(record.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const cellHeaderStyle = {
  padding: '0.9rem 1rem',
  textAlign: 'left',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--text-dark)',
  whiteSpace: 'nowrap'
};

const cellStyle = {
  padding: '0.9rem 1rem',
  verticalAlign: 'top',
  color: 'var(--text-dark)',
  fontSize: '0.92rem'
};

export default RepairProgress;