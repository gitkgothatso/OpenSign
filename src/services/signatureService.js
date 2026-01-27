// src/services/signatureService.js
import apiClient from '../config/api';

/**
 * Signature service - handles signature operations
 * Migrated from Parse SDK to REST API
 */
export const signatureService = {
  /**
   * Get user's default signature
   * Replaces: Parse.Cloud.run('getdefaultsignature', {userId})
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Default signature data
   */
  getDefaultSignature: async (userId) => {
    const response = await apiClient.get(`/signatures/users/${userId}/default`);
    return response.data;
  },

  /**
   * Save or update signature
   * Replaces: Parse.Cloud.run('managesign', params)
   * @param {Object} signatureData - Signature data
   * @returns {Promise<Object>} Saved signature
   */
  manageSignature: async (signatureData) => {
    const response = await apiClient.post('/signatures/manage', signatureData);
    return response.data;
  },

  /**
   * Upload signature file
   * Replaces: new Parse.File().save()
   * @param {File} file - Signature file
   * @returns {Promise<Object>} Upload result with URL
   */
  uploadSignatureFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/signatures/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default signatureService;
