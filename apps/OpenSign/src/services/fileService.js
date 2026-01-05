import apiClient from './apiClient';

/**
 * File upload service - replaces Parse Cloud function: fileupload
 */
export const fileService = {
  /**
   * Upload a file to storage (local or S3)
   * @param {File} file - The file to upload
   * @returns {Promise<{url: string}>} File upload result with URL
   */
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  },

  /**
   * Get secure/presigned URL for a file
   * Replaces Parse Cloud function: fileupload when checking if URL needs security
   * @param {string} url - The original file URL
   * @returns {Promise<{url: string}>} Secure URL
   */
  getSecureUrl: async (url) => {
    const response = await apiClient.post('/files/secure-url', { url });
    return response.data;
  }
};

export default fileService;
