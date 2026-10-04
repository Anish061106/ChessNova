import { apiRequest } from './api';
import {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  ChangePasswordCredentials,
} from '../types/auth';

export const authService = {
  /**
   * Register a new user account
   */
  async register(credentials: RegisterCredentials): Promise<{ success: boolean; user: AuthUser }> {
    return apiRequest<{ success: boolean; user: AuthUser }>('/auth/register', {
      method: 'POST',
      data: credentials,
    });
  },

  /**
   * Log in with username or email + password
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user: AuthUser }> {
    return apiRequest<{ success: boolean; user: AuthUser }>('/auth/login', {
      method: 'POST',
      data: credentials,
    });
  },

  /**
   * Log out and clear session cookie
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Fetch currently authenticated user session
   */
  async getMe(): Promise<{ success: boolean; user: AuthUser }> {
    return apiRequest<{ success: boolean; user: AuthUser }>('/auth/me', {
      method: 'GET',
    });
  },

  /**
   * Change authenticated user password
   */
  async changePassword(
    credentials: ChangePasswordCredentials
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      data: credentials,
    });
  },
};
