import apiClient from './apiClient';

/**
 * Signature service - replaces Parse Cloud function: getdefaultsignature
 */
export const signatureService = {
  /**
   * Get user's default signature
   * Replaces Parse Cloud function: getdefaultsignature(userId)
   * 
   * @param {string} userId - User object ID
   * @returns {Promise<{id: string, ImageURL: string, Initials: string, Stamp: string}>} Default signature data
   */
  getDefaultSignature: async (userId) => {
    const response = await apiClient.get(`/signatures/users/${userId}/default`);
    return response.data;
  }
};

export default signatureService;
