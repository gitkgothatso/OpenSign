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
    // #region agent log
    console.log('[DEBUG] sendCustomEmail called', {hasRecipient:!!emailData?.recipient,hasSubject:!!emailData?.subject,hasHtml:!!emailData?.html,recipient:emailData?.recipient?.substring(0,20),subject:emailData?.subject?.substring(0,30),htmlLength:emailData?.html?.length});
    fetch('http://127.0.0.1:7243/ingest/44a8b1ee-5909-4662-81c1-64197b8dcd0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:51',message:'sendCustomEmail called',data:{hasRecipient:!!emailData?.recipient,hasSubject:!!emailData?.subject,hasHtml:!!emailData?.html,recipient:emailData?.recipient?.substring(0,20),subject:emailData?.subject?.substring(0,30),htmlLength:emailData?.html?.length},timestamp:Date.now(),runId:'run1',hypothesisId:'A,B'})}).catch((e)=>console.error('[DEBUG] Log fetch failed',e));
    // #endregion
    // For now, use the same /emails/send endpoint
    // Backend should handle template variable replacement
    try {
      // #region agent log
      console.log('[DEBUG] About to call apiClient.post', {endpoint:'/emails/send',baseUrl:apiClient.defaults?.baseURL});
      fetch('http://127.0.0.1:7243/ingest/44a8b1ee-5909-4662-81c1-64197b8dcd0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:55',message:'About to call apiClient.post',data:{endpoint:'/emails/send',baseUrl:apiClient.defaults?.baseURL},timestamp:Date.now(),runId:'run1',hypothesisId:'A,D'})}).catch((e)=>console.error('[DEBUG] Log fetch failed',e));
      // #endregion
      const response = await apiClient.post('/emails/send', emailData);
      // #region agent log
      console.log('[DEBUG] apiClient.post success', {status:response?.status,hasData:!!response?.data,responseData:response?.data});
      fetch('http://127.0.0.1:7243/ingest/44a8b1ee-5909-4662-81c1-64197b8dcd0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:58',message:'apiClient.post success',data:{status:response?.status,hasData:!!response?.data},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch((e)=>console.error('[DEBUG] Log fetch failed',e));
      // #endregion
      return response.data;
    } catch (error) {
      // #region agent log
      console.error('[DEBUG] apiClient.post error', {errorMessage:error?.message,status:error?.response?.status,statusText:error?.response?.statusText,errorData:error?.response?.data,isNetworkError:!error?.response,fullError:error});
      fetch('http://127.0.0.1:7243/ingest/44a8b1ee-5909-4662-81c1-64197b8dcd0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:62',message:'apiClient.post error',data:{errorMessage:error?.message,status:error?.response?.status,statusText:error?.response?.statusText,errorData:error?.response?.data,isNetworkError:!error?.response},timestamp:Date.now(),runId:'run1',hypothesisId:'C,D,E'})}).catch((e)=>console.error('[DEBUG] Log fetch failed',e));
      // #endregion
      throw error;
    }
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
