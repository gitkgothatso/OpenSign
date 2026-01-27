// src/services/reportService.js
import apiClient from '../config/api';

export const reportService = {
  /**
   * Get documents for a specific dashboard report.
   * Replaced Parse.Cloud.run("getReport") with REST API
   * 
   * @param {string} reportId - Report identifier (e.g., '4Hhwbp482K' for "Need your sign")
   * @param {number} skip - Number of records to skip (pagination)
   * @param {number} limit - Maximum number of records to return
   * @param {string} searchTerm - Optional search term to filter documents by name
   * @returns {Promise<Array>} Array of document objects
   */
  getReport: async (reportId, skip = 0, limit = 200, searchTerm = '') => {
    const response = await apiClient.post('/reports', {
      reportId,
      skip,
      limit,
      searchTerm: searchTerm || undefined
    });
    
    return response.data;
  }
};
