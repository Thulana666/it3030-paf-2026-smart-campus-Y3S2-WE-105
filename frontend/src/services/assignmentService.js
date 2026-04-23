import api from './api';

const ASSIGNMENT_BASE_URL = '/assignments';

// Get all assignments for current technician
export const getMyAssignments = async () => {
  const response = await api.get(`${ASSIGNMENT_BASE_URL}/my-assignments`);
  return response.data;
};

// Get active assignments for current technician
export const getMyActiveAssignments = async () => {
  const response = await api.get(`${ASSIGNMENT_BASE_URL}/my-assignments/active`);
  return response.data;
};

// Get in-progress assignments for current technician
export const getMyInProgressAssignments = async () => {
  const response = await api.get(`${ASSIGNMENT_BASE_URL}/my-assignments/in-progress`);
  return response.data;
};

// Get all assignments for a specific technician (ADMIN only)
export const getTechnicianAssignments = async (technicianId) => {
  const response = await api.get(`${ASSIGNMENT_BASE_URL}/technician/${technicianId}`);
  return response.data;
};

// Get all assignments for a resource
export const getResourceAssignments = async (resourceId) => {
  const response = await api.get(`${ASSIGNMENT_BASE_URL}/resource/${resourceId}`);
  return response.data;
};

// Assign resource to technician (ADMIN only)
export const assignResource = async (assignmentData) => {
  const response = await api.post(`${ASSIGNMENT_BASE_URL}/assign`, assignmentData);
  return response.data;
};

// Update repair progress (TECHNICIAN/ADMIN)
export const updateRepairProgress = async (assignmentId, progressStatus, notes) => {
  const payload = {};
  if (typeof progressStatus === 'string' && progressStatus.trim()) {
    payload.progressStatus = progressStatus;
  }
  if (typeof notes === 'string' && notes.trim()) {
    payload.notes = notes;
  }

  const response = await api.patch(`${ASSIGNMENT_BASE_URL}/${assignmentId}/progress`, payload);
  return response.data;
};

// Append a single repair note line (TECHNICIAN/ADMIN)
export const appendRepairNote = async (assignmentId, note) => {
  const response = await api.patch(`${ASSIGNMENT_BASE_URL}/${assignmentId}/notes/append`, { note });
  return response.data;
};

// Delete assignment (ADMIN only)
export const deleteAssignment = async (assignmentId) => {
  const response = await api.delete(`${ASSIGNMENT_BASE_URL}/${assignmentId}`);
  return response.data;
};

// Get assignments by status (ADMIN only)
export const getAssignmentsByStatus = async (status) => {
  const response = await api.get(`${ASSIGNMENT_BASE_URL}/status/${status}`);
  return response.data;
};
