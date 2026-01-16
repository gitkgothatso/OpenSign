// src/services/templateService.js
import apiClient from '../config/api';

/**
 * Template service - handles template operations
 * Migrated from Parse SDK to REST API
 */
export const templateService = {
  /**
   * Get user's templates
   * @returns {Promise<Array>} List of templates
   */
  getUserTemplates: async () => {
    const response = await apiClient.get('/templates');
    return response.data;
  },

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template data
   */
  getTemplate: async (templateId) => {
    const response = await apiClient.get(`/templates/${templateId}`);
    return response.data;
  },

  /**
   * Create new template
   * Replaces: new Parse.Object('contracts_Template').save()
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  createTemplate: async (templateData) => {
    const response = await apiClient.post('/templates', templateData);
    return response.data;
  },

  /**
   * Update template
   * Replaces: template.save() (update)
   * @param {string} templateId - Template ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated template
   */
  updateTemplate: async (templateId, updates) => {
    const response = await apiClient.put(`/templates/${templateId}`, updates);
    return response.data;
  },

  /**
   * Delete template
   * @param {string} templateId - Template ID
   * @returns {Promise<void>}
   */
  deleteTemplate: async (templateId) => {
    await apiClient.delete(`/templates/${templateId}`);
  }
};

export default templateService;

/**
 * Get teams
 * Replaces: Parse.Cloud.run('getteams', {active})
 * @param {boolean} active - Filter for active teams
 * @returns {Promise<Array>} List of teams
 */
export const getTeams = async (active = true) => {
  const response = await apiClient.get('/teams', { params: { active } });
  return response.data;
};

/**
 * Create duplicate template
 * Replaces: Parse.Cloud.run('createduplicate', params)
 * @param {Object} params - Template duplication parameters
 * @returns {Promise<Object>} Duplicated template
 */
export const createDuplicate = async (params) => {
  const response = await apiClient.post('/templates/duplicate', params);
  return response.data;
};

// Soft delete template (mark as deleted)
export const deleteTemplate = async (templateId) => {
  const response = await apiClient.put(`/templates/${templateId}`, {
    isDeleted: true
  });
  return response.data;
};


// Archive template
export const archiveTemplate = async (templateId) => {
  const response = await apiClient.put(`/templates/${templateId}/archive`, {
    isArchive: true
  });
  return response.data;
  };
