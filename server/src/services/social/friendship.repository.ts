import { prisma } from '../database/prisma.js';
import { Friendship, FriendshipStatus } from '@prisma/client';

export class FriendshipRepository {
  /**
   * Create a friendship request
   */
  async createRequest(
    requesterId: string,
    receiverId: string
  ): Promise<Friendship> {
    return prisma.friendship.create({
      data: {
        requesterId,
        receiverId,
        status: FriendshipStatus.PENDING,
      },
    });
  }

  /**
   * Find existing friendship between two users
   */
  async findRelationship(
    userA: string,
    userB: string
  ): Promise<Friendship | null> {
    return prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userA, receiverId: userB },
          { requesterId: userB, receiverId: userA },
        ],
      },
    });
  }

  /**
   * Update friendship status (e.g. ACCEPTED, DECLINED, BLOCKED)
   */
  async updateStatus(
    id: string,
    status: FriendshipStatus
  ): Promise<Friendship> {
    return prisma.friendship.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * List accepted friends for a user
   */
  async listFriends(userId: string): Promise<Friendship[]> {
    return prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { receiverId: userId }],
        status: FriendshipStatus.ACCEPTED,
      },
      include: {
        requester: true,
        receiver: true,
      },
    });
  }
}

export const friendshipRepository = new FriendshipRepository();
