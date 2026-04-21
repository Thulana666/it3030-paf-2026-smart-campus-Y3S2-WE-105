import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService } from '../../../services/ticketService';
import { AuthContext } from '../../../context/AuthContext';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Resolution state
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const data = await ticketService.getTicketById(id);
      setTicket(data);
      // Pre-fill resolution notes if it already exists
      if (data.resolutionNotes) {
        setResolutionNotes(data.resolutionNotes);
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      setError('Failed to load ticket details.');
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
      setNewComment('');
      fetchTicket(); // Refresh ticket to get new comments
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await ticketService.deleteComment(id, commentId);
      fetchTicket(); // Refresh comments list
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      alert('Resolution notes are required to resolve a ticket.');
      return;
    }

    setResolveLoading(true);
    try {
      await ticketService.resolveTicket(id, {
        status: resolutionStatus,
        resolutionNotes: resolutionNotes
      });
      alert('Ticket status updated successfully.');
      fetchTicket();
    } catch (err) {
      console.error('Error resolving ticket:', err);
      alert('Failed to update ticket status.');
    } finally {
      setResolveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
        <p className="font-medium text-lg">{error || 'Ticket not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm underline hover:text-red-900">
          Go Back
        </button>
      </div>
    );
  }

  const getPriorityBadge = (priority) => {
    const colors = {
      URGENT: 'bg-red-100 text-red-800 border-red-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusBadge = (status) => {
    const colors = {
      OPEN: 'bg-blue-100 text-blue-800 border-blue-200',
      IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
      RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-[slideUp_0.4s_ease-out]">
      
      {/* Header Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">#{ticket.id}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityBadge(ticket.priority)}`}>
                {ticket.priority}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{ticket.title}</h1>
          </div>
          
          <div className="text-sm text-gray-500 flex flex-col items-start md:items-end">
            <p>Category: <span className="font-medium text-gray-800">{ticket.category}</span></p>
            {ticket.resourceId && (
              <p>Resource ID: <span className="font-medium text-gray-800">{ticket.resourceId}</span></p>
            )}
            <p className="mt-1 text-xs">Created: {new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
          <p className="text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Images Section */}
        {ticket.imageUrls && ticket.imageUrls.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Attachments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {ticket.imageUrls.map((imgUrl, index) => {
                // Ensure URL is properly formatted to point to backend if it's a relative path
                const fullUrl = imgUrl.startsWith('http') ? imgUrl : `http://localhost:8080${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
                return (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group">
                    <img 
                      src={fullUrl} 
                      alt={`Attachment ${index + 1}`} 
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'; }}
                    />
                    <a 
                      href={fullUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium backdrop-blur-sm"
                    >
                      View Full Size
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Comments Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              Activity & Comments
            </h2>

            {/* Comment List */}
            <div className="space-y-5 mb-8">
              {!ticket.comments || ticket.comments.length === 0 ? (
                <p className="text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg">No comments yet. Be the first to reply.</p>
              ) : (
                ticket.comments.map((comment) => (
                  <div key={comment.id} className={`p-4 rounded-xl flex flex-col gap-2 ${comment.authorId === user?.id ? 'bg-blue-50 border border-blue-100 ml-8' : 'bg-gray-50 border border-gray-100 mr-8'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">{comment.authorName || 'User'}</span>
                        <span className="text-xs text-gray-500 ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      
                      {/* CRITICAL: Conditionally render Delete Comment button */}
                      {comment.authorId === user?.id && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium hover:bg-red-100 px-2 py-1 rounded transition-colors"
                          title="Delete comment"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mt-4">
              <label htmlFor="comment" className="sr-only">Add a comment</label>
              <div className="relative">
                <textarea
                  id="comment"
                  rows="3"
                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-4 bg-gray-50"
                  placeholder="Type your comment here..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                ></textarea>
                <div className="absolute bottom-3 right-3">
                  <button
                    type="submit"
                    disabled={commentLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {commentLoading ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar: Resolution & Status (TECHNICIAN ONLY) */}
        <div className="lg:col-span-1 space-y-6">
          {user?.role === 'TECHNICIAN' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Technician Actions
              </h2>
              
              <form onSubmit={handleResolveTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                  <select
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm p-2.5 bg-gray-50"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
                  <textarea
                    rows="4"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Document the fix or current status..."
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm p-3 bg-gray-50"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={resolveLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
                >
                  {resolveLoading ? 'Updating...' : 'Update Ticket'}
                </button>
              </form>
            </div>
          ) : (
            ticket.resolutionNotes && (
              <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100 p-6">
                <h2 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Resolution Details
                </h2>
                <p className="text-sm text-emerald-900 whitespace-pre-wrap">{ticket.resolutionNotes}</p>
              </div>
            )
          )}

          {/* Quick Info Sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Ticket Lifecycle</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Created At</span>
                <span className="font-medium text-gray-800">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Last Updated</span>
                <span className="font-medium text-gray-800">{new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Reporter</span>
                <span className="font-medium text-gray-800">{ticket.authorName || `User #${ticket.authorId}`}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
