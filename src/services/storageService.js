import apiClient from '../config/api';

export const storageService = {
  // Get tenant credits
  async getTenantCredits(tenantId) {
    const response = await apiClient.get(`/storage/credits/${tenantId}`);
    return response.data;
  },

  // Update tenant storage usage
  async updateTenantCredits(tenantId, usedStorage) {
    const response = await apiClient.put(`/storage/credits/${tenantId}`, {
      usedStorage
    });
    return response.data;
  },

  // Create tenant credits
  async createTenantCredits(tenantId, usedStorage) {
    const response = await apiClient.post(`/storage/credits`, {
      tenantId,
      usedStorage
    });
    return response.data;
  },

  // Save data file record
  async saveDataFile(fileUrl, fileSize, tenantId, userId) {
    const response = await apiClient.post(`/storage/files`, {
      fileUrl,
      fileSize,
      tenantId,
      userId
    });
    return response.data;
  }
};
