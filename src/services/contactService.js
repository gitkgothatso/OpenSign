// src/services/contactService.js
import apiClient from '../config/api';

/**
 * Contact service - handles contact operations
 * Migrated from Parse SDK to REST API
 */
export const contactService = {
  /**
   * Check if current user exists in their own contact book
   * Replaces: Parse.Cloud.run('isuserincontactbook')
   * @returns {Promise<Object|null>} Contact if exists, null otherwise
   */
  checkUserInContactBook: async () => {
    try {
      // Get current user's email
      const user = JSON.parse(localStorage.getItem('UserInformation') || '{}');
      const email = user?.email;
      
      if (!email) {
        return null;
      }
      
      // Check if contact exists with this email
      // 404 is expected if contact doesn't exist - this is normal behavior
      const response = await apiClient.get(`/contacts/email/${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      // 404 means contact doesn't exist, which is fine - return null silently
      // Don't throw error for 404s as this is expected behavior
      if (error?.response?.status === 404 || error?.isExpected404) {
        // Expected 404 - contact doesn't exist, which is normal
        return null;
      }
      // Only log unexpected errors (not 404s)
      // The interceptor should have marked expected 404s, but check anyway
      if (error?.response?.status !== 404 && !error?.isExpected404) {
        console.warn('Error checking user in contact book:', error?.response?.status, error?.message);
      }
      // For other errors, return null to prevent breaking the UI
      // The "add yourself" option will still be available
      return null;
    }
  },

  /**
   * Create a new contact
   * Replaces: Parse.Cloud.run('savecontact', params)
   * @param {Object} contactData - Contact data { name, email, phone, company, jobTitle, tenantId }
   * @returns {Promise<Object>} Created contact
   */
  createContact: async (contactData) => {
    // Build request body - only include fields that have values
    // Backend validates: name is required, email must be valid format if provided
    const requestBody = {
      name: contactData.name?.trim() || ''
    };
    
    // Only include email if it's provided and not empty (backend @Email validation requires valid format)
    if (contactData.email && contactData.email.trim() !== '') {
      requestBody.email = contactData.email.trim();
    }
    
    // Optional fields - only include if they have values
    if (contactData.phone && contactData.phone.trim() !== '') {
      requestBody.phone = contactData.phone.trim();
    }
    if (contactData.company && contactData.company.trim() !== '') {
      requestBody.company = contactData.company.trim();
    }
    if (contactData.jobTitle && contactData.jobTitle.trim() !== '') {
      requestBody.jobTitle = contactData.jobTitle.trim();
    }
    if (contactData.note && contactData.note.trim() !== '') {
      requestBody.note = contactData.note.trim();
    }
    if (contactData.tags && Array.isArray(contactData.tags) && contactData.tags.length > 0) {
      requestBody.tags = contactData.tags;
    }
    
    const response = await apiClient.post('/contacts', requestBody);
    return response.data;
  },

  /**
   * Edit contact
   * Replaces: Parse.Cloud.run('editcontact', params)
   * @param {Object} contactData - Contact data to update { id, name, email, phone, company, jobTitle, note, tags }
   * @returns {Promise<Object>} Updated contact
   */
  editContact: async (contactData) => {
    const { id, ...updateData } = contactData;
    // Backend expects camelCase fields
    const requestBody = {
      name: updateData.name || updateData.Name,
      email: updateData.email || updateData.Email,
      phone: updateData.phone || updateData.Phone || '',
      company: updateData.company || updateData.Company || '',
      jobTitle: updateData.jobTitle || updateData.JobTitle || '',
      note: updateData.note || updateData.Note || '',
      tags: updateData.tags || updateData.Tags || []
    };
    const response = await apiClient.put(`/contacts/${id}`, requestBody);
    return response.data;
  },

  /**
   * Create batch contacts
   * Replaces: Parse.Cloud.run('createbatchcontact', {contacts})
   * @param {Array} contacts - Array of contacts to create (should be array, not JSON string)
   * @returns {Promise<Array>} Array of created contacts
   */
  createBatchContacts: async (contacts) => {
    // Ensure contacts is an array (not a JSON string)
    const contactsArray = Array.isArray(contacts) ? contacts : JSON.parse(contacts);
    // Backend expects array of CreateContactRequest objects (camelCase)
    const requestBody = contactsArray.map(contact => ({
      name: contact.name || contact.Name || '',
      email: contact.email || contact.Email || '',
      phone: contact.phone || contact.Phone || '',
      company: contact.company || contact.Company || '',
      jobTitle: contact.jobTitle || contact.JobTitle || '',
      note: contact.note || contact.Note || '',
      tags: contact.tags || contact.Tags || []
    }));
    const response = await apiClient.post('/contacts/bulk', requestBody);
    return response.data;
  },

  /**
   * Get contact by email
   * @param {string} email - Contact email
   * @returns {Promise<Object|null>} Contact if exists, null otherwise
   */
  getContactByEmail: async (email) => {
    try {
      const response = await apiClient.get(`/contacts/email/${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      // 404 means contact doesn't exist, which is fine - return null
      if (error?.response?.status === 404) {
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  },

  /**
   * Delete contact (soft delete - marks as inactive)
   * @param {string} contactId - Contact ID
   * @returns {Promise<void>}
   */
  deleteContact: async (contactId) => {
    // Backend has both DELETE endpoint (hard delete) and PUT with isDeleted (soft delete)
    // Using PUT for soft delete to match existing behavior
    const response = await apiClient.put(`/contacts/${contactId}`, {
      isDeleted: true
    });
    return response.data;
  },

  /**
   * Get user's contacts with pagination
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Page size
   * @param {string} sortBy - Field to sort by (default: 'name')
   * @param {string} sortDir - Sort direction 'ASC' or 'DESC' (default: 'ASC')
   * @returns {Promise<Object>} Paginated contacts {content, totalElements, totalPages}
   */
  getUserContacts: async (page = 0, size = 20, sortBy = 'name', sortDir = 'ASC') => {
    const response = await apiClient.get('/contacts', {
      params: { page, size, sortBy, sortDir }
    });
    // Transform backend response to frontend format
    if (response.data && response.data.content) {
      return {
        ...response.data,
        content: response.data.content.map(contact => ({
          objectId: contact.objectId || contact.id,
          id: contact.objectId || contact.id,
          Name: contact.name,
          Email: contact.email,
          Phone: contact.phone || '',
          Company: contact.company || '',
          JobTitle: contact.jobTitle || '',
          Note: contact.note || '',
          Tags: contact.tags || [],
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt
        }))
      };
    }
    return response.data;
  },

  /**
   * Search contacts
   * @param {string} query - Search query
   * @param {string} searchBy - Optional: 'name', 'company', or default (email/name)
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Page size
   * @returns {Promise<Object>} Paginated search results
   */
  searchContacts: async (query, searchBy = null, page = 0, size = 20) => {
    const params = { query, page, size };
    if (searchBy) {
      params.searchBy = searchBy;
    }
    const response = await apiClient.get('/contacts/search', { params });
    // Transform backend response to frontend format
    if (response.data && response.data.content) {
      return {
        ...response.data,
        content: response.data.content.map(contact => ({
          objectId: contact.objectId || contact.id,
          id: contact.objectId || contact.id,
          Name: contact.name,
          Email: contact.email,
          Phone: contact.phone || '',
          Company: contact.company || '',
          JobTitle: contact.jobTitle || '',
          Note: contact.note || '',
          Tags: contact.tags || []
        }))
      };
    }
    return response.data;
  }
};

export default contactService;
