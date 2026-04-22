import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';

const STATUS_LABELS = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Resolved',
  CLOSED:      'Closed',
  REJECTED:    'Rejected',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const IncidentTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  useEffect(() => {
    ticketService.getMyTickets()
      .then(setTickets)
      .catch((err) => {
        console.error('Failed to fetch tickets:', err);
        setError('Failed to load your tickets. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container" style={{ animation: 'slideUp 0.5s ease backwards' }}>

      {/* ── Page Header ── */}
      <div className="glass ticket-page-header">
        <div>
          <h1 style={{ fontSize: '1.9rem', marginBottom: '0.25rem', color: 'var(--text-dark)' }}>
            Incident Tickets
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.93rem' }}>
            Report and track hardware, software, or campus environment issues.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/dashboard/tickets/create')}
          style={{ padding: '0.65rem 1.5rem', whiteSpace: 'nowrap' }}
        >
          + File New Report
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="glass ticket-spinner-wrap">
          <div className="ticket-spinner" />
          Loading your tickets…
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="ticket-error">{error}</div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && tickets.length === 0 && (
        <div className="glass ticket-empty">
          <div className="ticket-empty-icon">🎫</div>
          <h3>No tickets yet</h3>
          <p>You haven't filed any incident reports. Submit one to get started.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/dashboard/tickets/create')}
            style={{ padding: '0.65rem 2rem' }}
          >
            File New Report
          </button>
        </div>
      )}

      {/* ── Ticket list ── */}
      {!loading && !error && tickets.length > 0 && (
        <div className="ticket-list">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`glass ticket-card priority-${ticket.priority}`}
              onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/dashboard/tickets/${ticket.id}`)}
            >
              {/* Left section */}
              <div className="ticket-card-left">
                <div className="ticket-card-meta">
                  <span className={`ticket-priority priority-${ticket.priority}`}>
                    {ticket.priority}
                  </span>
                  <span className="ticket-category-label">{ticket.category}</span>
                </div>
                <p className="ticket-card-title">{ticket.title}</p>
                <p className="ticket-card-date">
                  Filed {formatDate(ticket.createdAt)}
                  {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt &&
                    ` · Updated ${formatDate(ticket.updatedAt)}`}
                </p>
              </div>

              {/* Right section */}
              <div className="ticket-card-right">
                <span className={`ticket-status status-${ticket.status}`}>
                  {STATUS_LABELS[ticket.status] || ticket.status}
                </span>
                {/* Chevron */}
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                  stroke="var(--text-muted)" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncidentTickets;
