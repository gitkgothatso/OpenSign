import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const storageService = {
  // Get tenant credits
  async getTenantCredits(tenantId) {
    const response = await axios.get(`${API_URL}/storage/credits/${tenantId}`);
    return response.data;
  },

  // Update tenant storage usage
  async updateTenantCredits(tenantId, usedStorage) {
    const response = await axios.put(`${API_URL}/storage/credits/${tenantId}`, {
      usedStorage
    });
    return response.data;
  },

  // Create tenant credits
  async createTenantCredits(tenantId, usedStorage) {
    const response = await axios.post(`${API_URL}/storage/credits`, {
      tenantId,
      usedStorage
    });
    return response.data;
  },

  // Save data file record
  async saveDataFile(fileUrl, fileSize, tenantId, userId) {
    const response = await axios.post(`${API_URL}/storage/files`, {
      fileUrl,
      fileSize,
      tenantId,
      userId
    });
    return response.data;
  }
};
