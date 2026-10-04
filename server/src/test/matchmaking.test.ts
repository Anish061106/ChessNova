import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchmakingService } from '../services/matchmaking/matchmakingService.js';
import { matchmakingStore } from '../services/matchmaking/matchmakingStore.js';
import { prisma } from '../services/database/prisma.js';
import { GameType } from '@prisma/client';
import { PlayerInfo } from '../types/game.js';

import { gameRepository } from '../services/games/game.repository.js';

import { gameManager } from '../services/games/gameManager.js';

describe('ChessNova Phase 7 — Matchmaking System Suite', () => {
  const playerA: PlayerInfo = {
    id: 'user-match-1',
    username: 'MagnusNova',
    displayName: 'Magnus',
  };

  const playerB: PlayerInfo = {
    id: 'user-match-2',
    username: 'HikaruNova',
    displayName: 'Hikaru',
  };

  const playerC: PlayerInfo = {
    id: 'user-match-3',
    username: 'AnishNova',
    displayName: 'Anish',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    matchmakingStore.clear();
    gameManager.clearAllGames();


    vi.spyOn(gameRepository, 'createGame').mockImplementation(async (args: any) => ({
      id: 'game-matched-test-123',
      whitePlayerId: args.whitePlayerId,
      blackPlayerId: args.blackPlayerId,
      gameType: GameType.ONLINE,
      timeControl: args.timeControl || '5+3',
      initialTime: 300,
      increment: 3,
      rated: false,
      initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      finalFen: null,
      result: 'ONGOING' as any,
      terminationReason: null,
      pgn: null,
      startedAt: new Date(),
      endedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  describe('Queue Management', () => {
    it('allows an authenticated user to join matchmaking queue', async () => {
      const result = await matchmakingService.joinQueue(playerA, 'socket-1', '5+3');

      expect(result.matched).toBe(false);
      expect(result.queueEntry).toBeDefined();
      expect(result.queueEntry?.userId).toBe(playerA.id);
      expect(result.queueEntry?.timeControl).toBe('5+3');

      const status = matchmakingService.getStatus(playerA.id);
      expect(status.inQueue).toBe(true);
      expect(status.timeControl).toBe('5+3');
    });

    it('cancels active matchmaking search', async () => {
      await matchmakingService.joinQueue(playerA, 'socket-1', '5+3');
      expect(matchmakingService.getStatus(playerA.id).inQueue).toBe(true);

      const cancelled = matchmakingService.cancelQueue(playerA.id);
      expect(cancelled).toBe(true);
      expect(matchmakingService.getStatus(playerA.id).inQueue).toBe(false);
    });

    it('cleans up queue entry on socket disconnection', async () => {
      await matchmakingService.joinQueue(playerA, 'socket-1', '5+3');
      expect(matchmakingStore.getQueueLength('5+3')).toBe(1);

      const cleaned = matchmakingService.handleDisconnect('socket-1');
      expect(cleaned?.userId).toBe(playerA.id);
      expect(matchmakingStore.getQueueLength('5+3')).toBe(0);
    });

    it('rejects invalid time control configurations', async () => {
      await expect(
        matchmakingService.joinQueue(playerA, 'socket-1', '99+99')
      ).rejects.toThrow(/Invalid time control/i);
    });
  });

  describe('Player Matching & Game Creation', () => {
    it('matches two players waiting for the exact same time control', async () => {
      // 1. Player A joins 5+3
      const resA = await matchmakingService.joinQueue(playerA, 'socket-a', '5+3');
      expect(resA.matched).toBe(false);

      // 2. Player B joins 5+3 -> Match created!
      const resB = await matchmakingService.joinQueue(playerB, 'socket-b', '5+3');
      expect(resB.matched).toBe(true);
      expect(resB.gameId).toBeDefined();
      expect(resB.timeControl).toBe('5+3');

      // Both players should be assigned distinct colors (one white, one black)
      const playerIds = [resB.whitePlayer?.id, resB.blackPlayer?.id];
      expect(playerIds).toContain(playerA.id);
      expect(playerIds).toContain(playerB.id);
      expect(resB.whitePlayer?.id).not.toBe(resB.blackPlayer?.id);

      // Both players should now be removed from queue
      expect(matchmakingService.getStatus(playerA.id).inQueue).toBe(false);
      expect(matchmakingService.getStatus(playerB.id).inQueue).toBe(false);
    });

    it('does not match players queued for different time controls', async () => {
      // Player A joins 5+3
      const resA = await matchmakingService.joinQueue(playerA, 'socket-a', '5+3');
      expect(resA.matched).toBe(false);

      // Player B joins 10+0
      const resB = await matchmakingService.joinQueue(playerB, 'socket-b', '10+0');
      expect(resB.matched).toBe(false);

      expect(matchmakingStore.getQueueLength('5+3')).toBe(1);
      expect(matchmakingStore.getQueueLength('10+0')).toBe(1);
    });

    it('handles 3-player queue with FIFO pairing (first two match, third remains waiting)', async () => {
      await matchmakingService.joinQueue(playerA, 'socket-a', '3+0');
      await matchmakingService.joinQueue(playerB, 'socket-b', '3+0');

      // Player A & B matched; now Player C enters queue
      const resC = await matchmakingService.joinQueue(playerC, 'socket-c', '3+0');
      expect(resC.matched).toBe(false);
      expect(matchmakingService.getStatus(playerC.id).inQueue).toBe(true);
      expect(matchmakingStore.getQueueLength('3+0')).toBe(1);
    });
  });
});
