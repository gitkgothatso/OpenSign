// src/services/documentService.js
import apiClient from '../config/api';

export const documentService = {
  // Create document
  create: async (name, type, note) => {
    const response = await apiClient.post('/documents', {
      name,
      type,
      note
    });
    return response.data;
  },

  // Get all documents (paginated)
  getAll: async (page = 0, size = 20) => {
    const response = await apiClient.get('/documents', {
      params: { page, size }
    });
    return response.data;
  },

  // Get document by ID
  getById: async (id) => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  // Update document
  update: async (id, updates) => {
    const response = await apiClient.put(`/documents/${id}`, updates);
    return response.data;
  },

  // Delete document
  delete: async (id) => {
    await apiClient.delete(`/documents/${id}`);
  },

  // Share document with users
  share: async (documentId, userIds, permission = 'read') => {
    const response = await apiClient.post(`/documents/${documentId}/share`, {
      userIds,
      permission  // "read" or "write"
    });
    return response.data;
  },

  // Revoke document access
  revokeAccess: async (documentId, userId) => {
    await apiClient.delete(`/documents/${documentId}/share/${userId}`);
  },

  // Get shared documents
  getShared: async (page = 0, size = 20) => {
    const response = await apiClient.get('/documents/shared', {
      params: { page, size }
    });
    return response.data;
  }
};

export default documentService;
