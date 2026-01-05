import apiClient from '../config/api';

/**
 * Email service for sending notifications and emails
 */
export const emailService = {
  /**
   * Send a generic email
   * @param {Object} emailData - Email data
   * @param {string} emailData.recipient - Recipient email address
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.html - HTML email body
   * @param {string} emailData.from - Sender email (optional)
   * @param {string} emailData.replyto - Reply-to email (optional)
   * @param {string} emailData.extUserId - External user ID (optional)
   * @returns {Promise} Email send result
   */
  sendEmail: async (emailData) => {
    const response = await apiClient.post('/emails/send', emailData);
    return response.data;
  },

  /**
   * Send signature notification email
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.documentId - Document ID
   * @param {string} notificationData.recipientEmail - Recipient email
   * @param {string} notificationData.signingUrl - URL for signing
   * @param {string} notificationData.documentName - Document name
   * @param {string} notificationData.senderName - Sender name
   * @returns {Promise} Email send result
   */
  sendSignatureNotification: async (notificationData) => {
    const response = await apiClient.post('/emails/signature-notification', notificationData);
    return response.data;
  },

  /**
   * Send custom email with template variables (sendmailv3 replacement)
   * This method supports template variable replacement for custom emails
   * @param {Object} emailData - Email configuration
   * @param {string} emailData.recipient - Recipient email
   * @param {string} emailData.subject - Email subject (can include variables)
   * @param {string} emailData.html - HTML body (can include variables)
   * @param {string} emailData.from - Sender email
   * @param {string} emailData.replyto - Reply-to email
   * @param {string} emailData.extUserId - External user ID
   * @param {Object} emailData.variables - Template variables (optional)
   * @returns {Promise} Email send result
   */
  sendCustomEmail: async (emailData) => {
    // For now, use the same /emails/send endpoint
    // Backend should handle template variable replacement
    const response = await apiClient.post('/emails/send', emailData);
    return response.data;
  },

  /**
   * Send OTP email
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @returns {Promise} Email send result
   */
  sendOTP: async (email, otp) => {
    const response = await apiClient.post('/emails/otp', { email, otp });
    return response.data;
  }
};

export default emailService;
