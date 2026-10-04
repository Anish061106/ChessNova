import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { useChessGame } from '../hooks/useChessGame';
import { Play } from '../pages/Play';
import { BrowserRouter } from 'react-router-dom';

describe('ChessNova Phase 2 — Chess Engine & Game Mechanics', () => {
  describe('Starting Position & Board State', () => {
    it('initializes with standard chess starting FEN', () => {
      const { result } = renderHook(() => useChessGame());
      expect(result.current.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(result.current.turn).toBe('w');
      expect(result.current.inCheck).toBe(false);
      expect(result.current.isGameOver).toBe(false);
      expect(result.current.gameResult).toBeNull();
      expect(result.current.history).toHaveLength(0);
    });

    it('correctly reports piece placement at start of game', () => {
      const { result } = renderHook(() => useChessGame());
      expect(result.current.getPieceAt('e1')).toEqual({ type: 'k', color: 'w' });
      expect(result.current.getPieceAt('e8')).toEqual({ type: 'k', color: 'b' });
      expect(result.current.getPieceAt('d1')).toEqual({ type: 'q', color: 'w' });
      expect(result.current.getPieceAt('d8')).toEqual({ type: 'q', color: 'b' });
      expect(result.current.getPieceAt('e4')).toBeNull();
    });
  });

  describe('Pawn and Piece Movements', () => {
    it('allows legal pawn double push on first move', () => {
      const { result } = renderHook(() => useChessGame());
      act(() => {
        const success = result.current.makeMove('e2', 'e4');
        expect(success).toBe(true);
      });
      expect(result.current.turn).toBe('b');
      expect(result.current.getPieceAt('e4')).toEqual({ type: 'p', color: 'w' });
      expect(result.current.getPieceAt('e2')).toBeNull();
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].white?.san).toBe('e4');
    });

    it('rejects illegal moves', () => {
      const { result } = renderHook(() => useChessGame());
      act(() => {
        const success = result.current.makeMove('e2', 'e5'); // Pawn cannot jump 3 squares
        expect(success).toBe(false);
      });
      expect(result.current.turn).toBe('w');
      expect(result.current.getPieceAt('e2')).toEqual({ type: 'p', color: 'w' });
    });

    it('calculates legal destinations when square is selected', () => {
      const { result } = renderHook(() => useChessGame());
      act(() => {
        result.current.selectSquare('e2');
      });
      expect(result.current.selectedSquare).toBe('e2');
      const destSquares = result.current.legalDestinations.map((d) => d.square);
      expect(destSquares).toContain('e3');
      expect(destSquares).toContain('e4');
      expect(destSquares).not.toContain('e5');
    });

    it('allows knight to jump over pieces', () => {
      const { result } = renderHook(() => useChessGame());
      act(() => {
        const success = result.current.makeMove('g1', 'f3');
        expect(success).toBe(true);
      });
      expect(result.current.getPieceAt('f3')).toEqual({ type: 'n', color: 'w' });
      expect(result.current.history[0].white?.san).toBe('Nf3');
    });
  });

  describe('Captures and Material Advantage', () => {
    it('executes a capture and updates captured piece tracking', () => {
      const { result } = renderHook(() => useChessGame());
      // 1. e4 d5 2. exd5
      act(() => {
        result.current.makeMove('e2', 'e4');
      });
      act(() => {
        result.current.makeMove('d7', 'd5');
      });
      act(() => {
        result.current.makeMove('e4', 'd5');
      });

      expect(result.current.capturedPieces.white).toContain('p');
      expect(result.current.capturedPieces.whiteAdvantage).toBe(1);
    });
  });

  describe('Castling', () => {
    it('allows kingside castling when path is clear', () => {
      // Setup position where kingside castling is legal: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5
      const { result } = renderHook(() => useChessGame());
      act(() => {
        result.current.makeMove('e2', 'e4');
        result.current.makeMove('e7', 'e5');
        result.current.makeMove('g1', 'f3');
        result.current.makeMove('b8', 'c6');
        result.current.makeMove('f1', 'c4');
        result.current.makeMove('f8', 'c5');
      });

      // White castles kingside: e1 -> g1
      act(() => {
        const castled = result.current.makeMove('e1', 'g1');
        expect(castled).toBe(true);
      });

      expect(result.current.getPieceAt('g1')).toEqual({ type: 'k', color: 'w' });
      expect(result.current.getPieceAt('f1')).toEqual({ type: 'r', color: 'w' });
      expect(result.current.history[3].white?.san).toBe('O-O');
    });
  });

  describe('En Passant', () => {
    it('allows en passant capture', () => {
      // 1. e4 a6 2. e5 d5 3. exd6 (en passant)
      const { result } = renderHook(() => useChessGame());
      act(() => {
        result.current.makeMove('e2', 'e4');
        result.current.makeMove('a7', 'a6');
        result.current.makeMove('e4', 'e5');
        result.current.makeMove('d7', 'd5');
      });

      act(() => {
        const enPassantSuccess = result.current.makeMove('e5', 'd6');
        expect(enPassantSuccess).toBe(true);
      });

      expect(result.current.getPieceAt('d6')).toEqual({ type: 'p', color: 'w' });
      expect(result.current.getPieceAt('d5')).toBeNull(); // Captured Black pawn removed
      expect(result.current.capturedPieces.white).toContain('p');
    });
  });

  describe('Pawn Promotion', () => {
    it('triggers pending promotion when pawn reaches last rank', () => {
      // FEN where white pawn on a7 can advance to a8
      const promoFen = '8/P7/8/8/8/8/8/k6K w - - 0 1';
      const { result } = renderHook(() => useChessGame(promoFen));

      act(() => {
        result.current.makeMove('a7', 'a8');
      });

      expect(result.current.pendingPromotion).toEqual({ from: 'a7', to: 'a8' });

      // Confirm promotion to Queen
      act(() => {
        result.current.confirmPromotion('q');
      });

      expect(result.current.pendingPromotion).toBeNull();
      expect(result.current.getPieceAt('a8')).toEqual({ type: 'q', color: 'w' });
    });
  });

  describe('Check, Checkmate, and Stalemate', () => {
    it('detects check correctly', () => {
      // Fool's Mate setup: 1. f3 e5 2. g4 Qh4# (or 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#)
      const { result } = renderHook(() => useChessGame());
      act(() => {
        result.current.makeMove('e2', 'e4');
        result.current.makeMove('e7', 'e5');
        result.current.makeMove('d1', 'h5');
        result.current.makeMove('g8', 'f6');
        result.current.makeMove('h5', 'e5'); // Checks Black King
      });

      expect(result.current.inCheck).toBe(true);
      expect(result.current.checkSquare).toBe('e8');
      expect(result.current.isGameOver).toBe(false);
    });

    it('detects Scholar\'s Mate (Checkmate)', () => {
      const { result } = renderHook(() => useChessGame());
      // 1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#
      act(() => {
        result.current.makeMove('e2', 'e4');
        result.current.makeMove('e7', 'e5');
        result.current.makeMove('f1', 'c4');
        result.current.makeMove('b8', 'c6');
        result.current.makeMove('d1', 'h5');
        result.current.makeMove('g8', 'f6');
        result.current.makeMove('h5', 'f7');
      });

      expect(result.current.inCheck).toBe(true);
      expect(result.current.isGameOver).toBe(true);
      expect(result.current.gameResult).toEqual({
        winner: 'w',
        reason: 'checkmate',
      });
    });

    it('detects Stalemate', () => {
      // Pure stalemate FEN: King on a1 can't move to a2 (c2 queen covers), b1 covered, b2 covered. Not in check!
      const pureStalemate = 'k7/8/8/8/8/8/2q5/K7 w - - 0 1';
      const { result } = renderHook(() => useChessGame(pureStalemate));

      expect(result.current.inCheck).toBe(false);
      expect(result.current.isGameOver).toBe(true);
      expect(result.current.gameResult).toEqual({
        winner: 'draw',
        reason: 'stalemate',
      });
    });
  });

  describe('Board Controls & Options', () => {
    it('flips orientation when flipBoard is called', () => {
      const { result } = renderHook(() => useChessGame());
      expect(result.current.orientation).toBe('white');
      act(() => {
        result.current.flipBoard();
      });
      expect(result.current.orientation).toBe('black');
      act(() => {
        result.current.flipBoard();
      });
      expect(result.current.orientation).toBe('white');
    });

    it('resets game to starting position', () => {
      const { result } = renderHook(() => useChessGame());
      act(() => {
        result.current.makeMove('e2', 'e4');
        result.current.makeMove('e7', 'e5');
      });
      expect(result.current.history).toHaveLength(1);

      act(() => {
        result.current.resetGame();
      });
      expect(result.current.history).toHaveLength(0);
      expect(result.current.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(result.current.turn).toBe('w');
    });

    it('changes board themes', () => {
      const { result } = renderHook(() => useChessGame());
      expect(result.current.boardTheme).toBe('classic');
      act(() => {
        result.current.setBoardTheme('modern');
      });
      expect(result.current.boardTheme).toBe('modern');
      act(() => {
        result.current.setBoardTheme('midnight');
      });
      expect(result.current.boardTheme).toBe('midnight');
    });
  });

  describe('Play Component UI Rendering', () => {
    it('renders the complete chess board with 64 squares', () => {
      render(
        <BrowserRouter>
          <Play />
        </BrowserRouter>
      );

      // Check header / titles
      expect(screen.getByText(/Local Pass & Play/i)).toBeInTheDocument();

      // Check board squares: e4, e2, e7, etc.
      const e4Square = screen.getByLabelText(/Square e4/i);
      expect(e4Square).toBeInTheDocument();

      const e1Square = screen.getByLabelText(/Square e1/i);
      expect(e1Square).toBeInTheDocument();

      // Check controls
      expect(screen.getByRole('button', { name: /Flip/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset|Restart/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /New Game/i })).toBeInTheDocument();
    });

    it('allows click-to-move interaction in Play UI', () => {
      render(
        <BrowserRouter>
          <Play />
        </BrowserRouter>
      );

      // Click e2 square (White pawn)
      const e2Square = screen.getByLabelText(/Square e2/i);
      fireEvent.click(e2Square);

      // Click e4 square (Legal destination)
      const e4Square = screen.getByLabelText(/Square e4/i);
      fireEvent.click(e4Square);

      // Move should appear in Move History panel
      expect(screen.getByText('e4')).toBeInTheDocument();
    });
  });
});
