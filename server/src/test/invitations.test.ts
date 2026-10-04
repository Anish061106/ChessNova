import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invitationService } from '../services/invitations/invitationService.js';
import { prisma } from '../services/database/prisma.js';
import { InvitationStatus } from '@prisma/client';
import { PlayerInfo } from '../types/game.js';

import { gameRepository } from '../services/games/game.repository.js';
import { GameType } from '@prisma/client';

import { gameManager } from '../services/games/gameManager.js';

describe('ChessNova Phase 7 — Game Invitations System Suite', () => {
  const sender: PlayerInfo = {
    id: 'user-sender-1',
    username: 'SenderGM',
    displayName: 'Sender GM',
    avatarUrl: null,
  };

  const receiver: PlayerInfo = {
    id: 'user-receiver-2',
    username: 'ReceiverTactician',
    displayName: 'Receiver Tactician',
    avatarUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    gameManager.clearAllGames();


    vi.spyOn(gameRepository, 'createGame').mockResolvedValue({
      id: 'game-invitation-test-123',
      whitePlayerId: sender.id,
      blackPlayerId: receiver.id,
      gameType: GameType.ONLINE,
      timeControl: '5+3',
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
    });
  });


  describe('Sending Invitations', () => {
    it('sends a game challenge successfully when valid', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: receiver.id,
        username: receiver.username,
        displayName: receiver.displayName,
        avatarUrl: null,
        isActive: true,
      } as any);

      vi.spyOn(prisma.gameInvitation, 'findFirst').mockResolvedValue(null);

      const createdInvitation = {
        id: 'inv-123',
        senderId: sender.id,
        receiverId: receiver.id,
        timeControl: '5+3',
        rated: false,
        status: InvitationStatus.PENDING,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        sender,
        receiver,
      };

      vi.spyOn(prisma.gameInvitation, 'create').mockResolvedValue(createdInvitation as any);
      vi.spyOn(prisma.notification, 'create').mockResolvedValue({} as any);

      const result = await invitationService.sendInvitation(sender, receiver.id, '5+3');

      expect(result.id).toBe('inv-123');
      expect(result.status).toBe(InvitationStatus.PENDING);
      expect(result.timeControl).toBe('5+3');
    });

    it('rejects self-invitation attempt', async () => {
      await expect(
        invitationService.sendInvitation(sender, sender.id, '5+3')
      ).rejects.toThrow(/cannot challenge yourself/i);
    });

    it('rejects duplicate pending invitation between same players', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: receiver.id,
        isActive: true,
      } as any);

      vi.spyOn(prisma.gameInvitation, 'findFirst').mockResolvedValue({
        id: 'existing-inv',
        status: InvitationStatus.PENDING,
      } as any);

      await expect(
        invitationService.sendInvitation(sender, receiver.id, '5+3')
      ).rejects.toThrow(/already have a pending invitation/i);
    });
  });

  describe('Accepting, Declining & Cancelling Invitations', () => {
    it('accepts a pending invitation and generates an active game session', async () => {
      const mockPendingInv = {
        id: 'inv-to-accept',
        senderId: sender.id,
        receiverId: receiver.id,
        timeControl: '5+3',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 100000),
        sender,
        receiver,
      };

      vi.spyOn(prisma.gameInvitation, 'findUnique').mockResolvedValue(mockPendingInv as any);
      vi.spyOn(prisma.gameInvitation, 'update').mockResolvedValue({
        ...mockPendingInv,
        status: InvitationStatus.ACCEPTED,
      } as any);

      const result = await invitationService.acceptInvitation('inv-to-accept', receiver);

      expect(result.gameId).toBeDefined();
      expect(result.timeControl).toBe('5+3');
      expect(result.invitation.status).toBe(InvitationStatus.ACCEPTED);
      expect([result.whitePlayer.id, result.blackPlayer.id]).toContain(sender.id);
      expect([result.whitePlayer.id, result.blackPlayer.id]).toContain(receiver.id);
    });

    it('declines a pending invitation', async () => {
      const mockPendingInv = {
        id: 'inv-to-decline',
        senderId: sender.id,
        receiverId: receiver.id,
        status: InvitationStatus.PENDING,
      };

      vi.spyOn(prisma.gameInvitation, 'findUnique').mockResolvedValue(mockPendingInv as any);
      vi.spyOn(prisma.gameInvitation, 'update').mockResolvedValue({
        ...mockPendingInv,
        status: InvitationStatus.DECLINED,
        sender,
        receiver,
      } as any);

      const result = await invitationService.declineInvitation('inv-to-decline', receiver.id);
      expect(result.status).toBe(InvitationStatus.DECLINED);
    });

    it('cancels a pending invitation by sender', async () => {
      const mockPendingInv = {
        id: 'inv-to-cancel',
        senderId: sender.id,
        receiverId: receiver.id,
        status: InvitationStatus.PENDING,
      };

      vi.spyOn(prisma.gameInvitation, 'findUnique').mockResolvedValue(mockPendingInv as any);
      vi.spyOn(prisma.gameInvitation, 'update').mockResolvedValue({
        ...mockPendingInv,
        status: InvitationStatus.CANCELLED,
        sender,
        receiver,
      } as any);

      const result = await invitationService.cancelInvitation('inv-to-cancel', sender.id);
      expect(result.status).toBe(InvitationStatus.CANCELLED);
    });

    it('rejects accepting an expired invitation', async () => {
      const expiredInv = {
        id: 'inv-expired',
        senderId: sender.id,
        receiverId: receiver.id,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() - 10000), // Expired in past
        sender,
        receiver,
      };

      vi.spyOn(prisma.gameInvitation, 'findUnique').mockResolvedValue(expiredInv as any);
      vi.spyOn(prisma.gameInvitation, 'update').mockResolvedValue({} as any);

      await expect(
        invitationService.acceptInvitation('inv-expired', receiver)
      ).rejects.toThrow(/expired/i);
    });
  });

  describe('User Search for Challenges', () => {
    it('returns matching users excluding the current user', async () => {
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([
        {
          id: 'user-3',
          username: 'ChessPlayer99',
          displayName: 'Chess Player',
          avatarUrl: null,
        },
      ] as any);

      const users = await invitationService.searchUsers('Player', sender.id);
      expect(users).toHaveLength(1);
      expect(users[0].username).toBe('ChessPlayer99');
    });

    it('returns empty array for short search queries', async () => {
      const users = await invitationService.searchUsers('a', sender.id);
      expect(users).toEqual([]);
    });
  });
});
