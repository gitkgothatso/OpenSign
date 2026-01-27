/**
 * React Hook: useAuth
 * Custom hook for authentication management in React applications
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import OpenSignApiClient from './api-client';
import AuthService, { AuthState } from './auth-service';
import type { LoginRequest, SignupRequest, AuthResponse, UserProfileResponse } from './api-client';

// ============================================================================
// Context Setup
// ============================================================================

interface AuthContextValue {
  authState: AuthState;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  signup: (data: SignupRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  convertSession: (sessionToken: string) => Promise<AuthResponse>;
  refreshProfile: () => Promise<UserProfileResponse>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Auth Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
  apiBaseURL?: string;
}

export function AuthProvider({ children, apiBaseURL = 'http://localhost:8080' }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    expiresAt: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authService] = useState(() => {
    const apiClient = new OpenSignApiClient({
      baseURL: apiBaseURL,
      onError: (err) => {
        console.error('API Error:', err);
      },
    });

    return new AuthService({
      apiClient,
      onAuthStateChange: (state) => {
        setAuthState(state);
      },
      onTokenExpired: () => {
        setError('Session expired. Please log in again.');
      },
    });
  });

  useEffect(() => {
    // Initialize auth state
    setAuthState(authService.getAuthState());

    return () => {
      authService.destroy();
    };
  }, [authService]);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<AuthResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.login(credentials);
        return response;
      } catch (err: any) {
        const errorMessage = err.error || 'Login failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService]
  );

  const signup = useCallback(
    async (data: SignupRequest): Promise<AuthResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.signup(data);
        return response;
      } catch (err: any) {
        const errorMessage = err.error || 'Signup failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService]
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.logout();
    } catch (err: any) {
      const errorMessage = err.error || 'Logout failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  const convertSession = useCallback(
    async (sessionToken: string): Promise<AuthResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.convertSession(sessionToken);
        return response;
      } catch (err: any) {
        const errorMessage = err.error || 'Session conversion failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService]
  );

  const refreshProfile = useCallback(async (): Promise<UserProfileResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await authService.refreshUserProfile();
      return profile;
    } catch (err: any) {
      const errorMessage = err.error || 'Failed to refresh profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextValue = {
    authState,
    isLoading,
    error,
    login,
    signup,
    logout,
    convertSession,
    refreshProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// useAuth Hook
// ============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// Example Components
// ============================================================================

/**
 * Login Form Component Example
 */
export function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login({ username, password });
      // Redirect on success
      window.location.href = '/dashboard';
    } catch (err) {
      // Error is already set in context
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

/**
 * Signup Form Component Example
 */
export function SignupForm() {
  const { signup, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    company: '',
    timezone: 'America/New_York',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await signup(formData);
      // Redirect on success
      window.location.href = '/verify-email';
    } catch (err) {
      // Error is already set in context
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium">
          Username *
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password * (min 6 characters)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Phone (format: +27123456789)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          pattern="^\+\d{10,15}$"
          placeholder="+27123456789"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium">
          Company
        </label>
        <input
          id="company"
          name="company"
          type="text"
          value={formData.company}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}

/**
 * User Profile Display Component Example
 */
export function UserProfile() {
  const { authState, refreshProfile, logout, isLoading } = useAuth();
  const { user } = authState;

  const handleRefresh = async () => {
    try {
      await refreshProfile();
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!user) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold">Profile</h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <span className="font-medium">Username:</span> {user.username}
        </div>
        <div>
          <span className="font-medium">Email:</span> {user.email}
          {user.emailVerified && <span className="ml-2 text-green-600">✓ Verified</span>}
        </div>
        {user.name && (
          <div>
            <span className="font-medium">Name:</span> {user.name}
          </div>
        )}
        {user.phone && (
          <div>
            <span className="font-medium">Phone:</span> {user.phone}
          </div>
        )}
        {user.company && (
          <div>
            <span className="font-medium">Company:</span> {user.company}
          </div>
        )}
        {user.jobTitle && (
          <div>
            <span className="font-medium">Job Title:</span> {user.jobTitle}
          </div>
        )}
        <div>
          <span className="font-medium">Role:</span> {user.role}
        </div>
        <div>
          <span className="font-medium">2FA:</span> {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
        </div>
        <div>
          <span className="font-medium">Timezone:</span> {user.timezone || 'Not set'}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}

/**
 * Protected Route Component Example
 */
interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { authState } = useAuth();

  useEffect(() => {
    if (!authState.isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [authState.isAuthenticated, redirectTo]);

  if (!authState.isAuthenticated) {
    return <div>Redirecting...</div>;
  }

  return <>{children}</>;
}
