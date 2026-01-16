// src/context/UserContext.jsx
// Context provider for current user and permissions

// parseAuthSync removed - using JWT authentication
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../config/api';
import { usePermissions } from '../hooks/usePermissions';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      if (!jwtToken) {
        setLoading(false);
        return;
      }

      const response = await apiClient.get('/users/profile/me');
      setUser(response.data);
      
      // Sync Parse SDK authentication for backward compatibility
      // This ensures Parse queries work during migration
      await // JWT auth sync handled by apiClient interceptor
      setError(null);
    } catch (err) {
      console.warn('UserContext: Could not fetch user details:', err.message);
      setError(err);
      // Don't block UI if user fetch fails - set user to null
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = () => {
    setLoading(true);
    fetchUser();
  };

  // Get permissions, with fallback for when user is not loaded
  const permissions = usePermissions(user?.UserRole);

  const value = {
    user,
    loading,
    error,
    refreshUser,
    permissions: permissions || {} // Ensure permissions is always an object
  };

  // Always render children, even if user fetch fails
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
