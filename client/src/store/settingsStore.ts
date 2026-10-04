import { create } from 'zustand';
import { BoardThemeName } from '../types/chess';
import { Theme, useThemeStore } from './themeStore';
import { soundService } from '../utils/soundService';
import { userService } from '../services/userService';
import { AuthUser, UpdateSettingsPayload } from '../types/auth';

export interface UserPreferences {
  theme: Theme;
  boardTheme: BoardThemeName;
  pieceSet: 'classic' | 'modern';
  soundEnabled: boolean;
  animationEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  showLegalMoves: boolean;
  showCoordinates: boolean;
  highlightLastMove: boolean;
  confirmMoves: boolean;
  autoQueen: boolean;
  reduceMotion: boolean;
}

interface SettingsState extends UserPreferences {
  isSaving: boolean;
  error: string | null;
  updateSetting: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  updateSettingsBatch: (updates: Partial<UserPreferences>) => Promise<void>;
  initSettings: () => void;
  syncFromAuthUser: (user: AuthUser | null) => void;
}

const SETTINGS_STORAGE_KEY = 'chessnova_user_settings';

const DEFAULT_SETTINGS: UserPreferences = {
  theme: 'dark',
  boardTheme: 'classic',
  pieceSet: 'classic',
  soundEnabled: true,
  animationEnabled: true,
  animationSpeed: 'normal',
  showLegalMoves: true,
  showCoordinates: true,
  highlightLastMove: true,
  confirmMoves: false,
  autoQueen: false,
  reduceMotion: false,
};

function loadLocalSettings(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveLocalSettings(settings: UserPreferences) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadLocalSettings(),
  isSaving: false,
  error: null,

  initSettings: () => {
    const local = loadLocalSettings();
    set(local);

    // Apply sound service state
    soundService.setEnabled(local.soundEnabled);

    // Check prefers-reduced-motion OS flag
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced && !local.reduceMotion) {
        set({ reduceMotion: true });
      }
    }
  },

  syncFromAuthUser: (user: AuthUser | null) => {
    if (!user || !user.settings) return;

    const s = user.settings;
    const synced: UserPreferences = {
      theme: (s.theme as Theme) || get().theme,
      boardTheme: (s.boardTheme as BoardThemeName) || get().boardTheme,
      pieceSet: (s.pieceSet as 'classic' | 'modern') || get().pieceSet,
      soundEnabled: s.soundEnabled ?? get().soundEnabled,
      animationEnabled: s.animationEnabled ?? get().animationEnabled,
      animationSpeed: (s.animationSpeed as 'slow' | 'normal' | 'fast') || get().animationSpeed,
      showLegalMoves: s.showLegalMoves ?? get().showLegalMoves,
      showCoordinates: s.showCoordinates ?? get().showCoordinates,
      highlightLastMove: s.highlightLastMove ?? get().highlightLastMove,
      confirmMoves: s.confirmMoves ?? get().confirmMoves,
      autoQueen: s.autoQueen ?? get().autoQueen,
      reduceMotion: get().reduceMotion,
    };

    set(synced);
    saveLocalSettings(synced);
    soundService.setEnabled(synced.soundEnabled);
    useThemeStore.getState().setTheme(synced.theme);
  },

  updateSetting: async (key, value) => {
    // 1. Optimistic reactive update
    set({ [key]: value });

    const currentSettings: UserPreferences = {
      theme: get().theme,
      boardTheme: get().boardTheme,
      pieceSet: get().pieceSet,
      soundEnabled: get().soundEnabled,
      animationEnabled: get().animationEnabled,
      animationSpeed: get().animationSpeed,
      showLegalMoves: get().showLegalMoves,
      showCoordinates: get().showCoordinates,
      highlightLastMove: get().highlightLastMove,
      confirmMoves: get().confirmMoves,
      autoQueen: get().autoQueen,
      reduceMotion: get().reduceMotion,
      [key]: value,
    };

    saveLocalSettings(currentSettings);

    // 2. Synchronize side-effects
    if (key === 'soundEnabled') {
      soundService.setEnabled(value as boolean);
    } else if (key === 'theme') {
      useThemeStore.getState().setTheme(value as Theme);
    }

    // 3. Debounced remote persistence to PostgreSQL for authenticated users
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(async () => {
      try {
        set({ isSaving: true, error: null });
        const payload: UpdateSettingsPayload = {
          theme: currentSettings.theme as any,
          boardTheme: currentSettings.boardTheme,
          pieceSet: currentSettings.pieceSet,
          soundEnabled: currentSettings.soundEnabled,
          animationEnabled: currentSettings.animationEnabled,
          animationSpeed: currentSettings.animationSpeed,
          showLegalMoves: currentSettings.showLegalMoves,
          showCoordinates: currentSettings.showCoordinates,
          highlightLastMove: currentSettings.highlightLastMove,
          confirmMoves: currentSettings.confirmMoves,
          autoQueen: currentSettings.autoQueen,
        };
        await userService.updateSettings(payload);
        set({ isSaving: false });
      } catch {
        // Safe fallback: local preference remains valid if unauthenticated or offline
        set({ isSaving: false });
      }
    }, 250);
  },

  updateSettingsBatch: async (updates) => {
    set(updates);

    const merged: UserPreferences = {
      theme: get().theme,
      boardTheme: get().boardTheme,
      pieceSet: get().pieceSet,
      soundEnabled: get().soundEnabled,
      animationEnabled: get().animationEnabled,
      animationSpeed: get().animationSpeed,
      showLegalMoves: get().showLegalMoves,
      showCoordinates: get().showCoordinates,
      highlightLastMove: get().highlightLastMove,
      confirmMoves: get().confirmMoves,
      autoQueen: get().autoQueen,
      reduceMotion: get().reduceMotion,
      ...updates,
    };

    saveLocalSettings(merged);

    if (updates.soundEnabled !== undefined) {
      soundService.setEnabled(updates.soundEnabled);
    }
    if (updates.theme !== undefined) {
      useThemeStore.getState().setTheme(updates.theme);
    }

    try {
      set({ isSaving: true, error: null });
      const payload: UpdateSettingsPayload = {
        theme: merged.theme as any,
        boardTheme: merged.boardTheme,
        pieceSet: merged.pieceSet,
        soundEnabled: merged.soundEnabled,
        animationEnabled: merged.animationEnabled,
        animationSpeed: merged.animationSpeed,
        showLegalMoves: merged.showLegalMoves,
        showCoordinates: merged.showCoordinates,
        highlightLastMove: merged.highlightLastMove,
        confirmMoves: merged.confirmMoves,
        autoQueen: merged.autoQueen,
      };
      await userService.updateSettings(payload);
      set({ isSaving: false });
    } catch {
      set({ isSaving: false });
    }
  },
}));
