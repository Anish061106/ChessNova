import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Puzzles } from '../pages/Puzzles';
import { Friends } from '../pages/Friends';
import { GameChatPanel } from '../components/chat/GameChatPanel';
import { puzzleApi } from '../services/puzzleApi';
import { friendApi } from '../services/friendApi';
import { socketService } from '../services/socketService';

describe('Phase 13: Puzzles, Friends & Real-Time Game Chat Suite (Client)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Tactical Puzzles Module', () => {
    it('renders the Puzzles arena with rating, difficulty and chess board', async () => {
      vi.spyOn(puzzleApi, 'getRandomPuzzle').mockResolvedValueOnce({
        id: 'puz-test-1',
        fen: '6k1/5ppp/8/8/8/8/4QPPP/6K1 w - - 0 1',
        pgn: 'Back rank mate in 1',
        rating: 900,
        difficulty: 'easy',
        themes: ['Back Rank', 'Mate in 1'],
        initialPlyColor: 'w',
        totalMoves: 1,
        createdAt: new Date().toISOString(),
      });

      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );

      expect(screen.getByText(/Tactical Challenge/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('900 Rating')).toBeInTheDocument();
        expect(screen.getByText('EASY')).toBeInTheDocument();
      });
    });

    it('switches difficulty filters and triggers new puzzle loading', async () => {
      const getSpy = vi.spyOn(puzzleApi, 'getRandomPuzzle').mockResolvedValue({
        id: 'puz-test-hard',
        fen: '8/5k2/8/8/8/8/4K1P1/7R w - - 0 1',
        pgn: null,
        rating: 1950,
        difficulty: 'hard',
        themes: ['Endgame'],
        initialPlyColor: 'w',
        totalMoves: 3,
        createdAt: new Date().toISOString(),
      });

      render(
        <MemoryRouter>
          <Puzzles />
        </MemoryRouter>
      );

      const hardFilterBtn = screen.getByText('Hard');
      fireEvent.click(hardFilterBtn);

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledWith('hard');
      });
    });
  });

  describe('2. Friends & Social Module', () => {
    it('renders the Friends page with tabs and handles player search', async () => {
      vi.spyOn(friendApi, 'getFriends').mockResolvedValueOnce([]);
      vi.spyOn(friendApi, 'getRequests').mockResolvedValueOnce({ incoming: [], outgoing: [] });
      const searchSpy = vi.spyOn(friendApi, 'searchUsers').mockResolvedValueOnce([
        {
          id: 'user-2',
          username: 'GrandmasterAlice',
          displayName: 'Alice GM',
          avatarUrl: null,
          country: 'US',
        },
      ]);

      render(
        <MemoryRouter>
          <Friends />
        </MemoryRouter>
      );

      expect(screen.getByText(/Friends & Community/i)).toBeInTheDocument();

      // Click "Find Players" tab
      const findTab = screen.getByText(/Find Players/i);
      fireEvent.click(findTab);

      const searchInput = screen.getByPlaceholderText(/Search players by username/i);
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      const searchBtn = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(searchSpy).toHaveBeenCalledWith('Alice');
        expect(screen.getByText('Alice GM')).toBeInTheDocument();
        expect(screen.getByText('@GrandmasterAlice')).toBeInTheDocument();
      });
    });
  });

  describe('3. Real-Time Game Chat Panel', () => {
    it('renders chat panel and allows sending sanitized messages via Socket.IO', async () => {
      const mockSocket = {
        emit: vi.fn((event, _data, callback) => {
          if (event === 'chat:history') {
            callback?.({
              success: true,
              history: [
                {
                  id: 'msg-1',
                  gameId: 'game-123',
                  sender: { id: 'u1', username: 'Magnus', displayName: 'Magnus C', avatarUrl: null },
                  message: 'Good luck!',
                  createdAt: new Date().toISOString(),
                },
              ],
            });
          }
          if (event === 'chat:send') {
            callback?.({ success: true });
          }
        }),
        on: vi.fn(),
        off: vi.fn(),
      };

      vi.spyOn(socketService, 'getSocket').mockReturnValue(mockSocket as any);

      render(
        <MemoryRouter>
          <GameChatPanel gameId="game-123" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Good luck!')).toBeInTheDocument();
        expect(screen.getByText('Magnus C')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Send a message/i);
      fireEvent.change(input, { target: { value: 'Have fun!' } });

      const submitBtn = screen.getByTitle('Send message');
      fireEvent.click(submitBtn);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'chat:send',
        { gameId: 'game-123', message: 'Have fun!' },
        expect.any(Function)
      );
    });
  });
});
