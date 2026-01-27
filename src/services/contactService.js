// src/services/contactService.js
import apiClient from '../config/api';

/**
 * Contact service - handles contact operations
 * Migrated from Parse SDK to REST API
 */
export const contactService = {
  /**
   * Edit contact
   * Replaces: Parse.Cloud.run('editcontact', params)
   * @param {Object} contactData - Contact data to update
   * @returns {Promise<Object>} Updated contact
   */
  editContact: async (contactData) => {
    const response = await apiClient.put(`/contacts/${contactData.id}`, contactData);
    return response.data;
  },

  /**
   * Create batch contacts
   * Replaces: Parse.Cloud.run('createbatchcontact', {contacts})
   * @param {Array} contacts - Array of contacts to create
   * @returns {Promise<Object>} Batch creation result
   */
  createBatchContacts: async (contacts) => {
    const response = await apiClient.post('/contacts/batch', { contacts });
    return response.data;
  },

  /**
   * Soft delete contact (mark as deleted)
   * @param {string} contactId - Contact ID
   * @returns {Promise<Object>} Updated contact
   */
  deleteContact: async (contactId) => {
    const response = await apiClient.put(`/contacts/${contactId}`, {
      isDeleted: true
    });
    return response.data;
  }
};

export default contactService;
