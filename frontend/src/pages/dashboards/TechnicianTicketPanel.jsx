import React, { useState, useEffect, useRef, useContext } from 'react';
import { ticketService } from '../../services/ticketService';
import { AuthContext } from '../../context/AuthContext';

/* ─── Priority / Status helpers ─────────────────────────────────────────── */
const PRIORITY_META = {
  URGENT: { label: 'Urgent', cls: 'priority-URGENT' },
  HIGH:   { label: 'High',   cls: 'priority-HIGH'   },
  MEDIUM: { label: 'Medium', cls: 'priority-MEDIUM' },
  LOW:    { label: 'Low',    cls: 'priority-LOW'    },
};

const STATUS_META = {
  OPEN:        { label: 'Open',        cls: 'status-OPEN'        },
  IN_PROGRESS: { label: 'In Progress', cls: 'status-IN_PROGRESS' },
  RESOLVED:    { label: 'Resolved',    cls: 'status-RESOLVED'    },
  CLOSED:      { label: 'Closed',      cls: 'status-CLOSED'      },
  REJECTED:    { label: 'Rejected',    cls: 'status-REJECTED'    },
};

function timeAgo(dt) {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── Component ─────────────────────────────────────────────────────────── */
const TechnicianTicketPanel = ({ ticket: initialTicket, onClose, onTicketUpdated }) => {
  const { user } = useContext(AuthContext);
  const chatEndRef  = useRef(null);
  const inputRef    = useRef(null);

  const [ticket,          setTicket]          = useState(initialTicket);
  const [comments,        setComments]        = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newMessage,      setNewMessage]      = useState('');
  const [sendingMsg,      setSendingMsg]      = useState(false);

  // Status management
  const [selectedStatus, setSelectedStatus]   = useState(ticket?.status || 'IN_PROGRESS');
  const [resNotes,       setResNotes]         = useState(ticket?.resolutionNotes || '');
  const [savingStatus,   setSavingStatus]     = useState(false);
  const [showCloseModal, setShowCloseModal]   = useState(false);
  const [closingTicket,  setClosingTicket]    = useState(false);
  const [activeTab,      setActiveTab]        = useState('chat'); // 'chat' | 'details'

  /* Sync if parent passes a new ticket */
  useEffect(() => {
    if (initialTicket) {
      setTicket(initialTicket);
      setSelectedStatus(initialTicket.status);
      setResNotes(initialTicket.resolutionNotes || '');
    }
  }, [initialTicket]);

  /* Load comments */
  useEffect(() => {
    if (!ticket) return;
    loadComments();
  }, [ticket?.id]);

  /* Auto-scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const data = await ticketService.getTechnicianComments(ticket.id);
      setComments(data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || sendingMsg) return;

    setSendingMsg(true);
    try {
      const comment = await ticketService.addTechnicianComment(ticket.id, newMessage.trim());
      setComments(prev => [...prev, comment]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUpdateStatus = async () => {
    if (selectedStatus === ticket.status && resNotes === (ticket.resolutionNotes || '')) return;
    setSavingStatus(true);
    try {
      const updated = await ticketService.updateTicketStatus(ticket.id, selectedStatus, resNotes);
      setTicket(updated);
      onTicketUpdated?.(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleCloseTicket = async () => {
    setClosingTicket(true);
    try {
      const updated = await ticketService.closeTicket(ticket.id, resNotes);
      setTicket(updated);
      onTicketUpdated?.(updated);
      setShowCloseModal(false);
    } catch (err) {
      console.error('Failed to close ticket:', err);
      alert(err.response?.data?.message || 'Failed to close ticket.');
    } finally {
      setClosingTicket(false);
    }
  };

  if (!ticket) return null;

  const isClosed    = ['CLOSED', 'RESOLVED', 'REJECTED'].includes(ticket.status);
  const priorityMeta = PRIORITY_META[ticket.priority] || PRIORITY_META.LOW;
  const statusMeta   = STATUS_META[ticket.status]     || STATUS_META.OPEN;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Overlay */}
      <div className="tech-panel-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="tech-panel">

        {/* Panel Header */}
        <div className="tech-panel-header">
          <div className="tech-panel-header-left">
            <button className="tech-panel-back" onClick={onClose} title="Close">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <div>
              <div className="tech-panel-id">#{ticket.id?.slice(-8).toUpperCase()}</div>
              <h2 className="tech-panel-title">{ticket.title}</h2>
            </div>
          </div>
          <div className="tech-panel-badges">
            <span className={`ticket-priority ${priorityMeta.cls}`}>{priorityMeta.label}</span>
            <span className={`ticket-status ${statusMeta.cls}`}>{statusMeta.label}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tech-panel-tabs">
          <button
            className={`tech-panel-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
            Chat {comments.length > 0 && <span className="tech-panel-tab-count">{comments.length}</span>}
          </button>
          <button
            className={`tech-panel-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Details
          </button>
        </div>

        {/* Panel Body — two columns: content + sidebar */}
        <div className="tech-panel-body">

          {/* LEFT: Chat / Details */}
          <div className="tech-panel-content">

            {/* ── CHAT TAB ── */}
            {activeTab === 'chat' && (
              <div className="tech-chat-container">
                {/* Student info banner */}
                <div className="tech-chat-student-banner">
                  <div className="tech-avatar tech-avatar-student">
                    {(ticket.createdByName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="tech-chat-student-name">
                      {ticket.createdByName || 'Student'}
                    </div>
                    <div className="tech-chat-student-sub">Ticket creator · {timeAgo(ticket.createdAt)}</div>
                  </div>
                </div>

                {/* Messages */}
                <div className="tech-chat-messages">
                  {commentsLoading ? (
                    <div className="tech-chat-loading">
                      <div className="tech-spinner"/>
                      <span>Loading conversation…</span>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="tech-chat-empty">
                      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const isMine = comment.authorId === user?.id;
                      const isTech = comment.authorRole === 'TECHNICIAN';
                      return (
                        <div
                          key={comment.id}
                          className={`tech-chat-row ${isMine ? 'mine' : 'theirs'}`}
                        >
                          {!isMine && (
                            <div className={`tech-avatar ${isTech ? 'tech-avatar-tech' : 'tech-avatar-student'}`}>
                              {(comment.authorName || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="tech-chat-bubble-wrap">
                            <div className="tech-chat-bubble-meta">
                              <span>{isMine ? 'You' : (comment.authorName || 'User')}</span>
                              <span>{timeAgo(comment.createdAt)}</span>
                            </div>
                            <div className={`tech-chat-bubble ${isMine ? 'tech-chat-bubble-tech' : 'tech-chat-bubble-student'}`}>
                              {comment.content}
                            </div>
                          </div>
                          {isMine && (
                            <div className={`tech-avatar tech-avatar-tech`}>
                              {(user?.name || user?.email || 'T').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                {!isClosed ? (
                  <form className="tech-chat-input-wrap" onSubmit={handleSendMessage}>
                    <textarea
                      ref={inputRef}
                      className="tech-chat-input"
                      placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={2}
                    />
                    <button
                      type="submit"
                      className="tech-chat-send"
                      disabled={!newMessage.trim() || sendingMsg}
                    >
                      {sendingMsg ? (
                        <div className="tech-spinner tech-spinner-sm"/>
                      ) : (
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                        </svg>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="tech-chat-closed-notice">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    This ticket is {ticket.status.toLowerCase()} — no new messages.
                  </div>
                )}
              </div>
            )}

            {/* ── DETAILS TAB ── */}
            {activeTab === 'details' && (
              <div className="tech-details-tab">
                <div className="tech-detail-section">
                  <h3 className="tech-detail-label">Description</h3>
                  <p className="tech-detail-value">{ticket.description}</p>
                </div>

                <div className="tech-detail-grid">
                  <div className="tech-detail-section">
                    <h3 className="tech-detail-label">Category</h3>
                    <p className="tech-detail-value">{ticket.category || '—'}</p>
                  </div>
                  <div className="tech-detail-section">
                    <h3 className="tech-detail-label">Resource ID</h3>
                    <p className="tech-detail-value">{ticket.resourceId || '—'}</p>
                  </div>
                  <div className="tech-detail-section">
                    <h3 className="tech-detail-label">Contact</h3>
                    <p className="tech-detail-value">{ticket.contactDetails || '—'}</p>
                  </div>
                  <div className="tech-detail-section">
                    <h3 className="tech-detail-label">Submitted</h3>
                    <p className="tech-detail-value">{new Date(ticket.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Images */}
                {ticket.imagePaths?.length > 0 && (
                  <div className="tech-detail-section">
                    <h3 className="tech-detail-label">Attachments</h3>
                    <div className="tech-attachments">
                      {ticket.imagePaths.map((img, i) => {
                        const src = img.startsWith('http') ? img : `http://localhost:8080${img.startsWith('/') ? '' : '/'}${img}`;
                        return (
                          <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="tech-attachment">
                            <img src={src} alt={`Attachment ${i + 1}`}
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/120x80?text=IMG'; }}
                            />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Resolution notes (if any) */}
                {ticket.resolutionNotes && (
                  <div className="tech-detail-section tech-detail-resolution">
                    <h3 className="tech-detail-label">Resolution Notes</h3>
                    <p className="tech-detail-value">{ticket.resolutionNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Management Sidebar */}
          <div className="tech-panel-sidebar">
            <div className="tech-sidebar-card">
              <h3 className="tech-sidebar-title">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Manage Ticket
              </h3>

              {isClosed ? (
                <div className="tech-sidebar-closed">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p>Ticket is <strong>{ticket.status}</strong></p>
                  {ticket.resolutionNotes && (
                    <div className="tech-sidebar-res-notes">
                      <span>Resolution:</span>
                      <p>{ticket.resolutionNotes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="tech-form-group">
                    <label>Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>

                  <div className="tech-form-group">
                    <label>Resolution Notes</label>
                    <textarea
                      value={resNotes}
                      onChange={(e) => setResNotes(e.target.value)}
                      placeholder="Document the fix or current progress…"
                      rows={4}
                    />
                  </div>

                  <button
                    className="tech-btn-update"
                    onClick={handleUpdateStatus}
                    disabled={savingStatus}
                  >
                    {savingStatus ? (
                      <><div className="tech-spinner tech-spinner-sm"/> Saving…</>
                    ) : (
                      <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Update Status
                      </>
                    )}
                  </button>

                  <div className="tech-sidebar-divider"/>

                  <button
                    className="tech-btn-close"
                    onClick={() => setShowCloseModal(true)}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Close as Solved
                  </button>
                  <p className="tech-close-hint">
                    Marks the ticket CLOSED and notifies the student.
                  </p>
                </>
              )}
            </div>

            {/* Quick info */}
            <div className="tech-sidebar-card tech-sidebar-info">
              <h3 className="tech-sidebar-title">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Info
              </h3>
              <div className="tech-info-row">
                <span>Reporter</span>
                <span>{ticket.createdByName || '—'}</span>
              </div>
              <div className="tech-info-row">
                <span>Assigned To</span>
                <span>{ticket.assignedToName || 'You'}</span>
              </div>
              <div className="tech-info-row">
                <span>Created</span>
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="tech-info-row">
                <span>Last Updated</span>
                <span>{new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Close Confirmation Modal ── */}
      {showCloseModal && (
        <div className="tech-modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="tech-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tech-modal-icon">
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3>Close Ticket as Solved?</h3>
            <p>
              This will mark the ticket as <strong>CLOSED</strong> and send a notification to{' '}
              <strong>{ticket.createdByName || 'the student'}</strong>.
              This action cannot be undone.
            </p>
            <div className="tech-modal-actions">
              <button
                className="tech-modal-cancel"
                onClick={() => setShowCloseModal(false)}
                disabled={closingTicket}
              >
                Cancel
              </button>
              <button
                className="tech-modal-confirm"
                onClick={handleCloseTicket}
                disabled={closingTicket}
              >
                {closingTicket ? (
                  <><div className="tech-spinner tech-spinner-sm"/> Closing…</>
                ) : (
                  '✅ Yes, Close as Solved'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TechnicianTicketPanel;
