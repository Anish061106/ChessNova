import { InvitationStatus, NotificationType } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import { PlayerInfo } from '../../types/game.js';
import { GameInvitationDto } from '../../types/invitation.js';
import { isValidTimeControl } from '../../types/timeControl.js';
import { gameManager } from '../games/gameManager.js';
import { logger } from '../../utils/logger.js';

const INVITATION_EXPIRY_MINUTES = parseInt(process.env.GAME_INVITATION_EXPIRY_MINUTES || '5', 10);

export class InvitationService {
  /**
   * Send a game invitation to another user
   */
  async sendInvitation(
    sender: PlayerInfo,
    receiverId: string,
    timeControl = '5+3'
  ): Promise<GameInvitationDto> {
    if (sender.id === receiverId) {
      throw new Error('You cannot challenge yourself');
    }

    if (!isValidTimeControl(timeControl)) {
      throw new Error(`Invalid time control: ${timeControl}`);
    }

    // Check receiver exists and is active
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, username: true, displayName: true, avatarUrl: true, isActive: true },
    });

    if (!receiver || !receiver.isActive) {
      throw new Error('Opponent user account was not found or is inactive');
    }

    // Check for existing pending invitation between same sender and receiver
    const existingPending = await prisma.gameInvitation.findFirst({
      where: {
        senderId: sender.id,
        receiverId,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingPending) {
      throw new Error('You already have a pending invitation with this player');
    }

    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MINUTES * 60 * 1000);

    // Create Invitation and Notification atomically
    const invitation = await prisma.gameInvitation.create({
      data: {
        senderId: sender.id,
        receiverId,
        timeControl,
        rated: false,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    // Create Notification record for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: NotificationType.GAME_INVITATION,
        title: 'New Chess Challenge',
        message: `${sender.displayName || sender.username} challenged you to an online ${timeControl} game.`,
      },
    }).catch((err) => {
      logger.warn('[InvitationService] Failed to create notification record:', err);
    });

    logger.info(
      `[InvitationService] Challenge sent: ${sender.username} -> ${receiver.username} (${timeControl})`
    );

    return this.mapToDto(invitation);
  }

  /**
   * Accept an invitation and start game
   */
  async acceptInvitation(
    invitationId: string,
    receiver: PlayerInfo
  ): Promise<{
    gameId: string;
    whitePlayer: PlayerInfo;
    blackPlayer: PlayerInfo;
    timeControl: string;
    invitation: GameInvitationDto;
  }> {
    const invitation = await prisma.gameInvitation.findUnique({
      where: { id: invitationId },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.receiverId !== receiver.id) {
      throw new Error('You are not authorized to accept this invitation');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error(`Invitation is no longer pending (current status: ${invitation.status})`);
    }

    const now = new Date();
    if (invitation.expiresAt <= now) {
      await prisma.gameInvitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new Error('This invitation has expired');
    }

    // Atomic update status to ACCEPTED
    const updatedInvitation = await prisma.gameInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.ACCEPTED },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    // Randomize colors
    const isSenderWhite = Math.random() < 0.5;
    const senderPlayer: PlayerInfo = {
      id: updatedInvitation.sender.id,
      username: updatedInvitation.sender.username,
      displayName: updatedInvitation.sender.displayName,
      avatarUrl: updatedInvitation.sender.avatarUrl,
    };

    const whitePlayer = isSenderWhite ? senderPlayer : receiver;
    const blackPlayer = isSenderWhite ? receiver : senderPlayer;

    // Create active online game via GameManager
    const activeGame = await gameManager.createMatchedGame(
      whitePlayer,
      blackPlayer,
      updatedInvitation.timeControl
    );

    logger.info(
      `[InvitationService] Challenge accepted: Game ${activeGame.gameId} created (${whitePlayer.username} [W] vs ${blackPlayer.username} [B])`
    );

    return {
      gameId: activeGame.gameId,
      whitePlayer,
      blackPlayer,
      timeControl: updatedInvitation.timeControl,
      invitation: this.mapToDto(updatedInvitation),
    };
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(invitationId: string, receiverId: string): Promise<GameInvitationDto> {
    const invitation = await prisma.gameInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) throw new Error('Invitation not found');
    if (invitation.receiverId !== receiverId) throw new Error('Unauthorized');
    if (invitation.status !== InvitationStatus.PENDING) throw new Error('Invitation is not pending');

    const updated = await prisma.gameInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.DECLINED },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    logger.info(`[InvitationService] Challenge ${invitationId} declined by receiver`);
    return this.mapToDto(updated);
  }

  /**
   * Cancel an outgoing invitation (sender only)
   */
  async cancelInvitation(invitationId: string, senderId: string): Promise<GameInvitationDto> {
    const invitation = await prisma.gameInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) throw new Error('Invitation not found');
    if (invitation.senderId !== senderId) throw new Error('Unauthorized');
    if (invitation.status !== InvitationStatus.PENDING) throw new Error('Invitation is not pending');

    const updated = await prisma.gameInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.CANCELLED },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    logger.info(`[InvitationService] Challenge ${invitationId} cancelled by sender`);
    return this.mapToDto(updated);
  }

  /**
   * Get all incoming and outgoing invitations for a user
   */
  async getUserInvitations(userId: string): Promise<{
    incoming: GameInvitationDto[];
    outgoing: GameInvitationDto[];
  }> {
    // Auto-expire outdated pending invitations
    await prisma.gameInvitation.updateMany({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: { lte: new Date() },
      },
      data: { status: InvitationStatus.EXPIRED },
    });

    const [incoming, outgoing] = await Promise.all([
      prisma.gameInvitation.findMany({
        where: { receiverId: userId },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.gameInvitation.findMany({
        where: { senderId: userId },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      incoming: incoming.map((i) => this.mapToDto(i)),
      outgoing: outgoing.map((i) => this.mapToDto(i)),
    };
  }

  /**
   * Search users for challenging
   */
  async searchUsers(query: string, currentUserId: string): Promise<PlayerInfo[]> {
    if (!query || query.trim().length < 2) return [];

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        isActive: true,
        OR: [
          { username: { contains: query.trim(), mode: 'insensitive' } },
          { displayName: { contains: query.trim(), mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
      take: 8,
    });

    return users;
  }

  private mapToDto(invitation: any): GameInvitationDto {
    return {
      id: invitation.id,
      senderId: invitation.senderId,
      receiverId: invitation.receiverId,
      sender: invitation.sender,
      receiver: invitation.receiver,
      timeControl: invitation.timeControl,
      rated: invitation.rated,
      status: invitation.status,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
    };
  }
}

export const invitationService = new InvitationService();
