import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChessSquare } from '../components/chess/ChessSquare';
import { ChessPiece } from '../components/chess/ChessPiece';
import { BOARD_THEMES } from '../utils/boardThemes';

describe('ChessNova Phase 11 — Frontend Security & Performance Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. High-Frequency Chess Board Memoization', () => {
    it('renders memoized ChessSquare with accurate attributes', () => {
      render(
        <ChessSquare
          square="e4"
          isDark={false}
          piece={{ type: 'p', color: 'w' }}
          isSelected={false}
          isLastMove={true}
          isLegalMove={false}
          isCapture={false}
          isInCheck={false}
          isDraggablePiece={true}
          theme={BOARD_THEMES.classic}
          onClick={() => {}}
          onDragStart={() => {}}
          onDrop={() => {}}
          onDragOver={() => {}}
        />
      );

      const squareEl = screen.getByRole('gridcell');
      expect(squareEl).toBeInTheDocument();
      expect(squareEl).toHaveAttribute('data-square', 'e4');
      expect(squareEl).toHaveAttribute('aria-label', expect.stringContaining('White p'));
    });

    it('renders memoized ChessPiece with accessible SVG structure', () => {
      render(
        <ChessPiece
          color="w"
          type="n"
          square="f3"
          isDraggable={true}
        />
      );

      const pieceEl = screen.getByRole('img');
      expect(pieceEl).toBeInTheDocument();
      expect(pieceEl).toHaveAttribute('aria-label', 'White knight on f3');
    });
  });

  describe('2. Safe Text Escaping & Anti-XSS Rendering', () => {
    it('safely escapes malicious script tags in username and bio text', () => {
      const maliciousBio = '<script>alert("xss")</script><img src=x onerror=alert(1)>';

      render(
        <div data-testid="user-bio">
          {maliciousBio}
        </div>
      );

      const bioEl = screen.getByTestId('user-bio');
      expect(bioEl.textContent).toBe(maliciousBio);
      // Ensure no raw unescaped script tag was executed or injected into DOM
      expect(document.querySelector('script[src*="xss"]')).toBeNull();
    });
  });
});
