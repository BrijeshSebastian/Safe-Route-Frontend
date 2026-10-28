import { apiClient } from './client';

export const filesApi = {
  fetchImageBlob: async (imageUrl) => {
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }
    const filename = imageUrl.split('/').filter(Boolean).pop();
    const res = await apiClient.get(`/files/${filename}`, {
      responseType: 'blob',
    });
    return res.data;
  },
};

export default filesApi;
