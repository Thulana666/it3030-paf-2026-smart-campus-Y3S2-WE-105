import api from './api';

const REPAIR_PROGRESS_BASE_URL = '/repair-progress';

export const getAllRepairProgress = async () => {
  const response = await api.get(REPAIR_PROGRESS_BASE_URL);
  return response.data;
};

export const getRepairProgressByResource = async (resourceId) => {
  const response = await api.get(`${REPAIR_PROGRESS_BASE_URL}/resource/${resourceId}`);
  return response.data;
};

export const createRepairProgress = async (payload) => {
  const response = await api.post(REPAIR_PROGRESS_BASE_URL, payload);
  return response.data;
};