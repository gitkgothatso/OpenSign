// src/services/documentService.js
import apiClient from '../config/api';

/**
 * Document service - handles document operations
 * Migrated from Parse SDK to REST API
 */
export const documentService = {
  /**
   * Get document by ID
   * Replaces: Parse Cloud function getDocument(docId, include)
   * Replaces: Parse.Query('contracts_Document').get(docId)
   * 
   * @param {string} docId - Document ID
   * @param {string} include - Optional comma-separated list of fields to include/populate
   * @returns {Promise<Object>} Document data
   */
  getDocument: async (docId, include) => {
    if (!docId || docId === 'undefined' || docId === 'null') {
      console.warn('getDocument called with invalid docId:', docId);
      return null;
    }
    const params = include ? { include } : {};
    const response = await apiClient.get(`/documents/${docId}`, { params });
    return response.data;
  },

  /**
   * Get user's documents with pagination
   * Replaces: new Parse.Query('contracts_Document').find()
   * 
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Page size
   * @param {Object} filters - Optional filters (folder, name search, etc.)
   * @returns {Promise<Object>} Paginated documents {content, totalElements, totalPages}
   */
  getUserDocuments: async (page = 0, size = 20, filters = {}) => {
    const params = { page, size, ...filters };
    const response = await apiClient.get('/documents', { params });
    return response.data;
  },

  /**
   * Search documents by name
   * Replaces: query.contains('Name', searchTerm)
   * 
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} List of matching documents
   */
  searchDocuments: async (searchTerm) => {
    const response = await apiClient.get('/documents/search', {
      params: { name: searchTerm }
    });
    return response.data;
  },

  /**
   * Get documents in a folder
   * Replaces: query.equalTo('Folder', folderId)
   * 
   * @param {string} folderId - Folder ID
   * @returns {Promise<Array>} Documents in folder
   */
  getDocumentsInFolder: async (folderId) => {
    const response = await apiClient.get(`/documents/folder/${folderId}`);
    return response.data;
  },

  /**
   * Save/create document
   * Replaces: new Parse.Object('contracts_Document').save()
   * Replaces: Parse Cloud function savePdf
   * 
   * @param {Object} documentData - Document data to save
   * @returns {Promise<Object>} Created document
   */
  saveDocument: async (documentData) => {
    const response = await apiClient.post('/documents', documentData);
    return response.data;
  },

  /**
   * Update existing document
   * Replaces: document.save() (update)
   * 
   * @param {string} docId - Document ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated document
   */
  updateDocument: async (docId, updates) => {
    const response = await apiClient.put(`/documents/${docId}`, updates);
    return response.data;
  },

  /**
   * Delete document
   * Replaces: document.destroy()
   * 
   * @param {string} docId - Document ID
   * @returns {Promise<void>}
   */
  deleteDocument: async (docId) => {
    await apiClient.delete(`/documents/${docId}`);
  },

  /**
   * Forward document via email
   * Replaces: Parse.Cloud.run('forwarddoc', params)
   * 
   * @param {string} docId - Document ID
   * @param {Object} emailData - Email recipients and message
   * @returns {Promise<Object>} Send result
   */
  forwardDocument: async (docId, emailData) => {
    const response = await apiClient.post(`/documents/${docId}/forward`, emailData);
    return response.data;
  },

  /**
   * Upload file for document
   * Replaces: new Parse.File(name, file).save()
   * 
   * @param {string} docId - Document ID
   * @param {File} file - File object
   * @returns {Promise<Object>} Upload result with file URL
   */
  uploadFile: async (docId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/documents/${docId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Generate completion certificate for a document
   * @param {string} docId - Document ID
   * @returns {Promise<Object>} Certificate details with CertificateUrl
   */
  generateCertificate: async (docId) => {
    try {
      const response = await apiClient.post('/documents/certificate', { docId });
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist (404) or method not allowed (405), return error
      if (error.response?.status === 404 || error.response?.status === 405) {
        throw new Error('Certificate generation endpoint is not available. Please contact support.');
      }
      throw error;
    }
  },

  /**
   * Get document count
   * Replaces: query.count()
   * 
   * @param {Object} filters - Optional filters
   * @returns {Promise<number>} Document count
   */
  getDocumentCount: async (filters = {}) => {
    const response = await apiClient.get('/documents/count', { params: filters });
    return response.data.count;
  },

  /**
   * Sign PDF document
   * Replaces: Parse.Cloud.run('signPdf', params)
   * @param {Object} params - Signing parameters {pdfFile, docId, userId, signature, isCustomCompletionMail}
   * @returns {Promise<Object>} Signed document result
   */
  signPdf: async (params) => {
    const response = await apiClient.post('/documents/sign', params);
    return response.data;
  },

  /**
   * Decline a document
   * POST /api/v1/documents/{id}/decline
   * Replaces: Parse.Cloud.run('declinedoc', params)
   * 
   * @param {string} documentId - Document ID
   * @param {string} reason - Decline reason (optional)
   * @returns {Promise<Object>} Updated document
   */
  declineDocument: async (documentId, reason = '') => {
    const response = await apiClient.post(`/documents/${documentId}/decline`, { reason });
    return response.data;
  },

  /**
   * Get signers for a document
   * The signers are included in the document response
   * Replaces: Parse.Cloud.run('getsigners', {documentId})
   * 
   * @param {string} documentId - Document ID
   * @returns {Promise<Array>} Array of signers
   */
  getSigners: async (documentId) => {
    const document = await documentService.getDocument(documentId);
    return document.signers || [];
  }
};

export default documentService;

/**
 * Search documents by name
 * Replaces: Parse.Cloud.run('filterdocs', {searchTerm})
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching documents
 */
export const searchDocuments = async (searchTerm) => {
  const response = await apiClient.get('/documents/search', {
    params: { q: searchTerm }
  });
  return response.data;
};

/**
 * Get document details
 * Replaces: Parse.Cloud.run('getDocument', {docId})
 * @param {string} docId - Document ID
 * @returns {Promise<Object>} Document details
 */
export const getDocumentDetails = async (docId) => {
  const response = await apiClient.get(`/documents/${docId}/details`);
  return response.data;
};

/**
 * Link contact to document
 * Replaces: Parse.Cloud.run('linkcontacttodoc', params)
 * @param {Object} params - Contact and document data
 * @returns {Promise<Object>} Link result with contactId
 */
export const linkContactToDocument = async (params) => {
  const response = await apiClient.post('/documents/link-contact', params);
  return response.data;
};

/**
 * Send OTP email for document access
 * Replaces: Parse.Cloud.run('SendOTPMailV1', params)
 * @param {Object} params - Email and document ID
 * @returns {Promise<Object>} OTP send result
 */
export const sendOTPEmail = async (params) => {
  const response = await apiClient.post('/auth/send-otp', params);
  return response.data;
};

/**
 * Sign PDF document
 * Replaces: Parse.Cloud.run('signPdf', params)
 * @param {Object} params - Signing parameters
 * @returns {Promise<Object>} Signed document result
 */
export const signPdf = async (params) => {
  const response = await apiClient.post('/documents/sign', params);
  return response.data;
};

/**
 * Save document as template
 * Replaces: Parse.Cloud.run('saveastemplate', params)
 * @param {Object} params - Template parameters
 * @returns {Promise<Object>} Created template
 */
export const saveAsTemplate = async (params) => {
  const response = await apiClient.post('/templates/from-document', params);
  return response.data;
};

/**
 * Recreate document
 * Replaces: Parse.Cloud.run('recreatedoc', params)
 * @param {Object} params - Document recreation parameters
 * @returns {Promise<Object>} Recreated document
 */
export const recreateDocument = async (params) => {
  const response = await apiClient.post('/documents/recreate', params);
  return response.data;
};

/**
 * Update document expiry date
 * @param {string} documentId - Document ID
 * @param {string} expiryDate - New expiry date (ISO string)
 * @returns {Promise<Object>} Updated document
 */
export const updateDocumentExpiry = async (documentId, expiryDate) => {
  const response = await apiClient.put(`/documents/${documentId}/expiry`, {
    expiryDate
  });
  return response.data;
};

/**
 * Soft delete document (mark as deleted)
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Updated document
 */
export const softDeleteDocument = async (documentId) => {
  const response = await apiClient.put(`/documents/${documentId}`, {
    isDeleted: true
  });
  return response.data;
};

/**
 * Archive document
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Updated document
 */
export const archiveDocument = async (documentId) => {
  const response = await apiClient.put(`/documents/${documentId}/archive`, {
    isArchive: true
  });
  return response.data;
};
