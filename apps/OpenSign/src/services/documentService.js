// src/services/documentService.js
import apiClient from '../config/api';

/**
 * Document service - handles document operations
 * Replaces Parse Cloud functions: getDocument, saveDocument
 */
export const documentService = {
  /**
   * Get document by ID
   * Replaces Parse Cloud function: getDocument(docId, include)
   * 
   * @param {string} docId - Document ID
   * @param {string} include - Optional comma-separated list of fields to include/populate
   * @returns {Promise<Object>} Document data
   */
  getDocument: async (docId, include) => {
    // Use Parse-compatible endpoint for MongoDB contracts_Document
    const response = await apiClient.get(`/app/classes/contracts_Document/${docId}`);
    return response.data;
  },

  /**
   * Save/create document
   * Replaces Parse Cloud function: savePdf
   * 
   * @param {Object} documentData - Document data to save
   * @returns {Promise<Object>} Created/updated document
   */
  saveDocument: async (documentData) => {
    const response = await apiClient.post('/documents', documentData);
    return response.data;
  },

  /**
   * Get user's documents
   * 
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Page size
   * @returns {Promise<Object>} Paginated documents
   */
  getUserDocuments: async (page = 0, size = 20) => {
    const response = await apiClient.get('/documents', {
      params: { page, size }
    });
    return response.data;
  }
};

export default documentService;

  /**
   * Generate completion certificate for a document
   * @param {string} docId - Document ID
   * @returns {Promise} Certificate details with CertificateUrl
   */
  generateCertificate: async (docId) => {
    const response = await apiClient.post('/documents/certificate', { docId });
    return response.data;
  }
