import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useChessGame } from '../hooks/useChessGame';
import { useSettingsStore } from '../store/settingsStore';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { Play } from '../pages/Play';
import { Settings } from '../pages/Settings';

describe('ChessNova Phase 10 — Frontend Full Technical Audit & Regression Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().initSettings();
    useOnlineGameStore.getState().leaveGame();
  });

  describe('1. Chess Engine & Board Invariants (Client Hook)', () => {
    it('initializes standard starting position with White to move', () => {
      const { result } = renderHook(() => useChessGame());
      expect(result.current.turn).toBe('w');
      expect(result.current.isGameOver).toBe(false);
      expect(result.current.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(result.current.history.length).toBe(0);
    });

    it('processes legal moves sequentially and switches active player', () => {
      const { result } = renderHook(() => useChessGame());

      act(() => {
        const move1 = result.current.makeMove('e2', 'e4');
        expect(move1).toBe(true);
      });
      expect(result.current.turn).toBe('b');
      expect(result.current.history.length).toBe(1);

      act(() => {
        const move2 = result.current.makeMove('e7', 'e5');
        expect(move2).toBe(true);
      });
      expect(result.current.turn).toBe('w');
      expect(result.current.history.length).toBe(1); // 1 paired move (1. e4 e5)
    });

    it('rejects illegal moves and maintains original board position', () => {
      const { result } = renderHook(() => useChessGame());
      const initialFen = result.current.fen;

      act(() => {
        const illegalMove = result.current.makeMove('e2', 'e5'); // Pawn cannot jump 3 squares
        expect(illegalMove).toBe(false);
      });
      expect(result.current.fen).toBe(initialFen);
      expect(result.current.turn).toBe('w');
    });

    it('flips orientation without corrupting turn, history, or board position', () => {
      const { result } = renderHook(() => useChessGame());
      
      act(() => {
        result.current.makeMove('d2', 'd4');
      });
      const currentFen = result.current.fen;

      expect(result.current.orientation).toBe('white');
      act(() => {
        result.current.flipBoard();
      });
      expect(result.current.orientation).toBe('black');
      expect(result.current.fen).toBe(currentFen);
      expect(result.current.turn).toBe('b');
    });
  });

  describe('2. Resignation & Game Over Flow', () => {
    it('handles resignation and assigns winner correctly', () => {
      const { result } = renderHook(() => useChessGame());

      act(() => {
        result.current.resign('w');
      });

      expect(result.current.isGameOver).toBe(true);
      expect(result.current.gameResult?.winner).toBe('b');
      expect(result.current.gameResult?.reason).toBe('resignation');
    });
  });

  describe('3. Settings & Preferences Persistence', () => {
    it('modifies board theme and persists to store', async () => {
      const settings = useSettingsStore.getState();
      expect(settings.boardTheme).toBe('classic');

      await act(async () => {
        await settings.updateSetting('boardTheme', 'midnight');
      });
      expect(useSettingsStore.getState().boardTheme).toBe('midnight');

      await act(async () => {
        await settings.updateSetting('boardTheme', 'highContrast');
      });
      expect(useSettingsStore.getState().boardTheme).toBe('highContrast');
    });

    it('toggles sound, legal move highlights, and coordinates accurately', async () => {
      const settings = useSettingsStore.getState();

      await act(async () => {
        await settings.updateSetting('soundEnabled', false);
        await settings.updateSetting('showLegalMoves', false);
        await settings.updateSetting('showCoordinates', false);
      });

      expect(useSettingsStore.getState().soundEnabled).toBe(false);
      expect(useSettingsStore.getState().showLegalMoves).toBe(false);
      expect(useSettingsStore.getState().showCoordinates).toBe(false);
    });
  });

  describe('4. Full App Navigation & Accessibility Views', () => {
    it('renders Play page with local chess board and primary controls', () => {
      render(
        <BrowserRouter>
          <Play />
        </BrowserRouter>
      );

      // Verify page headings and interactive elements
      expect(screen.getByLabelText(/Interactive Chess Board/i)).toBeInTheDocument();
    });

    it('renders Settings view with all preferences sections', () => {
      render(
        <BrowserRouter>
          <Settings />
        </BrowserRouter>
      );

      expect(screen.getByText(/Appearance/i)).toBeInTheDocument();
      expect(screen.getByText(/Board & Pieces/i)).toBeInTheDocument();
      expect(screen.getByText(/Audio & Sound/i)).toBeInTheDocument();
    });
  });
});
