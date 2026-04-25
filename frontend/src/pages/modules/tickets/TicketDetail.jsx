import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ticketService } from "../../../services/ticketService";
import { AuthContext } from "../../../context/AuthContext";

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState({});

  // Comment state
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // Resolution state
  const [resolutionStatus, setResolutionStatus] = useState("RESOLVED");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolveLoading, setResolveLoading] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const generatedUrls = [];

    const loadAttachmentUrls = async () => {
      if (!ticket?.imagePaths?.length) {
        setAttachmentUrls({});
        return;
      }

      const entries = await Promise.all(
        ticket.imagePaths.map(async (imgUrl, index) => {
          try {
            const blobUrl = await ticketService.fetchAttachmentBlobUrl(imgUrl);
            generatedUrls.push(blobUrl);
            return [index, blobUrl];
          } catch (err) {
            console.error(`Failed to load attachment ${index + 1}:`, err);
            return [index, null];
          }
        }),
      );

      if (!isMounted) return;

      const nextUrls = {};
      entries.forEach(([index, url]) => {
        if (url) nextUrls[index] = url;
      });
      setAttachmentUrls(nextUrls);
    };

    loadAttachmentUrls();

    return () => {
      isMounted = false;
      generatedUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [ticket?.id, ticket?.imagePaths]);

  const fetchTicket = async () => {
    try {
      const [ticketData, commentsData] = await Promise.all([
        ticketService.getTicketById(id),
        ticketService.getComments(id),
      ]);
      setTicket(ticketData);
      setComments(commentsData || []);
      if (ticketData.resolutionNotes) {
        setResolutionNotes(ticketData.resolutionNotes);
      }
    } catch (err) {
      console.error("Error fetching ticket details:", err);
      setError("Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      await ticketService.addComment(id, { content: newComment });
      setNewComment("");
      fetchTicket(); 
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      await ticketService.deleteComment(id, commentId);
      fetchTicket();
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment");
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) return;
    setDeleteLoading(true);
    try {
      await ticketService.deleteTicket(id);
      navigate("/dashboard/incident-tickets");
    } catch (err) {
      console.error("Error deleting ticket:", err);
      alert(
        err.response?.data?.message ||
        "Failed to delete ticket. Only OPEN tickets can be deleted.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      alert("Resolution notes are required to resolve a ticket.");
      return;
    }

    setResolveLoading(true);
    try {
      await ticketService.resolveTicket(id, {
        status: resolutionStatus,
        resolutionNotes: resolutionNotes,
      });
      alert("Ticket status updated successfully.");
      fetchTicket();
    } catch (err) {
      console.error("Error resolving ticket:", err);
      alert("Failed to update ticket status.");
    } finally {
      setResolveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="ticket-spinner"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page-container">
        <div className="glass" style={{ padding: '2rem', textAlign: 'center', borderLeft: '5px solid #ef4444' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '1rem' }}>{error || "Ticket not found"}</h2>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </div>
    );
  }

  // Styling Helpers
  const getPriorityStyle = (priority) => {
    const styles = {
      URGENT: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' },
      HIGH: { bg: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.2)' },
      MEDIUM: { bg: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)' },
      LOW: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' },
    };
    return styles[priority] || { bg: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' };
  };

  const getStatusStyle = (status) => {
    const styles = {
      OPEN: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' },
      IN_PROGRESS: { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)' },
      RESOLVED: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' },
      CLOSED: { bg: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' },
    };
    return styles[status] || { bg: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' };
  };

  const pStyle = getPriorityStyle(ticket.priority);
  const sStyle = getStatusStyle(ticket.status);

  return (
    <div className="page-container" style={{ animation: 'slideUp 0.5s ease backwards' }}>
      {/* Header / Info Card */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '1.2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: '0.3rem' }}>
                #{ticket.id}
              </span>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700', backgroundColor: pStyle.bg, color: pStyle.color, border: pStyle.border }}>
                {ticket.priority}
              </span>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700', backgroundColor: sStyle.bg, color: sStyle.color, border: sStyle.border }}>
                {ticket.status.replace("_", " ")}
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', fontWeight: 'bold', margin: '0' }}>{ticket.title}</h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Category: <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{ticket.category}</span>
            </p>
            {ticket.resourceId && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Resource: <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{ticket.resourceId}</span>
              </p>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Created: {new Date(ticket.createdAt).toLocaleString()}</p>
            
            {user?.id === ticket.createdBy && ticket.status === "OPEN" && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/dashboard/tickets/${id}/edit`)}>✏️ Edit</button>
                <button className="btn btn-sm" onClick={handleDeleteTicket} disabled={deleteLoading} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'transparent' }}>
                  {deleteLoading ? "Deleting…" : "🗑️ Delete"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ background: 'rgba(248, 250, 252, 0.7)', padding: '1.25rem', borderRadius: '0.8rem', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Description</h3>
          <p style={{ color: 'var(--text-dark)', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>{ticket.description}</p>
        </div>

        {ticket.imagePaths && ticket.imagePaths.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Attachments</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {ticket.imagePaths.map((imgUrl, index) => {
                const attachmentSrc = attachmentUrls[index];
                return (
                  <a key={index} href={attachmentSrc || undefined} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '0.8rem', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', position: 'relative', aspectRatio: '4/3', background: '#f8fafc' }}>
                     <img
                      src={attachmentSrc || "https://via.placeholder.com/400x300?text=Loading..."}
                      alt={`Attachment ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found"; }}
                    />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Comments Section */}
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.2rem', gridColumn: '1 / span 2' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💬 Activity & Comments
          </h2>

          <div style={{ background: 'rgba(248, 250, 252, 0.5)', borderRadius: '1rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '300px', maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid rgba(0,0,0,0.05)' }}>
            {comments.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                No messages yet. Start the conversation!
              </div>
            ) : (
              comments.map((comment) => {
                const isMe = comment.authorId === user?.id;
                const isTech = comment.authorRole === "TECHNICIAN";
                
                return (
                  <div key={comment.id} style={{ display: 'flex', gap: '0.75rem', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    {!isMe && (
                      <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: isTech ? 'var(--primary-color)' : '#f97316', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>
                        {(comment.authorName || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textAlign: isMe ? 'right' : 'left', padding: '0 0.5rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{isMe ? "You" : comment.authorName || "User"}</span> • {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div style={{ background: isMe ? 'var(--primary-color)' : (isTech ? 'rgba(99, 102, 241, 0.1)' : 'white'), color: isMe ? 'white' : 'var(--text-dark)', padding: '0.75rem 1rem', borderRadius: '1rem', borderBottomRightRadius: isMe ? '0' : '1rem', borderBottomLeftRadius: isMe ? '1rem' : '0', border: isMe ? 'none' : '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <p style={{ fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{comment.content}</p>
                      </div>
                      {isMe && (
                        <div style={{ textAlign: 'right', marginTop: '0.25rem' }}>
                          <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>Delete</button>
                        </div>
                      )}
                    </div>
                    {isMe && (
                      <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>
                        {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.75rem' }}>
            <textarea
              style={{ flex: 1, padding: '0.875rem 1.25rem', borderRadius: '2rem', border: '1px solid rgba(0,0,0,0.1)', background: 'white', resize: 'none', fontSize: '0.9rem', outline: 'none' }}
              rows="1"
              placeholder="Type your message... (Shift+Enter for new line)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(e); } }}
            ></textarea>
            <button type="submit" disabled={commentLoading || !newComment.trim()} className="btn btn-primary" style={{ borderRadius: '2rem', padding: '0 1.5rem', minWidth: '80px' }}>
              {commentLoading ? '⏳' : 'Send'}
            </button>
          </form>
        </div>

        {/* Technician Sidebar or Resolution Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: 'auto' }}>
          {user?.role === "TECHNICIAN" ? (
            <div className="glass" style={{ padding: '2rem', borderRadius: '1.2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--primary-color), #22c55e)' }}></div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-dark)', marginBottom: '1.25rem' }}>🛠️ Technician Actions</h2>
              <form onSubmit={handleResolveTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Update Status</label>
                  <select value={resolutionStatus} onChange={(e) => setResolutionStatus(e.target.value)} style={{ padding: '0.6rem', fontSize: '0.9rem' }}>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label>Resolution Notes</label>
                  <textarea rows="4" value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="Document the fix or status..." required style={{ padding: '0.75rem', fontSize: '0.9rem' }}></textarea>
                </div>
                <button type="submit" disabled={resolveLoading} className="btn" style={{ background: '#10b981', color: 'white', width: '100%' }}>
                  {resolveLoading ? "Updating..." : "Update Ticket"}
                </button>
              </form>
            </div>
          ) : (
            ticket.resolutionNotes && (
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.2rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#065f46', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ✅ Resolution Details
                </h2>
                <p style={{ color: '#064e3b', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {ticket.resolutionNotes}
                </p>
              </div>
            )
          )}

          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.2rem' }}>
             <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Ticket Lifecycle</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                 <span style={{ color: 'var(--text-muted)' }}>Created At</span>
                 <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{new Date(ticket.createdAt).toLocaleDateString()}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                 <span style={{ color: 'var(--text-muted)' }}>Last Updated</span>
                 <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-muted)' }}>Reporter</span>
                 <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{ticket.authorName || `User`}</span>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TicketDetail;