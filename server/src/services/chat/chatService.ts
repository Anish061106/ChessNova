import { prisma } from '../database/prisma.js';
import { logger } from '../../utils/logger.js';

export interface ChatMessageDTO {
  id: string;
  gameId: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  message: string;
  createdAt: Date;
}

export class ChatService {
  // In-memory rate limiting map: userId -> timestamps array
  private rateLimitMap = new Map<string, number[]>();

  /**
   * Check rate limiting: max 5 messages per 3 seconds per user
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const timestamps = (this.rateLimitMap.get(userId) || []).filter((t) => now - t < 3000);
    if (timestamps.length >= 5) {
      return false;
    }
    timestamps.push(now);
    this.rateLimitMap.set(userId, timestamps);
    return true;
  }

  /**
   * Validates and sanitizes message content
   */
  private sanitizeMessage(text: string): string {
    if (!text || typeof text !== 'string') return '';
    // Trim and limit length to 500 characters
    return text.trim().slice(0, 500);
  }

  /**
   * Validates and persists a new game chat message
   */
  async postMessage(gameId: string, senderId: string, rawText: string): Promise<ChatMessageDTO> {
    const message = this.sanitizeMessage(rawText);
    if (message.length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (!this.checkRateLimit(senderId)) {
      throw new Error('Chat rate limit exceeded. Please wait a moment.');
    }

    // Verify game exists and sender is participant/spectator
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        whitePlayerId: true,
        blackPlayerId: true,
      },
    });

    if (!game) {
      throw new Error('Game session not found');
    }

    const chat = await prisma.chatMessage.create({
      data: {
        gameId,
        senderId,
        message,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: chat.id,
      gameId: chat.gameId,
      sender: {
        id: chat.sender.id,
        username: chat.sender.username,
        displayName: chat.sender.displayName,
        avatarUrl: chat.sender.avatarUrl,
      },
      message: chat.message,
      createdAt: chat.createdAt,
    };
  }

  /**
   * Load recent chat history for a game session
   */
  async getGameChatHistory(gameId: string, limit = 50): Promise<ChatMessageDTO[]> {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { gameId },
        take: Math.min(limit, 100),
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      return messages.map((m) => ({
        id: m.id,
        gameId: m.gameId,
        sender: {
          id: m.sender.id,
          username: m.sender.username,
          displayName: m.sender.displayName,
          avatarUrl: m.sender.avatarUrl,
        },
        message: m.message,
        createdAt: m.createdAt,
      }));
    } catch (err) {
      logger.warn('[ChatService] Error loading chat history:', err);
      return [];
    }
  }
}

export const chatService = new ChatService();
