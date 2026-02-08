// src/config/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    // #region agent log
    if (config.url?.includes('/emails/send')) {
      console.log('[DEBUG] Request interceptor for /emails/send', {url:config.url,hasToken:!!token,tokenLength:token?.length,method:config.method,hasData:!!config.data,dataPreview:config.data ? JSON.stringify(config.data).substring(0,100) : null});
      fetch('http://127.0.0.1:7243/ingest/44a8b1ee-5909-4662-81c1-64197b8dcd0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:16',message:'Request interceptor for /emails/send',data:{url:config.url,hasToken:!!token,tokenLength:token?.length,method:config.method,hasData:!!config.data},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch((e)=>console.error('[DEBUG] Log fetch failed',e));
    }
    // #endregion
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    // #region agent log
    if (response.config?.url?.includes('/emails/send')) {
      console.log('[DEBUG] Response interceptor success for /emails/send', {status:response?.status,hasData:!!response?.data,responseData:response?.data});
      fetch('http://127.0.0.1:7243/ingest/44a8b1ee-5909-4662-81c1-64197b8dcd0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:29',message:'Response interceptor success for /emails/send',data:{status:response?.status,hasData:!!response?.data},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch((e)=>console.error('[DEBUG] Log fetch failed',e));
    }
    // #endregion
    return response;
  },
  (error) => {
    // #region agent log
    if (error.config?.url?.includes('/emails/send')) {
      console.error('[DEBUG] Response interceptor error for /emails/send', {status:error?.response?.status,statusText:error?.response?.statusText,errorData:error?.response?.data,errorMessage:error?.message,isNetworkError:!error?.response,code:error?.code,fullError:error});
      fetch('http://127.0.0.1:7243/ingest/44a8b1ee-5909-4662-81c1-64197b8dcd0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:32',message:'Response interceptor error for /emails/send',data:{status:error?.response?.status,statusText:error?.response?.statusText,errorData:error?.response?.data,errorMessage:error?.message,isNetworkError:!error?.response,code:error?.code},timestamp:Date.now(),runId:'run1',hypothesisId:'C,D,E'})}).catch((e)=>console.error('[DEBUG] Log fetch failed',e));
    }
    // #endregion
    // Handle 401 - Unauthorized (logout user)
    if (error.response?.status === 401) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      window.location.href = '/';
      return Promise.reject(error);
    }
    
    // Suppress console errors for expected 404s on lookup endpoints
    // These are normal when checking if a user/tenant/contact exists
    const url = error.config?.url || '';
    const isExpected404 = 
      url.includes('/users/by-email') || 
      url.includes('/users/by-username') ||
      url.includes('/tenants/domain/') ||
      url.includes('/contacts/email/');
    
    if (error.response?.status === 404 && isExpected404) {
      // For expected 404s, suppress the console error and create a silent error
      // The error is still rejected so callers can handle it gracefully
      // Note: Browser network tab will still show 404, but console.error won't be called
      const silentError = new Error(error.message);
      silentError.response = error.response;
      silentError.config = error.config;
      silentError.isAxiosError = true;
      silentError.suppressConsole = true; // Custom flag to suppress logging
      silentError.isExpected404 = true; // Flag to indicate this is an expected 404
      
      // Don't log to console for expected 404s
      // The browser's network tab will still show the request, but that's normal
      return Promise.reject(silentError);
    }
    
    // For non-expected errors, log to console only if not suppressed
    if (!error.suppressConsole && error.response?.status !== 404) {
      // Only log unexpected errors (not 404s which are handled above)
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message
      });
    }
    
    // Check if this is a network error or other non-401 error that might affect session
    // Only 401 should trigger logout, not 404 or other client errors
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      // Client errors (400-499) except 401 should not trigger logout
      // These are handled by the calling code
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
