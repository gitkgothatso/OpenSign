import apiClient from '../config/api';

/**
 * Contact service for managing contacts and signers
 */
export const contactService = {
  /**
   * Search for contacts/signers
   * @param {string} query - Search query (name, email, etc.)
   * @param {string} searchBy - Optional: 'name', 'company', or default (email/name)
   * @param {number} page - Page number (default: 0)
   * @param {number} size - Page size (default: 20)
   * @returns {Promise} Contact search results
   */
  searchContacts: async (query, searchBy = null, page = 0, size = 20) => {
    const params = { query, page, size };
    if (searchBy) {
      params.searchBy = searchBy;
    }
    const response = await apiClient.get('/contacts/search', { params });
    return response.data;
  },

  /**
   * Get user's contacts
   * @param {number} page - Page number
   * @param {number} size - Page size
   * @returns {Promise} User's contacts
   */
  getUserContacts: async (page = 0, size = 20) => {
    const response = await apiClient.get('/contacts', {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Create a new contact
   * @param {Object} contactData - Contact data
   * @returns {Promise} Created contact
   */
  createContact: async (contactData) => {
    const response = await apiClient.post('/contacts', contactData);
    return response.data;
  },

  /**
   * Update a contact
   * @param {string} contactId - Contact ID
   * @param {Object} updates - Contact updates
   * @returns {Promise} Updated contact
   */
  updateContact: async (contactId, updates) => {
    const response = await apiClient.put(`/contacts/${contactId}`, updates);
    return response.data;
  },

  /**
   * Delete a contact
   * @param {string} contactId - Contact ID
   * @returns {Promise} Deletion result
   */
  deleteContact: async (contactId) => {
    const response = await apiClient.delete(`/contacts/${contactId}`);
    return response.data;
  }
};

export default contactService;
