import { create } from 'zustand';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeState {
  theme: Theme;
  effectiveTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

const THEME_STORAGE_KEY = 'chessnova-theme';

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(resolved: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  effectiveTheme: 'dark',

  setTheme: (newTheme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    applyThemeToDocument(resolved);
    set({ theme: newTheme, effectiveTheme: resolved });
  },

  initTheme: () => {
    const saved = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'dark';
    const resolved = saved === 'system' ? getSystemTheme() : saved;
    applyThemeToDocument(resolved);
    set({ theme: saved, effectiveTheme: resolved });

    // Listen for OS system theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        if (get().theme === 'system') {
          const sys = getSystemTheme();
          applyThemeToDocument(sys);
          set({ effectiveTheme: sys });
        }
      };
      mediaQuery.addEventListener('change', listener);
    }
  },
}));
