import apiClient from './apiClient';

/**
 * PDF signing service - replaces Parse Cloud function: signPdf
 */
export const pdfService = {
  /**
   * Sign a PDF document with a signature
   * Replaces Parse Cloud function: signPdf(pdfFile, docId, userId, signature, isCustomCompletionMail)
   * 
   * @param {Object} params - Signing parameters
   * @param {string} params.pdfFile - Base64 encoded PDF content
   * @param {string} params.docId - Document ID
   * @param {string} params.userId - User ID (signer)
   * @param {string} params.signature - Base64 encoded signature image (without data:image prefix)
   * @param {boolean} params.isCustomCompletionMail - Whether to send custom completion email
   * @returns {Promise<Object>} Signed PDF response
   */
  signPdf: async (params) => {
    const response = await apiClient.post('/documents/sign', params);
    return response.data;
  }
};

export default pdfService;
