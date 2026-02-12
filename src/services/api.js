import axios from 'axios';

// Base URL configuration - use VITE_API_URL environment variable
// Falls back to localStorage for legacy Parse compatibility, then to default
const getBaseURL = () => {
  // First try VITE_API_URL (preferred for new Spring Boot API)
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    // If VITE_API_URL already includes /api/v1, use as-is, otherwise append
    return viteApiUrl.endsWith('/api/v1') ? viteApiUrl : `${viteApiUrl}/api/v1`;
  }
  
  // Fallback to localStorage for legacy Parse compatibility
  const baseUrl = localStorage.getItem('baseUrl');
  if (baseUrl) {
    return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
  }
  
  // Default fallback
  return 'http://localhost:8080/api/v1';
};

// Create axios instance
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accesstoken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('accesstoken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
