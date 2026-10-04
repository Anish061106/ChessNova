import { apiRequest } from './api';
import { AuthUser, UpdateProfilePayload, UserSettings, UpdateSettingsPayload } from '../types/auth';

export const userService = {
  /**
   * Get current authenticated user profile
   */
  async getProfile(): Promise<{ success: boolean; user: AuthUser }> {
    return apiRequest<{ success: boolean; user: AuthUser }>('/users/me', {
      method: 'GET',
    });
  },

  /**
   * Update profile fields (displayName, avatarUrl, country, bio)
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<{ success: boolean; user: AuthUser }> {
    return apiRequest<{ success: boolean; user: AuthUser }>('/users/me', {
      method: 'PATCH',
      data: payload,
    });
  },

  /**
   * Get user settings from database
   */
  async getSettings(): Promise<{ success: boolean; settings: UserSettings }> {
    return apiRequest<{ success: boolean; settings: UserSettings }>('/users/me/settings', {
      method: 'GET',
    });
  },

  /**
   * Update user settings in database
   */
  async updateSettings(payload: UpdateSettingsPayload): Promise<{ success: boolean; settings: UserSettings }> {
    return apiRequest<{ success: boolean; settings: UserSettings }>('/users/me/settings', {
      method: 'PATCH',
      data: payload,
    });
  },
};
