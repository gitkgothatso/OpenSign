import apiClient from '../config/api';

/**
 * User service for managing user profiles and authentication
 */
export const userService = {
  /**
   * Get current user details (replaces getUserDetails Parse function)
   * @returns {Promise} Current user's profile
   */
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise} User profile
   */
  getUserById: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise} User profile
   */
  getUserByEmail: async (email) => {
    const response = await apiClient.get('/users/by-email', {
      params: { email }
    });
    return response.data;
  },

  /**
   * Get user by username
   * @param {string} username - Username
   * @returns {Promise} User profile
   */
  getUserByUsername: async (username) => {
    const response = await apiClient.get('/users/by-username', {
      params: { username }
    });
    return response.data;
  },

  /**
   * Update current user profile
   * @param {Object} updates - User profile updates
   * @returns {Promise} Updated user profile
   */
  updateProfile: async (updates) => {
    const response = await apiClient.put('/users/me', updates);
    return response.data;
  }
};

export default userService;
