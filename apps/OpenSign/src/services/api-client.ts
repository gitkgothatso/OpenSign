/**
 * OpenSign Server API Client
 * Auto-generated TypeScript client for OpenSign Server REST API
 * 
 * Base URL: http://localhost:8080
 * Version: 1.0.0
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AuthResponse {
  userId: string;
  username: string;
  email: string;
  jwtToken: string;
  parseSessionToken?: string;
}

export interface UserProfileResponse {
  userId: string;
  username: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  timezone?: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  role?: string;
  timezone?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  timezone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordConfirmRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface ApiError {
  code?: number;
  error: string;
  message?: string;
  status?: number;
  errors?: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// ============================================================================
// HTTP Client Configuration
// ============================================================================

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onResponse?: <T>(response: Response<T>) => Response<T> | Promise<Response<T>>;
  onError?: (error: ApiError) => void;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}

export interface Response<T> {
  data: T;
  status: number;
  headers: Headers;
}

// ============================================================================
// API Client Class
// ============================================================================

export class OpenSignApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || 'http://localhost:8080';
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.config = config;
  }

  /**
   * Set authorization token for all subsequent requests
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization token
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Generic HTTP request method
   */
  private async request<T>(requestConfig: RequestConfig): Promise<T> {
    const { method, url, headers = {}, body, signal } = requestConfig;

    // Apply request interceptor
    let config = requestConfig;
    if (this.config.onRequest) {
      config = await this.config.onRequest(config);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${config.url}`, {
        method: config.method,
        headers: {
          ...this.defaultHeaders,
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: response.statusText,
          code: response.status,
        }));

        if (this.config.onError) {
          this.config.onError(errorData);
        }

        throw errorData;
      }

      const data = await response.json();

      // Apply response interceptor
      let result: Response<T> = {
        data,
        status: response.status,
        headers: response.headers,
      };

      if (this.config.onResponse) {
        result = await this.config.onResponse(result);
      }

      return result.data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        const timeoutError: ApiError = {
          error: 'Request timeout',
          code: 408,
        };
        if (this.config.onError) {
          this.config.onError(timeoutError);
        }
        throw timeoutError;
      }

      throw error;
    }
  }

  // ==========================================================================
  // Authentication API
  // ==========================================================================

  /**
   * Sign up a new user
   * POST /api/v1/auth/signup
   */
  async signup(request: SignupRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>({
      method: 'POST',
      url: '/api/v1/auth/signup',
      body: request,
    });
  }

  /**
   * Login with username and password
   * POST /api/v1/auth/login
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>({
      method: 'POST',
      url: '/api/v1/auth/login',
      body: request,
    });
  }

  /**
   * Convert Parse session token to JWT
   * POST /api/v1/auth/convert-session
   */
  async convertSession(sessionToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>({
      method: 'POST',
      url: '/api/v1/auth/convert-session',
      body: { sessionToken },
    });
  }

  /**
   * Request password reset email
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(email: string): Promise<{ message: string; email: string }> {
    return this.request({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      body: { email },
    });
  }

  /**
   * Confirm password reset with token
   * POST /api/v1/auth/reset-password/confirm
   */
  async confirmPasswordReset(request: ResetPasswordConfirmRequest): Promise<{ success: boolean; message: string }> {
    return this.request({
      method: 'POST',
      url: '/api/v1/auth/reset-password/confirm',
      body: request,
    });
  }

  /**
   * Send OTP to email for 2FA
   * POST /api/v1/auth/send-otp
   */
  async sendOtp(email: string): Promise<{ success: boolean; message: string }> {
    return this.request({
      method: 'POST',
      url: '/api/v1/auth/send-otp',
      body: { email },
    });
  }

  /**
   * Verify OTP code
   * POST /api/v1/auth/verify-otp
   */
  async verifyOtp(request: VerifyOtpRequest): Promise<{ success: boolean; message: string }> {
    return this.request({
      method: 'POST',
      url: '/api/v1/auth/verify-otp',
      body: request,
    });
  }

  /**
   * Verify email address with token
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(email: string, token: string): Promise<{ success: boolean; message: string }> {
    return this.request({
      method: 'POST',
      url: '/api/v1/auth/verify-email',
      body: { email, token },
    });
  }

  // ==========================================================================
  // User Profile API
  // ==========================================================================

  /**
   * Get current user profile
   * GET /api/v1/users/profile/me
   * Requires: JWT authentication
   */
  async getCurrentUserProfile(): Promise<UserProfileResponse> {
    return this.request<UserProfileResponse>({
      method: 'GET',
      url: '/api/v1/users/profile/me',
    });
  }

  /**
   * Update current user profile
   * PUT /api/v1/users/profile/me
   * Requires: JWT authentication
   */
  async updateCurrentUserProfile(request: UpdateProfileRequest): Promise<UserProfileResponse> {
    return this.request<UserProfileResponse>({
      method: 'PUT',
      url: '/api/v1/users/profile/me',
      body: request,
    });
  }

  /**
   * Change password
   * POST /api/v1/users/profile/change-password
   * Requires: JWT authentication
   */
  async changePassword(request: ChangePasswordRequest): Promise<{ message: string }> {
    return this.request({
      method: 'POST',
      url: '/api/v1/users/profile/change-password',
      body: request,
    });
  }

  /**
   * Delete current user account
   * DELETE /api/v1/users/profile/me
   * Requires: JWT authentication
   */
  async deleteAccount(): Promise<{ message: string }> {
    return this.request({
      method: 'DELETE',
      url: '/api/v1/users/profile/me',
    });
  }

  // ==========================================================================
  // Health & Monitoring
  // ==========================================================================

  /**
   * Get application health status
   * GET /actuator/health
   */
  async getHealth(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/actuator/health',
    });
  }

  /**
   * Get application info
   * GET /actuator/info
   */
  async getInfo(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/actuator/info',
    });
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default OpenSignApiClient;
