import apiClient from '../config/api';

/**
 * File upload service - replaces Parse Cloud function: fileupload
 */
export const fileService = {
  /**
   * Upload a file to storage (local or S3)
   * @param {File|Blob|Uint8Array} file - The file to upload
   * @param {string} filename - Optional filename (required for Uint8Array)
   * @param {string} contentType - Optional content type (default: application/pdf)
   * @param {Function} onProgress - Optional progress callback (progressValue, loaded, total)
   * @returns {Promise<{url: string, fileKey: string}>} File upload result with URL
   */
  uploadFile: async (file, filename = 'document.pdf', contentType = 'application/pdf', onProgress = null) => {
    const formData = new FormData();
    
    // Handle different input types
    let fileBlob;
    if (file instanceof File || file instanceof Blob) {
      fileBlob = file;
    } else if (file instanceof Uint8Array || Array.isArray(file)) {
      // Convert byte array to Blob
      fileBlob = new Blob([file], { type: contentType });
    } else {
      throw new Error('Invalid file type. Expected File, Blob, or Uint8Array');
    }
    
    formData.append('file', fileBlob, filename);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    // Add progress tracking if callback provided
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
      };
    }

    const response = await apiClient.post('/files/upload', formData, config);

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
