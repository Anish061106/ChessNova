import { RatingCategory, GameResultStatus } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import {
  DEFAULT_RATING,
  getRatingCategory,
  calculateEloChange,
} from '../../utils/ratingConfig.js';
import { logger } from '../../utils/logger.js';

export interface RatingChangeResult {
  category: RatingCategory;
  white: {
    userId: string;
    before: number;
    change: number;
    after: number;
  };
  black: {
    userId: string;
    before: number;
    change: number;
    after: number;
  };
}

export class RatingService {
  /**
   * Ensure user has rating records for all 4 standard categories
   */
  async getOrCreateRating(userId: string, category: RatingCategory, tx = prisma) {
    const existing = await tx.rating.findUnique({
      where: {
        userId_category: {
          userId,
          category,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return tx.rating.create({
      data: {
        userId,
        category,
        rating: DEFAULT_RATING,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      },
    });
  }

  /**
   * Process and persist Elo rating changes atomically upon completed rated game
   */
  async processCompletedRatedGame(gameId: string): Promise<RatingChangeResult | null> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    if (!game || !game.rated || !game.whitePlayerId || !game.blackPlayerId) {
      return null;
    }

    if (game.result === GameResultStatus.ONGOING) {
      return null;
    }

    // 1. Check idempotency: if RatingHistory already exists for this game, return existing
    const existingHistory = await prisma.ratingHistory.findMany({
      where: { gameId },
    });

    const category = getRatingCategory(game.timeControl);

    if (existingHistory.length >= 2) {
      const whiteHist = existingHistory.find((h) => h.userId === game.whitePlayerId);
      const blackHist = existingHistory.find((h) => h.userId === game.blackPlayerId);

      if (whiteHist && blackHist) {
        return {
          category,
          white: {
            userId: whiteHist.userId,
            before: whiteHist.ratingBefore,
            change: whiteHist.ratingChange,
            after: whiteHist.ratingAfter,
          },
          black: {
            userId: blackHist.userId,
            before: blackHist.ratingBefore,
            change: blackHist.ratingChange,
            after: blackHist.ratingAfter,
          },
        };
      }
    }

    // 2. Determine White's actual score (1 = win, 0.5 = draw, 0 = loss)
    let actualScoreWhite: number;
    if (game.result === GameResultStatus.WHITE_WIN) {
      actualScoreWhite = 1;
    } else if (game.result === GameResultStatus.BLACK_WIN) {
      actualScoreWhite = 0;
    } else {
      actualScoreWhite = 0.5;
    }

    const whiteId = game.whitePlayerId;
    const blackId = game.blackPlayerId;

    // 3. Atomically update ratings and history inside transaction
    return prisma.$transaction(async (tx) => {
      // Re-check idempotency inside transaction lock
      const checkHistory = await tx.ratingHistory.findFirst({
        where: { gameId },
      });
      if (checkHistory) {
        return null;
      }

      const whiteRatingRecord = await this.getOrCreateRating(whiteId, category, tx as any);
      const blackRatingRecord = await this.getOrCreateRating(blackId, category, tx as any);

      const { whiteChange, blackChange, newWhiteRating, newBlackRating } = calculateEloChange(
        whiteRatingRecord.rating,
        blackRatingRecord.rating,
        actualScoreWhite
      );

      // Update White Rating
      await tx.rating.update({
        where: { id: whiteRatingRecord.id },
        data: {
          rating: newWhiteRating,
          gamesPlayed: { increment: 1 },
          wins: { increment: actualScoreWhite === 1 ? 1 : 0 },
          losses: { increment: actualScoreWhite === 0 ? 1 : 0 },
          draws: { increment: actualScoreWhite === 0.5 ? 1 : 0 },
        },
      });

      // Update Black Rating
      await tx.rating.update({
        where: { id: blackRatingRecord.id },
        data: {
          rating: newBlackRating,
          gamesPlayed: { increment: 1 },
          wins: { increment: actualScoreWhite === 0 ? 1 : 0 },
          losses: { increment: actualScoreWhite === 1 ? 1 : 0 },
          draws: { increment: actualScoreWhite === 0.5 ? 1 : 0 },
        },
      });

      // Create White RatingHistory
      await tx.ratingHistory.create({
        data: {
          userId: whiteId,
          category,
          gameId,
          ratingBefore: whiteRatingRecord.rating,
          ratingChange: whiteChange,
          ratingAfter: newWhiteRating,
        },
      });

      // Create Black RatingHistory
      await tx.ratingHistory.create({
        data: {
          userId: blackId,
          category,
          gameId,
          ratingBefore: blackRatingRecord.rating,
          ratingChange: blackChange,
          ratingAfter: newBlackRating,
        },
      });

      logger.info(
        `[RatingService] Rated game ${gameId} finalized (${category}): White ${whiteRatingRecord.rating} -> ${newWhiteRating} (${whiteChange >= 0 ? '+' : ''}${whiteChange}), Black ${blackRatingRecord.rating} -> ${newBlackRating} (${blackChange >= 0 ? '+' : ''}${blackChange})`
      );

      return {
        category,
        white: {
          userId: whiteId,
          before: whiteRatingRecord.rating,
          change: whiteChange,
          after: newWhiteRating,
        },
        black: {
          userId: blackId,
          before: blackRatingRecord.rating,
          change: blackChange,
          after: newBlackRating,
        },
      };
    });
  }

  /**
   * Get user rating summary for all 4 categories
   */
  async getUserRatings(userId: string) {
    const categories: RatingCategory[] = [
      RatingCategory.BULLET,
      RatingCategory.BLITZ,
      RatingCategory.RAPID,
      RatingCategory.CLASSICAL,
    ];

    const records = await prisma.rating.findMany({
      where: { userId },
    });

    const map = new Map(records.map((r) => [r.category, r]));

    return categories.map((cat) => {
      const record = map.get(cat);
      return {
        category: cat,
        rating: record?.rating || DEFAULT_RATING,
        gamesPlayed: record?.gamesPlayed || 0,
        wins: record?.wins || 0,
        losses: record?.losses || 0,
        draws: record?.draws || 0,
      };
    });
  }

  /**
   * Get paginated rating history for a user
   */
  async getUserRatingHistory(
    userId: string,
    options: { category?: RatingCategory; page?: number; limit?: number } = {}
  ) {
    const { category, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (category) {
      where.category = category;
    }

    const [total, items] = await Promise.all([
      prisma.ratingHistory.count({ where }),
      prisma.ratingHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          game: {
            include: {
              whitePlayer: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
              blackPlayer: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        category: item.category,
        gameId: item.gameId,
        ratingBefore: item.ratingBefore,
        ratingChange: item.ratingChange,
        ratingAfter: item.ratingAfter,
        createdAt: item.createdAt,
        game: item.game
          ? {
              id: item.game.id,
              timeControl: item.game.timeControl,
              result: item.game.result,
              terminationReason: item.game.terminationReason,
              whitePlayer: item.game.whitePlayer,
              blackPlayer: item.game.blackPlayer,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get Leaderboard by RatingCategory with deterministic tie-breaking
   */
  async getLeaderboard(
    category: RatingCategory = RatingCategory.BLITZ,
    options: { page?: number; limit?: number; currentUserId?: string } = {}
  ) {
    const { page = 1, limit = 50, currentUserId } = options;
    const skip = (page - 1) * limit;

    const where = {
      category,
      user: {
        isActive: true,
      },
    };

    const [total, ratings] = await Promise.all([
      prisma.rating.count({ where }),
      prisma.rating.findMany({
        where,
        orderBy: [
          { rating: 'desc' },
          { gamesPlayed: 'desc' },
          { updatedAt: 'asc' },
          { id: 'asc' },
        ],
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              country: true,
            },
          },
        },
      }),
    ]);

    const items = ratings.map((r: any, idx: number) => {
      const winRate =
        r.gamesPlayed > 0 ? Math.round((r.wins / r.gamesPlayed) * 100) : 0;

      return {
        rank: skip + idx + 1,
        id: r.id,
        userId: r.userId,
        username: r.user.username,
        displayName: r.user.displayName,
        avatarUrl: r.user.avatarUrl,
        country: r.user.country,
        rating: r.rating,
        gamesPlayed: r.gamesPlayed,
        wins: r.wins,
        losses: r.losses,
        draws: r.draws,
        winRate,
      };
    });

    let currentUserRankInfo = null;

    if (currentUserId) {
      const userRating = await prisma.rating.findUnique({
        where: {
          userId_category: {
            userId: currentUserId,
            category,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              country: true,
            },
          },
        },
      });

      if (userRating) {
        // Count how many players rank higher deterministically
        const higherCount = await prisma.rating.count({
          where: {
            category,
            user: { isActive: true },
            OR: [
              { rating: { gt: userRating.rating } },
              {
                rating: userRating.rating,
                gamesPlayed: { gt: userRating.gamesPlayed },
              },
              {
                rating: userRating.rating,
                gamesPlayed: userRating.gamesPlayed,
                id: { lt: userRating.id },
              },
            ],
          },
        });

        const winRate =
          userRating.gamesPlayed > 0
            ? Math.round((userRating.wins / userRating.gamesPlayed) * 100)
            : 0;

        currentUserRankInfo = {
          rank: higherCount + 1,
          userId: userRating.userId,
          username: userRating.user.username,
          displayName: userRating.user.displayName,
          avatarUrl: userRating.user.avatarUrl,
          country: userRating.user.country,
          rating: userRating.rating,
          gamesPlayed: userRating.gamesPlayed,
          wins: userRating.wins,
          losses: userRating.losses,
          draws: userRating.draws,
          winRate,
        };
      }
    }

    return {
      category,
      items,
      currentUserRank: currentUserRankInfo,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const ratingService = new RatingService();
