// src/services/userService.js
import apiClient from '../config/api';

const userService = {
  // Get current authenticated user
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  // Get user by email
  getUserByEmail: async (email) => {
    const response = await apiClient.get('/users/by-email', {
      params: { email }
    });
    return response.data;
  },

  // Get user by username
  getUserByUsername: async (username) => {
    const response = await apiClient.get('/users/by-username', {
      params: { username }
    });
    return response.data;
  }
};

export default userService;
