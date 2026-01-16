/**
 * User Profile Service
 * Manages user profile operations and state
 */

import OpenSignApiClient, {
  UserProfileResponse,
  UpdateProfileRequest,
} from './api-client';

// ============================================================================
// Types
// ============================================================================

export interface UserProfileServiceConfig {
  apiClient: OpenSignApiClient;
  onProfileUpdate?: (profile: UserProfileResponse) => void;
  onProfileDelete?: () => void;
}

// ============================================================================
// UserProfileService Class
// ============================================================================

export class UserProfileService {
  private apiClient: OpenSignApiClient;
  private onProfileUpdate?: (profile: UserProfileResponse) => void;
  private onProfileDelete?: () => void;
  private cachedProfile: UserProfileResponse | null = null;

  constructor(config: UserProfileServiceConfig) {
    this.apiClient = config.apiClient;
    this.onProfileUpdate = config.onProfileUpdate;
    this.onProfileDelete = config.onProfileDelete;
  }

  // ==========================================================================
  // Profile Operations
  // ==========================================================================

  /**
   * Get current user profile
   * @param forceRefresh - Force fetch from server instead of using cache
   */
  async getProfile(forceRefresh = false): Promise<UserProfileResponse> {
    if (!forceRefresh && this.cachedProfile) {
      return this.cachedProfile;
    }

    try {
      const profile = await this.apiClient.getCurrentUserProfile();
      this.cachedProfile = profile;
      return profile;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   * @param updates - Partial profile updates
   */
  async updateProfile(updates: UpdateProfileRequest): Promise<UserProfileResponse> {
    try {
      const updatedProfile = await this.apiClient.updateCurrentUserProfile(updates);
      this.cachedProfile = updatedProfile;

      if (this.onProfileUpdate) {
        this.onProfileUpdate(updatedProfile);
      }

      return updatedProfile;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update profile name
   */
  async updateName(name: string): Promise<UserProfileResponse> {
    return this.updateProfile({ name });
  }

  /**
   * Update profile phone
   */
  async updatePhone(phone: string): Promise<UserProfileResponse> {
    return this.updateProfile({ phone });
  }

  /**
   * Update company info
   */
  async updateCompanyInfo(company: string, jobTitle?: string): Promise<UserProfileResponse> {
    return this.updateProfile({ company, jobTitle });
  }

  /**
   * Update timezone
   */
  async updateTimezone(timezone: string): Promise<UserProfileResponse> {
    return this.updateProfile({ timezone });
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      return await this.apiClient.changePassword({ currentPassword, newPassword });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<{ message: string }> {
    try {
      const result = await this.apiClient.deleteAccount();
      this.cachedProfile = null;

      if (this.onProfileDelete) {
        this.onProfileDelete();
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh profile from server
   */
  async refreshProfile(): Promise<UserProfileResponse> {
    return this.getProfile(true);
  }

  /**
   * Clear cached profile
   */
  clearCache(): void {
    this.cachedProfile = null;
  }

  /**
   * Get cached profile without fetching
   */
  getCachedProfile(): UserProfileResponse | null {
    return this.cachedProfile;
  }

  // ==========================================================================
  // Validation Helpers
  // ==========================================================================

  /**
   * Validate phone number format
   * Expected format: +[country code][number] (e.g., +27123456789)
   */
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate timezone format
   * Expected format: Region/City (e.g., America/New_York)
   */
  static validateTimezone(timezone: string): boolean {
    const timezoneRegex = /^[A-Za-z]+\/[A-Za-z_]+$/;
    return timezoneRegex.test(timezone);
  }

  /**
   * Validate password strength
   * Minimum 6 characters required
   */
  static validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return {
        valid: false,
        message: 'Password must be at least 6 characters long',
      };
    }

    // Optional: Add more strength requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

    if (strength < 2) {
      return {
        valid: true, // Still valid but weak
        message: 'Consider using uppercase, lowercase, numbers, and special characters for a stronger password',
      };
    }

    return { valid: true };
  }

  /**
   * Get list of common timezones
   */
  static getCommonTimezones(): string[] {
    return [
      'Africa/Johannesburg',
      'America/New_York',
      'America/Los_Angeles',
      'America/Chicago',
      'America/Denver',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Australia/Sydney',
      'Pacific/Auckland',
    ];
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default UserProfileService;
