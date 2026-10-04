import { prisma } from '../database/prisma.js';
import { FriendshipStatus, NotificationType } from '@prisma/client';
import { logger } from '../../utils/logger.js';

export interface UserSummary {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  createdAt: Date;
}

export class FriendService {
  /**
   * Search users safely for friend requests (excluding requesting user)
   */
  async searchUsers(query: string, currentUserId: string, limit = 15): Promise<UserSummary[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.trim();

    try {
      const users = await prisma.user.findMany({
        where: {
          id: { not: currentUserId },
          isActive: true,
          OR: [
            { username: { contains: cleanQuery, mode: 'insensitive' } },
            { displayName: { contains: cleanQuery, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          country: true,
          createdAt: true,
        },
        take: Math.min(limit, 30),
      });

      return users;
    } catch {
      return [];
    }
  }

  /**
   * List all accepted friends for a user
   */
  async getFriendsList(userId: string) {
    try {
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [{ requesterId: userId }, { receiverId: userId }],
          status: FriendshipStatus.ACCEPTED,
        },
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              country: true,
              lastSeenAt: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              country: true,
              lastSeenAt: true,
            },
          },
        },
      });

      return friendships.map((f: any) => {
        const friend = f.requesterId === userId ? f.receiver : f.requester;
        return {
          friendshipId: f.id,
          friend,
          friendsSince: f.updatedAt,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * List pending friend requests (both incoming and sent)
   */
  async getPendingRequests(userId: string) {
    try {
      const [incoming, outgoing] = await Promise.all([
        prisma.friendship.findMany({
          where: {
            receiverId: userId,
            status: FriendshipStatus.PENDING,
          },
          include: {
            requester: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                country: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.friendship.findMany({
          where: {
            requesterId: userId,
            status: FriendshipStatus.PENDING,
          },
          include: {
            receiver: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                country: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return { incoming, outgoing };
    } catch {
      return { incoming: [], outgoing: [] };
    }
  }

  /**
   * Send a friend request
   */
  async sendRequest(requesterId: string, receiverId: string) {
    if (requesterId === receiverId) {
      throw new Error('You cannot send a friend request to yourself');
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, username: true, isActive: true },
    });

    if (!receiver || !receiver.isActive) {
      throw new Error('User not found');
    }

    // Check existing relationship in either direction
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new Error('You are already friends with this user');
      }
      if (existing.status === FriendshipStatus.PENDING) {
        if (existing.requesterId === requesterId) {
          throw new Error('Friend request already sent');
        } else {
          // If the other person already sent a request, auto-accept it!
          return this.acceptRequest(existing.id, requesterId);
        }
      }
      if (existing.status === FriendshipStatus.BLOCKED) {
        throw new Error('Unable to send friend request');
      }
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId,
        receiverId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    // Create Notification for receiver
    try {
      await prisma.notification.create({
        data: {
          userId: receiverId,
          type: NotificationType.FRIEND_REQUEST,
          title: 'Friend Request',
          message: `${friendship.requester.displayName || friendship.requester.username} sent you a friend request`,
        },
      });
    } catch (err) {
      logger.warn('[FriendService] Could not create notification:', err);
    }

    return friendship;
  }

  /**
   * Accept a friend request
   */
  async acceptRequest(friendshipId: string, currentUserId: string) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      include: {
        requester: { select: { id: true, username: true, displayName: true } },
        receiver: { select: { id: true, username: true, displayName: true } },
      },
    });

    if (!friendship) {
      throw new Error('Friend request not found');
    }

    if (friendship.receiverId !== currentUserId && friendship.requesterId !== currentUserId) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.ACCEPTED },
      include: {
        requester: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    // Create Notification for original requester
    try {
      const recipientId = friendship.requesterId === currentUserId ? friendship.receiverId : friendship.requesterId;
      const accepter = friendship.requesterId === currentUserId ? friendship.requester : friendship.receiver;

      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: NotificationType.FRIEND_ACCEPTED,
          title: 'Friend Request Accepted',
          message: `${accepter.displayName || accepter.username} accepted your friend request`,
        },
      });
    } catch (err) {
      logger.warn('[FriendService] Notification error:', err);
    }

    return updated;
  }

  /**
   * Decline a friend request
   */
  async declineRequest(friendshipId: string, currentUserId: string) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new Error('Friend request not found');
    }

    if (friendship.receiverId !== currentUserId && friendship.requesterId !== currentUserId) {
      throw new Error('Unauthorized');
    }

    return prisma.friendship.delete({
      where: { id: friendshipId },
    });
  }

  /**
   * Remove an existing friend
   */
  async removeFriend(friendshipId: string, currentUserId: string) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new Error('Friendship not found');
    }

    if (friendship.requesterId !== currentUserId && friendship.receiverId !== currentUserId) {
      throw new Error('Unauthorized');
    }

    return prisma.friendship.delete({
      where: { id: friendshipId },
    });
  }

  /**
   * Block a user
   */
  async blockUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new Error('Cannot block yourself');
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: currentUserId },
        ],
      },
    });

    if (existing) {
      return prisma.friendship.update({
        where: { id: existing.id },
        data: {
          requesterId: currentUserId,
          receiverId: targetUserId,
          status: FriendshipStatus.BLOCKED,
        },
      });
    }

    return prisma.friendship.create({
      data: {
        requesterId: currentUserId,
        receiverId: targetUserId,
        status: FriendshipStatus.BLOCKED,
      },
    });
  }
}

export const friendService = new FriendService();
