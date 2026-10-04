import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OnlineGame } from '../pages/OnlineGame';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { socketService } from '../services/socketService';

describe('ChessNova Phase 6 — Frontend Online Multiplayer Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Waiting Room State', () => {
    it('renders waiting screen and link copy option when waiting for opponent', () => {
      vi.spyOn(socketService, 'connect').mockResolvedValue({
        off: vi.fn(),
        on: vi.fn(),
      } as any);
      vi.spyOn(socketService, 'joinGame').mockResolvedValue();

      useOnlineGameStore.setState({
        gameId: 'test-game-123',
        status: 'WAITING',
        timeControl: '5+3',
        initialTime: 300,
        increment: 3,
        whitePlayer: { id: 'u1', username: 'Novamaster' },
        blackPlayer: null,
        playerColor: 'white',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        turn: 'w',
        moveHistory: [],
        lastMove: null,
        whiteTime: 300,
        blackTime: 300,
        activeColor: 'w',
        isCheck: false,
        isGameOver: false,
        result: null,
        terminationReason: null,
        whiteConnected: true,
        blackConnected: false,
        drawOfferedBy: null,
        connectionStatus: 'connected',
        error: null,
      });

      render(
        <MemoryRouter initialEntries={['/online/test-game-123']}>
          <Routes>
            <Route path="/online/:gameId" element={<OnlineGame />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/Waiting for Opponent/i)).toBeInTheDocument();
      expect(screen.getByText(/5\+3 Blitz/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Copy Link/i })).toBeInTheDocument();
    });
  });

  describe('Active Online Match Board & Panels', () => {
    it('renders board, dual player panels, and clocks when game is ACTIVE', () => {
      const initSpy = vi.fn().mockResolvedValue(undefined);
      const leaveSpy = vi.fn();

      useOnlineGameStore.setState({
        gameId: 'test-game-123',
        status: 'ACTIVE',
        timeControl: '5+3',
        whitePlayer: { id: 'u1', username: 'Novamaster', displayName: 'Novamaster' },
        blackPlayer: { id: 'u2', username: 'OpponentMaster', displayName: 'OpponentMaster' },
        playerColor: 'white',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        turn: 'w',
        moveHistory: [],
        lastMove: null,
        whiteTime: 300,
        blackTime: 300,
        activeColor: 'w',
        isCheck: false,
        isGameOver: false,
        result: null,
        terminationReason: null,
        whiteConnected: true,
        blackConnected: true,
        drawOfferedBy: null,
        connectionStatus: 'connected',
        error: null,
        initGame: initSpy,
        leaveGame: leaveSpy,
      });

      render(
        <MemoryRouter initialEntries={['/online/test-game-123']}>
          <Routes>
            <Route path="/online/:gameId" element={<OnlineGame />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/OpponentMaster/i)).toBeInTheDocument();
      expect(screen.getByText(/Novamaster/i)).toBeInTheDocument();
      expect(screen.getAllByText(/05:00/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /Resign/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Draw/i })).toBeInTheDocument();
    });
  });

  describe('Draw Offer Interactions', () => {
    it('renders draw offer banner when opponent offers draw', () => {
      const initSpy = vi.fn().mockResolvedValue(undefined);
      const leaveSpy = vi.fn();

      useOnlineGameStore.setState({
        gameId: 'test-game-123',
        status: 'ACTIVE',
        whitePlayer: { id: 'u1', username: 'Novamaster' },
        blackPlayer: { id: 'u2', username: 'OpponentMaster' },
        playerColor: 'white',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        drawOfferedBy: 'b', // Opponent offered draw
        initGame: initSpy,
        leaveGame: leaveSpy,
      });

      render(
        <MemoryRouter initialEntries={['/online/test-game-123']}>
          <Routes>
            <Route path="/online/:gameId" element={<OnlineGame />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/Your opponent has offered a draw/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Accept Draw/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
    });
  });

  describe('Game Over Result Modal', () => {
    it('renders game over victory modal upon checkmate', () => {
      const initSpy = vi.fn().mockResolvedValue(undefined);
      const leaveSpy = vi.fn();

      useOnlineGameStore.setState({
        gameId: 'test-game-123',
        status: 'FINISHED',
        whitePlayer: { id: 'u1', username: 'Novamaster' },
        blackPlayer: { id: 'u2', username: 'OpponentMaster' },
        playerColor: 'white',
        isGameOver: true,
        result: 'WHITE_WIN',
        terminationReason: 'CHECKMATE',
        initGame: initSpy,
        leaveGame: leaveSpy,
      });

      render(
        <MemoryRouter initialEntries={['/online/test-game-123']}>
          <Routes>
            <Route path="/online/:gameId" element={<OnlineGame />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/White Wins!/i)).toBeInTheDocument();
      expect(screen.getByText(/CHECKMATE/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Play Another Game/i })).toBeInTheDocument();
    });
  });
});

