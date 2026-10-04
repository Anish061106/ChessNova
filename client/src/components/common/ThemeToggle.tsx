import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useThemeStore, Theme } from '../../store/themeStore';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, setTheme } = useThemeStore();

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'system', label: 'Auto', icon: <Laptop className="w-4 h-4" /> },
  ];

  if (compact) {
    const nextTheme: Theme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    return (
      <button
        onClick={() => setTheme(nextTheme)}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        title={`Theme: ${theme} (Click to toggle)`}
        aria-label="Toggle theme"
      >
        {theme === 'dark' && <Moon className="w-5 h-5 text-indigo-400" />}
        {theme === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
        {theme === 'system' && <Laptop className="w-5 h-5 text-sky-400" />}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
    >
      {options.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/50 dark:border-slate-700/60'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            aria-pressed={isActive}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
