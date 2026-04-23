import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ticketService } from '../../services/ticketService';
import { AuthContext } from '../../context/AuthContext';
import TechnicianTicketPanel from './TechnicianTicketPanel';

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const PRIORITY_META = {
  URGENT: { label: 'Urgent', cls: 'priority-URGENT', dot: '#dc2626' },
  HIGH:   { label: 'High',   cls: 'priority-HIGH',   dot: '#ea580c' },
  MEDIUM: { label: 'Medium', cls: 'priority-MEDIUM', dot: '#ca8a04' },
  LOW:    { label: 'Low',    cls: 'priority-LOW',    dot: '#16a34a' },
};

const STATUS_META = {
  OPEN:        { label: 'Open',        cls: 'status-OPEN'        },
  IN_PROGRESS: { label: 'In Progress', cls: 'status-IN_PROGRESS' },
  RESOLVED:    { label: 'Resolved',    cls: 'status-RESOLVED'    },
  CLOSED:      { label: 'Closed',      cls: 'status-CLOSED'      },
  REJECTED:    { label: 'Rejected',    cls: 'status-REJECTED'    },
};

function timeAgo(dt) {
  if (!dt) return '—';
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isToday(dt) {
  if (!dt) return false;
  const d = new Date(dt);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth()    === now.getMonth()    &&
         d.getDate()     === now.getDate();
}

/* ─── Component ─────────────────────────────────────────────────────────── */
const TechnicianDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tickets,        setTickets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus,   setFilterStatus]   = useState('ALL');
  const [searchQuery,    setSearchQuery]    = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketService.getTechnicianTickets();
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching technician tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  /* Stats */
  const stats = {
    total:       tickets.length,
    inProgress:  tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved:    tickets.filter(t => t.status === 'RESOLVED' && isToday(t.updatedAt)).length,
    urgent:      tickets.filter(t => t.priority === 'URGENT' && !['CLOSED','RESOLVED','REJECTED'].includes(t.status)).length,
  };

  /* Filtered list */
  const filtered = tickets.filter(t => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.createdByName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleTicketUpdated = (updated) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTicket(updated);
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="tech-dashboard">

      {/* ── Header ── */}
      <div className="tech-header">
        <div className="tech-header-text">
          <h1>Technician Portal</h1>
          <p>
            Welcome back, <span className="tech-header-name">{user?.name || user?.email}</span>.
            Here are your assigned tickets.
          </p>
        </div>
        <button className="tech-refresh-btn" onClick={fetchTickets} title="Refresh">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="tech-stats-grid">
        <div className="tech-stat-card tech-stat-blue">
          <div className="tech-stat-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div>
            <div className="tech-stat-number">{stats.total}</div>
            <div className="tech-stat-label">Total Assigned</div>
          </div>
        </div>

        <div className="tech-stat-card tech-stat-purple">
          <div className="tech-stat-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <div className="tech-stat-number">{stats.inProgress}</div>
            <div className="tech-stat-label">In Progress</div>
          </div>
        </div>

        <div className="tech-stat-card tech-stat-green">
          <div className="tech-stat-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <div className="tech-stat-number">{stats.resolved}</div>
            <div className="tech-stat-label">Resolved Today</div>
          </div>
        </div>

        <div className="tech-stat-card tech-stat-red">
          <div className="tech-stat-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <div className="tech-stat-number">{stats.urgent}</div>
            <div className="tech-stat-label">Urgent Open</div>
          </div>
        </div>
      </div>

      {/* ── Ticket List Card ── */}
      <div className="tech-ticket-card">

        {/* Toolbar */}
        <div className="tech-toolbar">
          <h2 className="tech-toolbar-title">Assigned Tickets</h2>
          <div className="tech-toolbar-right">
            {/* Search */}
            <div className="tech-search">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder="Search tickets…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <select
              className="tech-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="tech-state-center">
            <div className="tech-spinner tech-spinner-lg"/>
            <p>Loading your assignments…</p>
          </div>
        ) : error ? (
          <div className="tech-state-center tech-state-error">
            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p>{error}</p>
            <button className="tech-btn-retry" onClick={fetchTickets}>Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="tech-state-center">
            <svg width="56" height="56" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p className="tech-state-title">
              {tickets.length === 0 ? 'No assigned tickets' : 'No tickets match your filter'}
            </p>
            <p className="tech-state-sub">
              {tickets.length === 0
                ? "You're all caught up! Enjoy your break."
                : 'Try changing the status filter or search term.'}
            </p>
          </div>
        ) : (
          <div className="tech-table-wrap">
            <table className="tech-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Student</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Age</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => {
                  const pm = PRIORITY_META[ticket.priority] || PRIORITY_META.LOW;
                  const sm = STATUS_META[ticket.status]     || STATUS_META.OPEN;
                  const isActive = selectedTicket?.id === ticket.id;
                  return (
                    <tr
                      key={ticket.id}
                      className={`tech-table-row ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <td>
                        <div className="tech-table-ticket-title">{ticket.title}</div>
                        <div className="tech-table-ticket-id">#{ticket.id?.slice(-8).toUpperCase()}</div>
                      </td>
                      <td>
                        <div className="tech-table-student">
                          <div className="tech-avatar tech-avatar-student tech-avatar-xs">
                            {(ticket.createdByName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <span>{ticket.createdByName || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`ticket-priority ${pm.cls}`}>{pm.label}</span>
                      </td>
                      <td>
                        <span className={`ticket-status ${sm.cls}`}>{sm.label}</span>
                      </td>
                      <td className="tech-table-age">{timeAgo(ticket.createdAt)}</td>
                      <td>
                        <button
                          className="tech-btn-view"
                          onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
                        >
                          View & Chat →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Slide-in Panel ── */}
      {selectedTicket && (
        <TechnicianTicketPanel
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onTicketUpdated={handleTicketUpdated}
        />
      )}
    </div>
  );
};

export default TechnicianDashboard;
