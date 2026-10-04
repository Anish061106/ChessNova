import { prisma } from '../database/prisma.js';
import { Rating, RatingHistory, RatingCategory } from '@prisma/client';

export class RatingRepository {
  /**
   * Get rating for user in a specific category (e.g. Blitz)
   */
  async getRating(
    userId: string,
    category: RatingCategory
  ): Promise<Rating | null> {
    return prisma.rating.findUnique({
      where: {
        userId_category: {
          userId,
          category,
        },
      },
    });
  }

  /**
   * Get all category ratings for a user
   */
  async getRatingsForUser(userId: string): Promise<Rating[]> {
    return prisma.rating.findMany({
      where: { userId },
    });
  }

  /**
   * Create or update a user rating
   */
  async upsertRating(
    userId: string,
    category: RatingCategory,
    ratingValue: number
  ): Promise<Rating> {
    return prisma.rating.upsert({
      where: {
        userId_category: {
          userId,
          category,
        },
      },
      update: {
        rating: ratingValue,
      },
      create: {
        userId,
        category,
        rating: ratingValue,
      },
    });
  }

  /**
   * Record rating history entry
   */
  async recordRatingHistory(
    userId: string,
    category: RatingCategory,
    ratingBefore: number,
    ratingChange: number,
    ratingAfter: number,
    gameId?: string
  ): Promise<RatingHistory> {
    return prisma.ratingHistory.create({
      data: {
        userId,
        category,
        ratingBefore,
        ratingChange,
        ratingAfter,
        gameId,
      },
    });
  }
}

export const ratingRepository = new RatingRepository();
