import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../App';
import { useThemeStore } from '../store/themeStore';

describe('ChessNova Frontend Foundation', () => {
  it('renders homepage with ChessNova brand headline', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Play\. Think\.\s*Conquer\./i);
    expect(screen.getAllByText(/ChessNova/i).length).toBeGreaterThan(0);
  });

  it('renders core navigation items', () => {
    render(<App />);
    expect(screen.getAllByText(/Play/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Puzzles/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Learn/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Leaderboard/i).length).toBeGreaterThan(0);
  });

  it('toggles theme state in themeStore correctly', () => {
    const { setTheme } = useThemeStore.getState();

    setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });
});
