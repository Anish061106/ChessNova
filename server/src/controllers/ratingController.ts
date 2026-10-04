import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database/prisma.js';
import { ratingService } from '../services/ratings/ratingService.js';
import { RatingCategory } from '@prisma/client';

export class RatingController {
  /**
   * GET /api/ratings/user/:username or /api/users/:username/ratings
   * Public-safe endpoint to get ratings for a user
   */
  async getUserRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username } = req.params;
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          country: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });
        return;
      }

      const ratings = await ratingService.getUserRatings(user.id);

      res.status(200).json({
        success: true,
        user,
        ratings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/me/rating-history
   * Paginated rating progression history for the authenticated user
   */
  async getMyRatingHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      const category = req.query.category as RatingCategory | undefined;
      const rawPage = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1);
      const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 50);

      const history = await ratingService.getUserRatingHistory(req.user.userId, {
        category,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        items: history.items,
        pagination: history.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/leaderboard
   * Paginated global leaderboard by rating category
   */
  async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let category = (req.query.category as string)?.toUpperCase() as RatingCategory;
      if (!category || !Object.values(RatingCategory).includes(category)) {
        category = RatingCategory.BLITZ;
      }

      const rawPage = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1);
      const limit = Math.min(Math.max(isNaN(rawLimit) ? 50 : rawLimit, 1), 100);
      const currentUserId = req.user?.userId;

      const leaderboard = await ratingService.getLeaderboard(category, {
        page,
        limit,
        currentUserId,
      });

      res.status(200).json({
        success: true,
        category: leaderboard.category,
        items: leaderboard.items,
        currentUserRank: leaderboard.currentUserRank,
        pagination: leaderboard.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ratingController = new RatingController();
