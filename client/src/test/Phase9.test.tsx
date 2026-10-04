import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { Settings } from '../pages/Settings';
import { MainLayout } from '../layouts/MainLayout';
import { ChessBoard } from '../components/chess/ChessBoard';
import { BOARD_THEMES } from '../utils/boardThemes';
import { renderModernPiece } from '../components/chess/pieceSets/modernPieces';
import { renderClassicPiece } from '../components/chess/pieceSets/classicPieces';

describe('ChessNova Phase 9 — Mobile Optimization & Advanced Settings Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useSettingsStore.getState().initSettings();
    });
  });

  describe('Unified Settings Store & Preferences', () => {
    it('initializes with production default settings', () => {
      const state = useSettingsStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.boardTheme).toBe('classic');
      expect(state.pieceSet).toBe('classic');
      expect(state.soundEnabled).toBe(true);
      expect(state.animationEnabled).toBe(true);
      expect(state.animationSpeed).toBe('normal');
      expect(state.showLegalMoves).toBe(true);
      expect(state.showCoordinates).toBe(true);
      expect(state.highlightLastMove).toBe(true);
      expect(state.confirmMoves).toBe(false);
      expect(state.autoQueen).toBe(false);
    });

    it('optimistically updates user preferences and stores in localStorage', async () => {
      await act(async () => {
        await useSettingsStore.getState().updateSetting('boardTheme', 'midnight');
        await useSettingsStore.getState().updateSetting('pieceSet', 'modern');
        await useSettingsStore.getState().updateSetting('confirmMoves', true);
        await useSettingsStore.getState().updateSetting('autoQueen', true);
      });

      const state = useSettingsStore.getState();
      expect(state.boardTheme).toBe('midnight');
      expect(state.pieceSet).toBe('modern');
      expect(state.confirmMoves).toBe(true);
      expect(state.autoQueen).toBe(true);

      const raw = localStorage.getItem('chessnova_user_settings');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.boardTheme).toBe('midnight');
      expect(parsed.pieceSet).toBe('modern');
      expect(parsed.confirmMoves).toBe(true);
      expect(parsed.autoQueen).toBe(true);
    });

    it('correctly synchronizes authenticated user preferences from database model', () => {
      act(() => {
        useSettingsStore.getState().syncFromAuthUser({
          id: 'u1',
          username: 'grandmaster',
          email: 'gm@chessnova.com',
          displayName: 'Grandmaster',
          avatarUrl: null,
          country: 'US',
          bio: null,
          createdAt: new Date().toISOString(),
          settings: {
            theme: 'light',
            boardTheme: 'highContrast',
            pieceSet: 'modern',
            soundEnabled: false,
            animationEnabled: true,
            animationSpeed: 'fast',
            showLegalMoves: false,
            showCoordinates: false,
            highlightLastMove: true,
            confirmMoves: true,
            autoQueen: true,
          },
        });
      });

      const state = useSettingsStore.getState();
      expect(state.boardTheme).toBe('highContrast');
      expect(state.pieceSet).toBe('modern');
      expect(state.soundEnabled).toBe(false);
      expect(state.animationSpeed).toBe('fast');
      expect(state.showLegalMoves).toBe(false);
      expect(state.showCoordinates).toBe(false);
      expect(state.confirmMoves).toBe(true);
      expect(state.autoQueen).toBe(true);
    });
  });

  describe('Board Themes & Piece Customization', () => {
    it('provides all 4 core board themes including High Contrast', () => {
      expect(BOARD_THEMES.classic).toBeDefined();
      expect(BOARD_THEMES.modern).toBeDefined();
      expect(BOARD_THEMES.midnight).toBeDefined();
      expect(BOARD_THEMES.highContrast).toBeDefined();

      expect(BOARD_THEMES.classic.lightSquare).toBe('#eeeed2');
      expect(BOARD_THEMES.classic.darkSquare).toBe('#769656');
      expect(BOARD_THEMES.highContrast.lightSquare).toBe('#ffffff');
      expect(BOARD_THEMES.highContrast.darkSquare).toBe('#000000');
    });

    it('renders vector SVGs correctly for both Classic and Modern piece sets', () => {
      const whiteKingClassic = renderClassicPiece('w', 'k');
      expect(React.isValidElement(whiteKingClassic)).toBe(true);

      const blackKnightClassic = renderClassicPiece('b', 'n');
      expect(React.isValidElement(blackKnightClassic)).toBe(true);

      const whiteQueenModern = renderModernPiece('w', 'q');
      expect(React.isValidElement(whiteQueenModern)).toBe(true);

      const blackBishopModern = renderModernPiece('b', 'b');
      expect(React.isValidElement(blackBishopModern)).toBe(true);
    });
  });

  describe('Settings Page UI & Category Tabs', () => {
    it('renders settings navigation tabs and allows switching between sections', async () => {
      render(
        <BrowserRouter>
          <Settings />
        </BrowserRouter>
      );

      // Header title
      expect(screen.getByText(/Settings & Customization/i)).toBeInTheDocument();

      // Category Tabs
      expect(screen.getByRole('button', { name: /Appearance/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Board & Pieces/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gameplay/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Audio & Sound/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Accessibility/i })).toBeInTheDocument();

      // Switch to Board & Pieces
      fireEvent.click(screen.getByRole('button', { name: /Board & Pieces/i }));
      expect(screen.getByText(/Chessboard Color Theme/i)).toBeInTheDocument();
      expect(screen.getByText(/Piece Set Styles/i)).toBeInTheDocument();

      // Switch to Gameplay
      fireEvent.click(screen.getByRole('button', { name: /Gameplay/i }));
      expect(screen.getByText(/Show Legal Move Indicators/i)).toBeInTheDocument();
      expect(screen.getByText(/Confirm Moves/i)).toBeInTheDocument();
      expect(screen.getByText(/Auto-Queen on Promotion/i)).toBeInTheDocument();

      // Switch to Audio & Sound
      fireEvent.click(screen.getByRole('button', { name: /Audio & Sound/i }));
      expect(screen.getByText(/Audio Effects/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Play Test Sound/i })).toBeInTheDocument();

      // Switch to Accessibility
      fireEvent.click(screen.getByRole('button', { name: /Accessibility/i }));
      expect(screen.getByText(/Reduced Motion Mode/i)).toBeInTheDocument();
      expect(screen.getByText(/Animation Speed/i)).toBeInTheDocument();
    });

    it('updates board theme directly when user clicks theme button', async () => {
      render(
        <BrowserRouter>
          <Settings />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /Board & Pieces/i }));
      const midnightBtn = screen.getByText(/Midnight Nova/i);
      fireEvent.click(midnightBtn);

      expect(useSettingsStore.getState().boardTheme).toBe('midnight');
    });
  });

  describe('Mobile Navigation & Header Layout', () => {
    it('renders 5 primary mobile bottom destinations (Home, Play, Games, Leaderboard, Profile)', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <MainLayout />
        </MemoryRouter>
      );

      const nav = screen.getByRole('navigation', { name: /Mobile Navigation/i });
      expect(nav).toBeInTheDocument();

      // Check mobile links
      const links = nav.querySelectorAll('a');
      expect(links.length).toBe(5);
      expect(nav).toHaveTextContent(/Home/i);
      expect(nav).toHaveTextContent(/Play/i);
      expect(nav).toHaveTextContent(/Games/i);
      expect(nav).toHaveTextContent(/Leaderboard/i);
      expect(nav).toHaveTextContent(/Profile/i);
    });

    it('opens mobile drawer menu when hamburger button is clicked', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <MainLayout />
        </MemoryRouter>
      );

      const menuBtn = screen.getByRole('button', { name: /Toggle navigation menu/i });
      fireEvent.click(menuBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveTextContent(/Settings & Theme/i);
      expect(dialog).toHaveTextContent(/Friends & Chat/i);
    });
  });

  describe('Responsive ChessBoard Preferences Integration', () => {
    it('renders coordinates only when showCoordinates is enabled', () => {
      act(() => {
        useSettingsStore.getState().updateSetting('showCoordinates', false);
      });

      const { rerender } = render(
        <ChessBoard
          orientation="white"
          turn="w"
          selectedSquare={null}
          legalDestinations={[]}
          lastMove={null}
          checkSquare={null}
          getPieceAt={() => null}
          onSquareClick={() => {}}
          onMoveAttempt={() => {}}
        />
      );

      // Coordinates should be hidden
      expect(screen.queryByText('a')).not.toBeInTheDocument();

      // Enable coordinates
      act(() => {
        useSettingsStore.getState().updateSetting('showCoordinates', true);
      });

      rerender(
        <ChessBoard
          orientation="white"
          turn="w"
          selectedSquare={null}
          legalDestinations={[]}
          lastMove={null}
          checkSquare={null}
          getPieceAt={() => null}
          onSquareClick={() => {}}
          onMoveAttempt={() => {}}
        />
      );

      expect(screen.getByText('a')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });
});
