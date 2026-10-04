import { describe, it, expect, vi, beforeEach } from 'vitest';
import { puzzleService } from '../services/puzzles/puzzleService.js';
import { friendService } from '../services/social/friendService.js';
import { chatService } from '../services/chat/chatService.js';
import { prisma } from '../services/database/prisma.js';
import { FriendshipStatus } from '@prisma/client';

describe('ChessNova Phase 13 — Puzzles, Friends & Real-Time Chat Suite (Server)', () => {
  describe('1. Chess Puzzles Service & Validation Invariants', () => {
    it('returns filtered puzzles by difficulty and themes correctly', async () => {
      const easyPuzzles = await puzzleService.listPuzzles({ difficulty: 'easy' });
      expect(easyPuzzles.puzzles.length).toBeGreaterThan(0);
      expect(easyPuzzles.puzzles.every((p) => p.difficulty === 'easy')).toBe(true);

      const forkPuzzles = await puzzleService.listPuzzles({ theme: 'Fork' });
      expect(forkPuzzles.puzzles.length).toBeGreaterThan(0);
      expect(forkPuzzles.puzzles.some((p) => p.themes.includes('Fork'))).toBe(true);
    });

    it('validates correct move and returns automatic opponent response', async () => {
      // Puzzle puz-101: solution is ["c4f7", "e8f7", "d3e4"]
      const step1 = await puzzleService.validateMove('puz-101', 'c4f7', 0);
      expect(step1.isCorrect).toBe(true);
      expect(step1.isComplete).toBe(false);
      expect(step1.opponentResponseUci).toBe('e8f7');
      expect(step1.nextExpectedMoveIndex).toBe(2);

      // Final move
      const step2 = await puzzleService.validateMove('puz-101', 'd3e4', 2);
      expect(step2.isCorrect).toBe(true);
      expect(step2.isComplete).toBe(true);
    });

    it('rejects incorrect move without corrupting puzzle state', async () => {
      const invalidStep = await puzzleService.validateMove('puz-101', 'e2e4', 0);
      expect(invalidStep.isCorrect).toBe(false);
      expect(invalidStep.isComplete).toBe(false);
    });
  });

  describe('2. Friends & Social System', () => {
    it('safely searches users without exposing passwordHash or email', async () => {
      vi.spyOn(prisma.user, 'findMany').mockResolvedValueOnce([
        {
          id: 'u-2',
          username: 'Hikaru',
          displayName: 'Hikaru Nakamura',
          avatarUrl: 'https://avatar.png',
          country: 'US',
          createdAt: new Date(),
        } as any,
      ]);

      const results = await friendService.searchUsers('Hikaru', 'u-1');
      expect(results.length).toBe(1);
      expect(results[0].username).toBe('Hikaru');
      expect((results[0] as any).passwordHash).toBeUndefined();
      expect((results[0] as any).email).toBeUndefined();
    });

    it('prevents sending a friend request to oneself', async () => {
      await expect(friendService.sendRequest('user-1', 'user-1')).rejects.toThrow(
        'You cannot send a friend request to yourself'
      );
    });

    it('prevents duplicate active friendships', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'user-2',
        username: 'Magnus',
        isActive: true,
      } as any);

      vi.spyOn(prisma.friendship, 'findFirst').mockResolvedValueOnce({
        id: 'f-1',
        requesterId: 'user-1',
        receiverId: 'user-2',
        status: FriendshipStatus.ACCEPTED,
      } as any);

      await expect(friendService.sendRequest('user-1', 'user-2')).rejects.toThrow(
        'You are already friends with this user'
      );
    });
  });

  describe('3. Real-Time Game Chat Service', () => {
    it('rejects empty or whitespace-only messages', async () => {
      await expect(chatService.postMessage('game-1', 'user-1', '   ')).rejects.toThrow(
        'Message cannot be empty'
      );
    });

    it('trims and enforces max 500 characters limit on chat messages', async () => {
      vi.spyOn(prisma.game, 'findUnique').mockResolvedValueOnce({
        id: 'game-1',
        whitePlayerId: 'user-1',
        blackPlayerId: 'user-2',
      } as any);

      const createSpy = vi.spyOn(prisma.chatMessage, 'create').mockResolvedValueOnce({
        id: 'msg-1',
        gameId: 'game-1',
        senderId: 'user-1',
        message: 'A'.repeat(500),
        createdAt: new Date(),
        sender: {
          id: 'user-1',
          username: 'UserOne',
          displayName: 'User One',
          avatarUrl: null,
        },
      } as any);

      const longMessage = 'A'.repeat(600);
      const res = await chatService.postMessage('game-1', 'user-1', longMessage);

      expect(res.message.length).toBeLessThanOrEqual(500);
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          gameId: 'game-1',
          senderId: 'user-1',
          message: 'A'.repeat(500),
        },
        include: expect.any(Object),
      });
    });

    it('enforces chat rate limiting to protect against message flooding', async () => {
      vi.spyOn(prisma.game, 'findUnique').mockResolvedValue({
        id: 'game-1',
        whitePlayerId: 'flooder-1',
        blackPlayerId: 'user-2',
      } as any);

      vi.spyOn(prisma.chatMessage, 'create').mockResolvedValue({
        id: 'msg-flood',
        gameId: 'game-1',
        senderId: 'flooder-1',
        message: 'Spam',
        createdAt: new Date(),
        sender: { id: 'flooder-1', username: 'Flooder', displayName: null, avatarUrl: null },
      } as any);

      // Send 5 messages (allowed)
      for (let i = 0; i < 5; i++) {
        await chatService.postMessage('game-1', 'flooder-1', `Msg ${i}`);
      }

      // 6th message in same window should throw rate limit error
      await expect(chatService.postMessage('game-1', 'flooder-1', '6th message')).rejects.toThrow(
        'Chat rate limit exceeded'
      );
    });
  });
});
