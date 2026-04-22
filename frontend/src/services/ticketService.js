import api from './api';

export const ticketService = {
  createTicket: async (formData) => {
    // FormData implies multipart/form-data
    const response = await api.post('/tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyTickets: async () => {
    const response = await api.get('/tickets/my');
    return response.data;
  },

  getTechnicianTickets: async () => {
    const response = await api.get('/technician/tickets');
    return response.data;
  },

  getTicketById: async (id) => {
    // Adding this one because TicketDetail needs to fetch single ticket
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  resolveTicket: async (id, payload) => {
    // Payload: { status: 'RESOLVED', resolutionNotes: '...' }
    const response = await api.put(`/technician/tickets/${id}/resolve`, payload);
    return response.data;
  },

  addComment: async (id, payload) => {
    // Payload: { content: '...' }
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

  updateTicket: async (id, payload) => {
    // payload: { title, description, category, priority, contactDetails, resourceId }
    const response = await api.put(`/tickets/${id}`, payload);
    return response.data;
  },

  deleteTicket: async (id) => {
    await api.delete(`/tickets/${id}`);
  },
};
