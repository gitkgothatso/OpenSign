/**
 * Example: Login Component with Backend Integration
 * 
 * This component demonstrates how to use the auth service
 * in a real React component with proper error handling.
 * 
 * Copy this to: src/components/Login.tsx
 */

import React, { useState } from 'react';
import { authService } from '../services';

interface LoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call the backend authentication service
      const response = await authService.login(
        formData.username,
        formData.password
      );

      console.log('Login successful:', response);
      setSuccess(true);

      // Redirect to dashboard or home page
      // window.location.href = '/dashboard';
      // Or use React Router:
      // navigate('/dashboard');
    } catch (err: any) {
      console.error('Login failed:', err);
      
      // Handle different error types
      if (err.message === 'Network Error') {
        setError('Unable to connect to server. Please try again later.');
      } else if (err.response?.status === 401) {
        setError('Invalid username or password.');
      } else if (err.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Login to OpenSign</h2>
      
      {error && (
        <div style={{ backgroundColor: '#fee', color: '#c00', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ backgroundColor: '#efe', color: '#0a0', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
          Login successful! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <a href="/forgot-password" style={{ color: '#007bff', textDecoration: 'none' }}>
          Forgot Password?
        </a>
        <span style={{ margin: '0 10px' }}>•</span>
        <a href="/signup" style={{ color: '#007bff', textDecoration: 'none' }}>
          Create Account
        </a>
      </div>
    </div>
  );
};

export default Login;
