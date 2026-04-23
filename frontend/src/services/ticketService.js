import api from './api';

const normalizeAttachmentPath = (imagePath) => {
  if (!imagePath) return '';

  if (imagePath.startsWith('http')) {
    const { pathname, search } = new URL(imagePath);
    const fullPath = `${pathname}${search || ''}`;
    return fullPath.startsWith('/api/')
      ? fullPath.replace(/^\/api/, '')
      : imagePath;
  }

  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return path.startsWith('/api/') ? path.replace(/^\/api/, '') : path;
};

export const ticketService = {
  // ── User ticket operations ────────────────────────────────────────────────

  createTicket: async (formData) => {
    const response = await api.post('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMyTickets: async () => {
    const response = await api.get('/tickets/my');
    return response.data;
  },

  getTicketById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  updateTicket: async (id, payload) => {
    const response = await api.put(`/tickets/${id}`, payload);
    return response.data;
  },

  deleteTicket: async (id) => {
    await api.delete(`/tickets/${id}`);
  },

  // ── Comment operations (shared, used by both user and technician) ─────────

  addComment: async (id, payload) => {
    const response = await api.post(`/tickets/${id}/comments`, payload);
    return response.data;
  },

  getComments: async (id) => {
    const response = await api.get(`/tickets/${id}/comments`);
    return response.data;
  },

  deleteComment: async (id, commentId) => {
    const response = await api.delete(`/tickets/${id}/comments/${commentId}`);
    return response.data;
  },

  // ── Technician operations ─────────────────────────────────────────────────

  getTechnicianTickets: async () => {
    const response = await api.get('/technician/tickets');
    return response.data;
  },

  getTechnicianTicketById: async (id) => {
    const response = await api.get(`/technician/tickets/${id}`);
    return response.data;
  },

  /** Update ticket status (and optionally resolution notes) */
  updateTicketStatus: async (id, status, resolutionNotes = null) => {
    const response = await api.put(`/technician/tickets/${id}/status`, {
      status,
      resolutionNotes,
    });
    return response.data;
  },

  /** Resolve ticket with notes (legacy endpoint) */
  resolveTicket: async (id, resolutionNotes) => {
    const response = await api.put(
      `/technician/tickets/${id}/resolve`,
      { resolutionNotes }
    );
    return response.data;
  },

  /** Close ticket as solved */
  closeTicket: async (id, resolutionNotes = null) => {
    const response = await api.put(`/technician/tickets/${id}/close`, {
      resolutionNotes,
    });
    return response.data;
  },

  /** Get comments via technician endpoint (enriched with names) */
  getTechnicianComments: async (id) => {
    const response = await api.get(`/technician/tickets/${id}/comments`);
    return response.data;
  },

  /** Add comment via technician endpoint */
  addTechnicianComment: async (id, content) => {
    const response = await api.post(`/technician/tickets/${id}/comments`, { content });
    return response.data;
  },

  fetchAttachmentBlobUrl: async (imagePath) => {
    const attachmentPath = normalizeAttachmentPath(imagePath);
    const response = await api.get(attachmentPath, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },
};
