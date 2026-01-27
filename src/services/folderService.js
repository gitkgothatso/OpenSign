// src/services/folderService.js
import apiClient from '../config/api';

/**
 * Folder service - handles folder operations
 * Migrated from Parse SDK to REST API
 */
export const folderService = {
  /**
   * Get user's folders
   * Replaces: new Parse.Query(folderCls).find()
   * 
   * @returns {Promise<Array>} List of user's folders
   */
  getUserFolders: async () => {
    const response = await apiClient.get('/folders');
    return response.data;
  },

  /**
   * Get folder by ID
   * Replaces: new Parse.Query(folderCls).get(folderId)
   * 
   * @param {string} folderId - Folder ID
   * @returns {Promise<Object>} Folder data
   */
  getFolder: async (folderId) => {
    const response = await apiClient.get(`/folders/${folderId}`);
    return response.data;
  },

  /**
   * Check if folder name exists
   * Replaces: query.equalTo('Name', name).find()
   * 
   * @param {string} name - Folder name to check
   * @returns {Promise<boolean>} True if folder exists
   */
  folderExists: async (name) => {
    try {
      const response = await apiClient.get('/folders/exists', {
        params: { name }
      });
      return response.data.exists;
    } catch (error) {
      return false;
    }
  },

  /**
   * Create new folder
   * Replaces: new Parse.Object(folderCls).save()
   * 
   * @param {Object} folderData - Folder data {name, description, etc.}
   * @returns {Promise<Object>} Created folder
   */
  createFolder: async (folderData) => {
    const response = await apiClient.post('/folders', folderData);
    return response.data;
  },

  /**
   * Update folder
   * Replaces: folder.save() (update)
   * 
   * @param {string} folderId - Folder ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated folder
   */
  updateFolder: async (folderId, updates) => {
    const response = await apiClient.put(`/folders/${folderId}`, updates);
    return response.data;
  },

  /**
   * Delete folder
   * Replaces: folder.destroy()
   * 
   * @param {string} folderId - Folder ID
   * @returns {Promise<void>}
   */
  deleteFolder: async (folderId) => {
    await apiClient.delete(`/folders/${folderId}`);
  }
};

export default folderService;
