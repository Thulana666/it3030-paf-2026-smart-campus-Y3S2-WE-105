import api from './api';

const RESOURCE_BASE_URL = '/resources';
const ADMIN_URL = '/resources/admin';

// Get all resources
export const getAllResources = async () => {
  const response = await api.get(RESOURCE_BASE_URL);
  return response.data;
};

// Get active resources only
export const getActiveResources = async () => {
  const response = await api.get(`${RESOURCE_BASE_URL}/active`);
  return response.data;
};

// Get resource by ID
export const getResourceById = async (id) => {
  const response = await api.get(`${RESOURCE_BASE_URL}/${id}`);
  return response.data;
};

// Search resources by keyword
export const searchResources = async (keyword) => {
  const response = await api.get(`${RESOURCE_BASE_URL}/search`, { params: { keyword } });
  return response.data;
};

// Get resources by category
export const getResourcesByCategory = async (category) => {
  const response = await api.get(`${RESOURCE_BASE_URL}/category/${category}`);
  return response.data;
};

// Get resources by building
export const getResourcesByBuilding = async (building) => {
  const response = await api.get(`${RESOURCE_BASE_URL}/building/${building}`);
  return response.data;
};

// Get resources by status
export const getResourcesByStatus = async (status) => {
  const response = await api.get(`${RESOURCE_BASE_URL}/status/${status}`);
  return response.data;
};

// ADMIN OPERATIONS

// Create new resource (ADMIN)
export const createResource = async (resourceData) => {
  const response = await api.post(ADMIN_URL, resourceData);
  return response.data;
};

// Update resource (ADMIN)
export const updateResource = async (id, resourceData) => {
  const response = await api.put(`${ADMIN_URL}/${id}`, resourceData);
  return response.data;
};

// Change resource status (ADMIN)
export const changeResourceStatus = async (id, newStatus) => {
  const response = await api.patch(`${ADMIN_URL}/${id}/status`, { status: newStatus });
  return response.data;
};

// Upload resource image (ADMIN)
export const uploadResourceImage = async (id, imageUrl) => {
  const response = await api.post(`${ADMIN_URL}/${id}/image`, { imageUrl });
  return response.data;
};

// Delete resource (ADMIN) - soft delete
export const deleteResource = async (id) => {
  const response = await api.delete(`${ADMIN_URL}/${id}`);
  return response.data;
};

// Hard delete resource (ADMIN) - permanent deletion
export const hardDeleteResource = async (id) => {
  const response = await api.delete(`${ADMIN_URL}/${id}/permanent`);
  return response.data;
};
