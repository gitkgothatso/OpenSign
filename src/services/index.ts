/**
 * OpenSign Backend Services
 * Centralized export for all backend integration services
 */

import OpenSignApiClient from './api-client';
import AuthService from './auth-service';
import UserProfileService from './user-profile-service';

// Vite uses import.meta.env, not process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

console.log('🔗 API Base URL:', API_BASE_URL);

// Create API client instance
export const apiClient = new OpenSignApiClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
  onError: (error) => {
    console.error('API Error:', error);
  },
});

// Create auth service instance
export const authService = new AuthService({
  apiClient,
  onAuthStateChange: (state) => {
    console.log('Auth state changed:', state.isAuthenticated);
  },
  onTokenExpired: () => {
    alert('Your session has expired. Please log in again.');
    window.location.href = '/login';
  },
});

// Create user profile service instance
export const userProfileService = new UserProfileService({
  apiClient,
  onProfileUpdate: (profile) => {
    console.log('Profile updated:', profile.username);
  },
});

// Export all
export { OpenSignApiClient, AuthService, UserProfileService };
export * from './api-client';
export * from './auth-service';
export * from './user-profile-service';
