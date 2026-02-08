// src/services/authService.js
import apiClient from '../config/api';

export const authService = {
  // Sign up new user with extended profile fields
  signup: async (username, email, password, name, phone, company, jobTitle, role, timezone) => {
    const response = await apiClient.post('/auth/signup', {
      username,
      email,
      password,
      name,
      phone: phone || '',
      company: company || '',
      jobTitle: jobTitle || '',
      role: role || 'contracts_User',
      timezone: timezone || ''
    });
    
    const { jwtToken, userId, username: user, email: userEmail } = response.data;
    
    // Store auth data
    localStorage.setItem('jwtToken', jwtToken);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', user);
    localStorage.setItem('userEmail', userEmail);
    
    return response.data;
  },

  // Login existing user
  // Accepts either username or email as first parameter
  login: async (usernameOrEmail, password) => {
    // Determine if input is email or username
    const isEmail = usernameOrEmail.includes('@');
    const response = await apiClient.post('/auth/login', {
      ...(isEmail ? { email: usernameOrEmail } : { username: usernameOrEmail }),
      password
    });
    
    const { jwtToken, userId, username: user, email } = response.data;
    
    // Store auth data
    localStorage.setItem('jwtToken', jwtToken);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', user);
    localStorage.setItem('userEmail', email);
    
    return response.data;
  },

  // Convert Parse session to JWT (migration helper)
  convertSession: async (sessionToken) => {
    try {
      const response = await apiClient.post('/auth/convert-session', {
        sessionToken
      });
      
      const { jwtToken, userId, username, email } = response.data;
      
      // Store new JWT
      localStorage.setItem('jwtToken', jwtToken);
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);
      localStorage.setItem('userEmail', email);
      
      // Remove old Parse session
      const parseKeys = Object.keys(localStorage).filter(key => key.startsWith('Parse/'));
      parseKeys.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem('sessionToken');
      
      return response.data;
    } catch (error) {
      console.error('Session conversion failed:', error);
      authService.logout();
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    window.location.href = '/';
  },

  // Get current user
  getCurrentUser: () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    
    return {
      id: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
      email: localStorage.getItem('userEmail')
    };
  },

  // Get user ID
  getUserId: () => {
    return localStorage.getItem('userId');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('jwtToken');
  },

  // Initialize auth (check for old session and convert)
  initializeAuth: async () => {
    const jwtToken = localStorage.getItem('jwtToken');
    const parseKeys = Object.keys(localStorage).filter(key => key.startsWith('Parse/') && key.includes('currentUser'));
    
    // If user has Parse session but no JWT, convert it
    if (parseKeys.length > 0 && !jwtToken) {
      try {
        const parseUserData = localStorage.getItem(parseKeys[0]);
        const userData = JSON.parse(parseUserData);
        if (userData.sessionToken) {
          console.log('Converting Parse session to JWT...');
          await authService.convertSession(userData.sessionToken);
        }
      } catch (error) {
        console.error('Auto-conversion failed:', error);
        // Don't force logout - just log the error
        console.warn('Please log in again to use the new backend');
      }
    }
  },

  // Request password reset email
  resetPassword: async (email) => {
    const response = await apiClient.post('/auth/reset-password', { email });
    return response.data;
  },

  // Change password for logged-in user
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};

export default authService;
