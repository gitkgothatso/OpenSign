/**
 * Authentication Service
 * Manages JWT tokens, user authentication state, and automatic token refresh
 */

import OpenSignApiClient, {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  UserProfileResponse,
} from './api-client';

// ============================================================================
// Types
// ============================================================================

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfileResponse | null;
  token: string | null;
  expiresAt: number | null;
}

export interface AuthServiceConfig {
  apiClient: OpenSignApiClient;
  storageKey?: string;
  onAuthStateChange?: (state: AuthState) => void;
  onTokenExpired?: () => void;
}

// ============================================================================
// JWT Helper Functions
// ============================================================================

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = 60000; // 1 minute buffer
  
  return currentTime >= (expirationTime - bufferTime);
}

// ============================================================================
// AuthService Class
// ============================================================================

export class AuthService {
  private apiClient: OpenSignApiClient;
  private storageKey: string;
  private onAuthStateChange?: (state: AuthState) => void;
  private onTokenExpired?: () => void;
  private tokenCheckInterval?: number;

  constructor(config: AuthServiceConfig) {
    this.apiClient = config.apiClient;
    this.storageKey = config.storageKey || 'opensign_auth_state';
    this.onAuthStateChange = config.onAuthStateChange;
    this.onTokenExpired = config.onTokenExpired;

    // Restore auth state from storage
    this.restoreAuthState();

    // Start token expiration check
    this.startTokenExpirationCheck();
  }

  // ==========================================================================
  // Authentication Methods
  // ==========================================================================

  /**
   * Sign up a new user and authenticate
   */
  async signup(request: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.signup(request);
      await this.handleAuthResponse(response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login with username and password
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.login(request);
      await this.handleAuthResponse(response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // Clear API client token
    this.apiClient.clearAuthToken();

    // Clear storage
    this.clearAuthState();

    // Notify listeners
    this.notifyAuthStateChange({
      isAuthenticated: false,
      user: null,
      token: null,
      expiresAt: null,
    });
  }

  /**
   * Convert Parse session token to JWT
   */
  async convertSession(sessionToken: string): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.convertSession(sessionToken);
      await this.handleAuthResponse(response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh current user profile
   */
  async refreshUserProfile(): Promise<UserProfileResponse> {
    try {
      const user = await this.apiClient.getCurrentUserProfile();
      
      // Update stored auth state
      const currentState = this.getAuthState();
      if (currentState.isAuthenticated) {
        this.saveAuthState({
          ...currentState,
          user,
        });
        this.notifyAuthStateChange({ ...currentState, user });
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  // ==========================================================================
  // Password Management
  // ==========================================================================

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<{ message: string; email: string }> {
    return this.apiClient.resetPassword(email);
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(
    email: string,
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    return this.apiClient.confirmPasswordReset({ email, token, newPassword });
  }

  /**
   * Change password (requires authentication)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.apiClient.changePassword({ currentPassword, newPassword });
  }

  // ==========================================================================
  // Two-Factor Authentication
  // ==========================================================================

  /**
   * Send OTP to email
   */
  async sendOtp(email: string): Promise<{ success: boolean; message: string }> {
    return this.apiClient.sendOtp(email);
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    return this.apiClient.verifyOtp({ email, otp });
  }

  // ==========================================================================
  // Email Verification
  // ==========================================================================

  /**
   * Verify email address with token
   */
  async verifyEmail(email: string, token: string): Promise<{ success: boolean; message: string }> {
    return this.apiClient.verifyEmail(email, token);
  }

  // ==========================================================================
  // Auth State Management
  // ==========================================================================

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        expiresAt: null,
      };
    }

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse auth state:', error);
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        expiresAt: null,
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const state = this.getAuthState();
    if (!state.isAuthenticated || !state.token) {
      return false;
    }

    // Check if token is expired
    if (isTokenExpired(state.token)) {
      this.handleTokenExpired();
      return false;
    }

    return true;
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserProfileResponse | null {
    return this.getAuthState().user;
  }

  /**
   * Get current JWT token
   */
  getToken(): string | null {
    const state = this.getAuthState();
    if (!state.token || isTokenExpired(state.token)) {
      return null;
    }
    return state.token;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private async handleAuthResponse(response: AuthResponse): Promise<void> {
    // Set token in API client
    this.apiClient.setAuthToken(response.jwtToken);

    // Fetch user profile
    const user = await this.apiClient.getCurrentUserProfile();

    // Parse token expiration
    const payload = parseJwt(response.jwtToken);
    const expiresAt = payload?.exp ? payload.exp * 1000 : null;

    // Save auth state
    const authState: AuthState = {
      isAuthenticated: true,
      user,
      token: response.jwtToken,
      expiresAt,
    };

    this.saveAuthState(authState);
    this.notifyAuthStateChange(authState);
  }

  private saveAuthState(state: AuthState): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  }

  private clearAuthState(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear auth state:', error);
    }
  }

  private restoreAuthState(): void {
    const state = this.getAuthState();
    
    if (state.isAuthenticated && state.token) {
      // Check if token is still valid
      if (!isTokenExpired(state.token)) {
        // Restore token in API client
        this.apiClient.setAuthToken(state.token);
        this.notifyAuthStateChange(state);
      } else {
        // Token expired, clear state
        this.handleTokenExpired();
      }
    }
  }

  private notifyAuthStateChange(state: AuthState): void {
    if (this.onAuthStateChange) {
      this.onAuthStateChange(state);
    }
  }

  private handleTokenExpired(): void {
    this.logout();
    if (this.onTokenExpired) {
      this.onTokenExpired();
    }
  }

  private startTokenExpirationCheck(): void {
    // Check every minute
    this.tokenCheckInterval = window.setInterval(() => {
      const state = this.getAuthState();
      if (state.isAuthenticated && state.token && isTokenExpired(state.token)) {
        this.handleTokenExpired();
      }
    }, 60000);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default AuthService;
