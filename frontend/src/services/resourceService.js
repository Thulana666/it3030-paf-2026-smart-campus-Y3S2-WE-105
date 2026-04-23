import api from './api';

export const resourceService = {
  getAllResources: async () => {
    const response = await api.get('/resources');
    return response.data;
  }
};
