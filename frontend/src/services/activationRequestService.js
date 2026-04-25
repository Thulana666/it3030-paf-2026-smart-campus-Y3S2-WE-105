import api from './api';

export const getMyActivationRequests = async () => {
  const res = await api.get('/technician/activation-requests/my');
  return res.data;
};

export const getPendingActivationRequests = async () => {
  const res = await api.get('/admin/activation-requests/pending');
  return res.data;
};

export const approveActivationRequest = async (requestId) => {
  const res = await api.patch(`/admin/activation-requests/${requestId}/approve`);
  return res.data;
};

export const rejectActivationRequest = async (requestId, reason) => {
  const res = await api.patch(`/admin/activation-requests/${requestId}/reject`, { reason });
  return res.data;
};

export const completeRepair = async (resourceId, assignmentId) => {
  const res = await api.patch(`/technician/resources/${resourceId}/complete`, { assignmentId });
  return res.data;
};

export const requestActivation = async (resourceId, assignmentId) => {
  const res = await api.post(`/technician/resources/${resourceId}/request-activation`, { assignmentId });
  return res.data;
};

