import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Leaderboard } from '../pages/Leaderboard';
import { Games } from '../pages/Games';
import { GameDetail } from '../pages/GameDetail';
import { Profile } from '../pages/Profile';
import { ratingApi } from '../services/ratingApi';
import { useAuthStore } from '../store/authStore';

// Mock ratingApi
vi.mock('../services/ratingApi', () => ({
  ratingApi: {
    getLeaderboard: vi.fn(),
    getUserRatings: vi.fn(),
    getMyRatingHistory: vi.fn(),
    getMyGameHistory: vi.fn(),
    getGameDetails: vi.fn(),
    getGamePgn: vi.fn(),
  },
}));

const mockAuthUser = {
  id: 'test-user-id',
  username: 'grandmaster_nova',
  displayName: 'Grandmaster Nova',
  email: 'gm@chessnova.com',
  country: 'NO',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  ratings: [
    { category: 'BLITZ', rating: 1450, gamesPlayed: 20, wins: 15, losses: 3, draws: 2 },
    { category: 'RAPID', rating: 1400, gamesPlayed: 10, wins: 7, losses: 2, draws: 1 },
    { category: 'BULLET', rating: 1300, gamesPlayed: 5, wins: 3, losses: 2, draws: 0 },
    { category: 'CLASSICAL', rating: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
  ],
};

describe('ChessNova Phase 8 — Frontend Rating, Leaderboards & Game Replay Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: mockAuthUser as any,
      isAuthenticated: true,
    });
  });

  describe('Leaderboard Component', () => {
    it('renders category tabs and leaderboard ranking records', async () => {
      vi.mocked(ratingApi.getLeaderboard).mockResolvedValue({
        category: 'BLITZ',
        items: [
          {
            rank: 1,
            id: 'rating-1',
            userId: 'user-1',
            username: 'magnus_nova',
            displayName: 'Magnus Nova',
            avatarUrl: null,
            country: 'NO',
            rating: 1850,
            gamesPlayed: 50,
            wins: 40,
            losses: 5,
            draws: 5,
            winRate: 80,
          },
          {
            rank: 2,
            id: 'rating-2',
            userId: 'test-user-id',
            username: 'grandmaster_nova',
            displayName: 'Grandmaster Nova',
            avatarUrl: null,
            country: 'NO',
            rating: 1450,
            gamesPlayed: 20,
            wins: 15,
            losses: 3,
            draws: 2,
            winRate: 75,
          },
        ],
        currentUserRank: {
          rank: 2,
          id: 'rating-2',
          userId: 'test-user-id',
          username: 'grandmaster_nova',
          displayName: 'Grandmaster Nova',
          avatarUrl: null,
          country: 'NO',
          rating: 1450,
          gamesPlayed: 20,
          wins: 15,
          losses: 3,
          draws: 2,
          winRate: 75,
        },
        pagination: {
          page: 1,
          limit: 25,
          total: 2,
          totalPages: 1,
        },
      });

      render(
        <MemoryRouter>
          <Leaderboard />
        </MemoryRouter>
      );

      expect(screen.getByText('Global Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('Blitz')).toBeInTheDocument();
      expect(screen.getByText('Rapid')).toBeInTheDocument();
      expect(screen.getByText('Bullet')).toBeInTheDocument();
      expect(screen.getByText('Classical')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getAllByText('Magnus Nova').length).toBeGreaterThan(0);
        expect(screen.getAllByText('1850').length).toBeGreaterThan(0);
        expect(screen.getByText('Your Standings')).toBeInTheDocument();
      });
    });

    it('switches categories upon tab selection', async () => {
      vi.mocked(ratingApi.getLeaderboard).mockResolvedValue({
        category: 'RAPID',
        items: [],
        currentUserRank: null,
        pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
      });

      render(
        <MemoryRouter>
          <Leaderboard />
        </MemoryRouter>
      );

      const rapidButton = screen.getByRole('button', { name: /Rapid/i });
      fireEvent.click(rapidButton);

      await waitFor(() => {
        expect(ratingApi.getLeaderboard).toHaveBeenCalledWith('RAPID', 1, 25);
      });
    });
  });

  describe('Game History (Games.tsx) Component', () => {
    it('renders completed match list with outcome badges and rating changes', async () => {
      vi.mocked(ratingApi.getMyGameHistory).mockResolvedValue({
        items: [
          {
            id: 'game-history-1',
            timeControl: '5+3',
            rated: true,
            result: 'WIN',
            gameResult: 'WHITE_WIN',
            terminationReason: 'CHECKMATE',
            userColor: 'white',
            opponent: {
              id: 'opp-1',
              username: 'challenger_99',
              displayName: 'Challenger 99',
              avatarUrl: null,
            },
            ratingBefore: 1200,
            ratingChange: 16,
            ratingAfter: 1216,
            playedAt: new Date().toISOString(),
            endedAt: new Date().toISOString(),
          },
        ],
        pagination: {
          page: 1,
          limit: 15,
          total: 1,
          totalPages: 1,
        },
      });

      render(
        <MemoryRouter>
          <Games />
        </MemoryRouter>
      );

      expect(screen.getByText('Game History & Archive')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getAllByText('Challenger 99').length).toBeGreaterThan(0);
        expect(screen.getAllByText('WIN').length).toBeGreaterThan(0);
        expect(screen.getAllByText('+16').length).toBeGreaterThan(0);
        expect(screen.getAllByText('1200 → 1216').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Game Replay (GameDetail.tsx) Component', () => {
    it('renders replay board, moves list, and controls', async () => {
      vi.mocked(ratingApi.getGameDetails).mockResolvedValue({
        id: 'replay-game-123',
        gameType: 'ONLINE',
        timeControl: '5+3',
        initialTime: 300,
        increment: 3,
        rated: true,
        initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        finalFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        result: 'WHITE_WIN',
        terminationReason: 'RESIGNATION',
        pgn: '1. e4 e5 1-0',
        createdAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        whitePlayer: {
          id: 'test-user-id',
          username: 'grandmaster_nova',
          displayName: 'Grandmaster Nova',
          avatarUrl: null,
          country: 'NO',
        },
        blackPlayer: {
          id: 'opp-1',
          username: 'opponent_tactics',
          displayName: 'Opponent Tactics',
          avatarUrl: null,
          country: 'US',
        },
        whiteRatingChange: { before: 1400, change: 18, after: 1418 },
        blackRatingChange: { before: 1420, change: -18, after: 1402 },
        moves: [
          {
            id: 'm1',
            moveNumber: 1,
            ply: 1,
            color: 'w',
            from: 'e2',
            to: 'e4',
            san: 'e4',
            uci: 'e2e4',
            fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
          },
          {
            id: 'm2',
            moveNumber: 1,
            ply: 2,
            color: 'b',
            from: 'e7',
            to: 'e5',
            san: 'e5',
            uci: 'e7e5',
            fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
          },
        ],
      });

      render(
        <MemoryRouter initialEntries={['/games/replay-game-123']}>
          <Routes>
            <Route path="/games/:gameId" element={<GameDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Grandmaster Nova won')).toBeInTheDocument();
        expect(screen.getByText('1 - 0')).toBeInTheDocument();
        expect(screen.getByText('e4')).toBeInTheDocument();
        expect(screen.getByText('e5')).toBeInTheDocument();
        expect(screen.getByText('Copy PGN')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Rating Cards & Progression', () => {
    it('renders rating cards for Bullet, Blitz, Rapid, Classical', async () => {
      vi.mocked(ratingApi.getUserRatings).mockResolvedValue({
        user: mockAuthUser as any,
        ratings: mockAuthUser.ratings as any,
      });
      vi.mocked(ratingApi.getMyRatingHistory).mockResolvedValue({ items: [], pagination: {} });
      vi.mocked(ratingApi.getMyGameHistory).mockResolvedValue({ items: [], pagination: {} });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      expect(screen.getByText('Rating Categories')).toBeInTheDocument();
      expect(screen.getByText('Blitz')).toBeInTheDocument();
      expect(screen.getByText('1450')).toBeInTheDocument();
      expect(screen.getByText('Rapid')).toBeInTheDocument();
      expect(screen.getByText('1400')).toBeInTheDocument();
      expect(screen.getByText('Bullet')).toBeInTheDocument();
      expect(screen.getByText('1300')).toBeInTheDocument();
      expect(screen.getByText('Classical')).toBeInTheDocument();
    });
  });
});
