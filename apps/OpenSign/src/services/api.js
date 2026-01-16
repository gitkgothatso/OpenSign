import axios from 'axios';

// Base URL configuration
const getBaseURL = () => {
  const baseUrl = localStorage.getItem('baseUrl');
  return baseUrl || 'http://localhost:8080';
};

// Create axios instance
const api = axios.create({
  baseURL: getBaseURL() + '/api/v1',
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
