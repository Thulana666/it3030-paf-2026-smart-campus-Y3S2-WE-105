import api from './api';

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await api.post('/users/change-password', passwordData);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const adminCreateUser = async (userData) => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

export const adminDeleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const adminUpdateUserRole = async (userId, role) => {
  const response = await api.patch(`/admin/users/${userId}/role`, null, { params: { role } });
  return response.data;
};
