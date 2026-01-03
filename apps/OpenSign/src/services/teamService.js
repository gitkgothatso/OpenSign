// src/services/teamService.js
import apiClient from '../config/api';

export const teamService = {
  // Create team
  create: async (name, description) => {
    const response = await apiClient.post('/teams', {
      name,
      description
    });
    return response.data;
  },

  // Get team details
  getById: async (teamId) => {
    const response = await apiClient.get(`/teams/${teamId}`);
    return response.data;
  },

  // Get all active teams
  getAll: async () => {
    const response = await apiClient.get('/teams');
    return response.data;
  },

  // Add team member
  addMember: async (teamId, userId, role = 'member') => {
    const response = await apiClient.post(`/teams/${teamId}/members`, {
      userId,
      role
    });
    return response.data;
  },

  // Remove team member
  removeMember: async (teamId, userId) => {
    await apiClient.delete(`/teams/${teamId}/members/${userId}`);
  },

  // Update member role
  updateMemberRole: async (teamId, userId, role) => {
    const response = await apiClient.put(`/teams/${teamId}/members/${userId}/role`, {
      role
    });
    return response.data;
  }
};

export default teamService;
