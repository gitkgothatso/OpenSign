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
    const response = await apiClient.get('/users/profile/me');
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
  },

  /**
   * Update user preferences
   * Replaces: Parse.Cloud.run('updatepreferences', params)
   * @param {Object} preferences - User preferences
   * @returns {Promise} Updated preferences
   */
  updatePreferences: async (preferences) => {
    const response = await apiClient.put('/users/me/preferences', preferences);
    return response.data;
  },

  /**
   * Check if admin exists in system
   * Replaces: Parse.Cloud.run('checkadminexist')
   * @returns {Promise<boolean>} True if admin exists
   */
  checkAdminExists: async () => {
    const response = await apiClient.get('/users/admin/exists');
    return response.data;
  },

  /**
   * Update user as admin
   * Replaces: Parse.Cloud.run('updateExistAdmin', params)
   * @param {Object} adminData - Admin user data
   * @returns {Promise} Updated admin user
   */
  updateUserAsAdmin: async (adminData) => {
    const response = await apiClient.post('/users/admin/update', adminData);
    return response.data;
  },

  /**
   * Update user tour status
   * @param {string} userId - User ID
   * @param {Object} tourStatus - Tour status object
   * @returns {Promise} Updated user
   */
  updateTourStatus: async (userId, tourStatus) => {
    const response = await apiClient.put(`/users/profile/${userId}/tour-status`, {
    });
    return response.data;
  }
};

export default userService;

// Additional user management methods

/**
 * Get list of users in organization
 * Replaces: Parse.Cloud.run('getuserlistbyorg', params)
 * @param {string} orgId - Organization ID
 * @returns {Promise<Array>} List of users in organization
 */
export const getUserListByOrg = async (orgId) => {
  const response = await apiClient.get(`/tenants/${orgId}/users`);
  return response.data;
};

/**
 * Reset user password
 * Replaces: Parse.Cloud.run('resetpassword', params)
 * @param {Object} params - Password reset parameters
 * @returns {Promise} Reset confirmation
 */
export const resetUserPassword = async (params) => {
  const response = await apiClient.post('/users/reset-password', params);
  return response.data;
};

/**
 * Send newsletter
 * Replaces: Parse.Cloud.run('newsletter', params)
 * @param {Object} params - Newsletter parameters
 * @returns {Promise} Send confirmation
 */
export const sendNewsletter = async (params) => {
  const response = await apiClient.post('/email/newsletter', params);
  return response.data;
};

/**
 * Verify user email
 * Replaces: Parse.Cloud.run('verifyemail', params)
 * @param {Object} params - Verification parameters
 * @returns {Promise<Object>} Verification result
 */
export const verifyEmail = async (params) => {
  const response = await apiClient.post('/auth/verify-email', params);
  return response.data;
};

/**
 * Send account deletion request
 * Replaces: Parse.Cloud.run('senddeleterequest', params)
 * @param {Object} params - Delete request parameters
 * @returns {Promise<Object>} Request confirmation
 */
export const sendDeleteRequest = async (params) => {
  const response = await apiClient.post('/users/delete-request', params);
  return response.data;
};

/**
 * Update tenant settings
 * Replaces: Parse.Cloud.run(cloudfunction, params)
 * @param {Object} params - Tenant update parameters
 * @returns {Promise<Object>} Update result
 */
export const updateTenantSettings = async (params) => {
  const response = await apiClient.put('/tenants/settings', params);
  return response.data;
};
