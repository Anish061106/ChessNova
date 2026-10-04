import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../services/database/prisma.js';
import { userRepository } from '../services/users/user.repository.js';
import { gameRepository } from '../services/games/game.repository.js';
import { ratingRepository } from '../services/ratings/rating.repository.js';
import { friendshipRepository } from '../services/social/friendship.repository.js';
import {
  isValidFen,
  isValidTimeControl,
  isValidUciMove,
  isValidGameResult,
  isValidTerminationReason,
} from '../utils/validation.js';
import { GameType, GameResultStatus, TerminationReason, RatingCategory, FriendshipStatus } from '@prisma/client';

describe('ChessNova Phase 4 — PostgreSQL & Prisma Data Layer', () => {
  describe('Backend Validation Utilities', () => {
    it('validates standard chess FEN strings', () => {
      expect(
        isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      ).toBe(true);
      expect(
        isValidFen('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2')
      ).toBe(true);
      expect(isValidFen('invalid fen string')).toBe(false);
      expect(isValidFen('')).toBe(false);
      expect(isValidFen('8/8/8/8/8/8/8 w - - 0 1')).toBe(false); // Only 7 ranks
    });

    it('validates time control formats', () => {
      expect(isValidTimeControl('5+3')).toBe(true);
      expect(isValidTimeControl('1+0')).toBe(true);
      expect(isValidTimeControl('10+5')).toBe(true);
      expect(isValidTimeControl('invalid')).toBe(false);
      expect(isValidTimeControl('5-3')).toBe(false);
    });

    it('validates UCI move format', () => {
      expect(isValidUciMove('e2e4')).toBe(true);
      expect(isValidUciMove('g1f3')).toBe(true);
      expect(isValidUciMove('e7e8q')).toBe(true); // Promotion
      expect(isValidUciMove('e4')).toBe(false);
      expect(isValidUciMove('invalid')).toBe(false);
    });

    it('validates GameResultStatus enum values', () => {
      expect(isValidGameResult('WHITE_WIN')).toBe(true);
      expect(isValidGameResult('BLACK_WIN')).toBe(true);
      expect(isValidGameResult('DRAW')).toBe(true);
      expect(isValidGameResult('ONGOING')).toBe(true);
      expect(isValidGameResult('CHECKMATE')).toBe(false);
    });

    it('validates TerminationReason enum values', () => {
      expect(isValidTerminationReason('CHECKMATE')).toBe(true);
      expect(isValidTerminationReason('TIMEOUT')).toBe(true);
      expect(isValidTerminationReason('RESIGNATION')).toBe(true);
      expect(isValidTerminationReason('STALEMATE')).toBe(true);
      expect(isValidTerminationReason('INVALID_REASON')).toBe(false);
    });
  });

  describe('User & UserSettings Repository', () => {
    it('creates a user with default settings via Prisma client', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        username: 'magnus_nova',
        email: 'magnus@chessnova.local',
        passwordHash: 'hashed_pwd_123',
        displayName: 'Magnus Nova',
        avatarUrl: null,
        country: 'NO',
        bio: 'Chess enthusiast',
        isActive: true,
        lastSeenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          id: 'settings-uuid-1',
          userId: 'user-uuid-1',
          theme: 'dark',
          boardTheme: 'classic',
          pieceSet: 'classic',
          soundEnabled: true,
          animationEnabled: true,
          showLegalMoves: true,
          showCoordinates: true,
          highlightLastMove: true,
          confirmMoves: false,
          autoQueen: false,
          animationSpeed: 'normal',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);

      const user = await userRepository.createUser({
        username: 'magnus_nova',
        email: 'magnus@chessnova.local',
        passwordHash: 'hashed_pwd_123',
        displayName: 'Magnus Nova',
      });

      expect(user.username).toBe('magnus_nova');
      expect(user.email).toBe('magnus@chessnova.local');
      expect(user.settings?.theme).toBe('dark');
    });

    it('finds user by unique ID or username', async () => {
      const mockUser = {
        id: 'user-uuid-2',
        username: 'hikaru_nova',
        email: 'hikaru@chessnova.local',
      };

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const userById = await userRepository.findUserById('user-uuid-2');
      expect(userById?.username).toBe('hikaru_nova');

      const userByName = await userRepository.findUserByUsername('hikaru_nova');
      expect(userByName?.id).toBe('user-uuid-2');
    });
  });

  describe('Game & Move Repository', () => {
    it('creates a game record with default parameters', async () => {
      const mockGame = {
        id: 'game-uuid-1',
        whitePlayerId: 'user-1',
        blackPlayerId: 'user-2',
        gameType: GameType.LOCAL,
        timeControl: '5+3',
        initialTime: 300,
        increment: 3,
        rated: false,
        initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        finalFen: null,
        result: GameResultStatus.ONGOING,
        terminationReason: null,
        pgn: null,
        startedAt: new Date(),
        endedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.game, 'create').mockResolvedValue(mockGame as any);

      const game = await gameRepository.createGame({
        whitePlayerId: 'user-1',
        blackPlayerId: 'user-2',
        timeControl: '5+3',
      });

      expect(game.id).toBe('game-uuid-1');
      expect(game.gameType).toBe(GameType.LOCAL);
      expect(game.result).toBe(GameResultStatus.ONGOING);
    });

    it('adds batch moves and updates game result', async () => {
      const mockBatch = { count: 4 };
      vi.spyOn(prisma.move, 'createMany').mockResolvedValue(mockBatch);

      const batchResult = await gameRepository.addMovesBatch('game-uuid-1', [
        { moveNumber: 1, ply: 1, color: 'w', from: 'e2', to: 'e4', san: 'e4', uci: 'e2e4', fen: 'fen1' },
        { moveNumber: 1, ply: 2, color: 'b', from: 'e7', to: 'e5', san: 'e5', uci: 'e7e5', fen: 'fen2' },
      ]);

      expect(batchResult.count).toBe(4);

      const mockUpdatedGame = {
        id: 'game-uuid-1',
        result: GameResultStatus.WHITE_WIN,
        terminationReason: TerminationReason.CHECKMATE,
      };

      vi.spyOn(prisma.game, 'update').mockResolvedValue(mockUpdatedGame as any);

      const updated = await gameRepository.updateGameResult(
        'game-uuid-1',
        GameResultStatus.WHITE_WIN,
        TerminationReason.CHECKMATE
      );

      expect(updated.result).toBe(GameResultStatus.WHITE_WIN);
      expect(updated.terminationReason).toBe(TerminationReason.CHECKMATE);
    });
  });

  describe('Rating Repository', () => {
    it('upserts category rating and retrieves rating for a user', async () => {
      const mockRating = {
        id: 'rating-uuid-1',
        userId: 'user-1',
        category: RatingCategory.BLITZ,
        rating: 1600,
        gamesPlayed: 5,
        wins: 3,
        losses: 2,
        draws: 0,
      };

      vi.spyOn(prisma.rating, 'upsert').mockResolvedValue(mockRating as any);

      const rating = await ratingRepository.upsertRating(
        'user-1',
        RatingCategory.BLITZ,
        1600
      );

      expect(rating.rating).toBe(1600);
      expect(rating.category).toBe(RatingCategory.BLITZ);
    });
  });

  describe('Friendship Repository', () => {
    it('creates and finds friendship relation between users', async () => {
      const mockFriendship = {
        id: 'friendship-uuid-1',
        requesterId: 'user-1',
        receiverId: 'user-2',
        status: FriendshipStatus.PENDING,
      };

      vi.spyOn(prisma.friendship, 'create').mockResolvedValue(mockFriendship as any);

      const req = await friendshipRepository.createRequest('user-1', 'user-2');
      expect(req.status).toBe(FriendshipStatus.PENDING);
      expect(req.requesterId).toBe('user-1');
    });
  });

  describe('Health API & Database Connectivity', () => {
    it('GET /api/health reports service status and database state', async () => {
      const app = createApp();
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('chessnova-api');
      expect(['connected', 'disconnected']).toContain(response.body.database);
    });
  });
});
