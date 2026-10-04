import { create } from 'zustand';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useSettingsStore } from './settingsStore';
import {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  ChangePasswordCredentials,
  UpdateProfilePayload,
  UpdateSettingsPayload,
} from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initAuth: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  updateSettings: (payload: UpdateSettingsPayload) => Promise<void>;
  changePassword: (credentials: ChangePasswordCredentials) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  /**
   * Check authentication status on app start / page reload
   */
  initAuth: async () => {
    // Avoid double initialization loops
    if (get().isInitialized && get().isLoading) return;

    set({ isLoading: true });
    try {
      const response = await authService.getMe();
      if (response.success && response.user) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
        useSettingsStore.getState().syncFromAuthUser(response.user);
        return;
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    } catch {
      // Unauthenticated or network error on startup -> anonymous user state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  /**
   * Log in user with credentials
   */
  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      if (response.success && response.user) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        useSettingsStore.getState().syncFromAuthUser(response.user);
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Login failed. Please check your credentials.',
      });
      throw err;
    }
  },

  /**
   * Register new user account
   */
  register: async (credentials: RegisterCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(credentials);
      if (response.success && response.user) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        useSettingsStore.getState().syncFromAuthUser(response.user);
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Registration failed. Please try again.',
      });
      throw err;
    }
  },

  /**
   * Log out current user
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout, reset local auth state regardless
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  /**
   * Update profile fields (displayName, avatarUrl, country, bio)
   */
  updateProfile: async (payload: UpdateProfilePayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.updateProfile(payload);
      if (response.success && response.user) {
        set({
          user: response.user,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Failed to update profile.',
      });
      throw err;
    }
  },

  /**
   * Update settings in database and update user state
   */
  updateSettings: async (payload: UpdateSettingsPayload) => {
    try {
      const response = await userService.updateSettings(payload);
      if (response.success && response.settings) {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              settings: response.settings,
            },
          });
        }
      }
    } catch (err: any) {
      set({
        error: err.message || 'Failed to update settings.',
      });
      throw err;
    }
  },

  /**
   * Change user password
   */
  changePassword: async (credentials: ChangePasswordCredentials) => {
    set({ isLoading: true, error: null });
    try {
      await authService.changePassword(credentials);
      set({ isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Failed to change password.',
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
