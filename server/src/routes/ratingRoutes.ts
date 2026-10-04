import { Router } from 'express';
import { ratingController } from '../controllers/ratingController.js';
import { authenticateUser, optionalAuth } from '../middleware/authenticate.js';

export const ratingRouter = Router();

/**
 * GET /api/ratings/leaderboard
 * Global leaderboard (optionalAuth so logged in users get currentUserRank)
 */
ratingRouter.get('/leaderboard', optionalAuth, (req, res, next) =>
  ratingController.getLeaderboard(req, res, next)
);

/**
 * GET /api/ratings/user/:username
 * User public ratings
 */
ratingRouter.get('/user/:username', (req, res, next) =>
  ratingController.getUserRatings(req, res, next)
);

/**
 * GET /api/ratings/me/history
 * Authenticated user's rating progression
 */
ratingRouter.get('/me/history', authenticateUser, (req, res, next) =>
  ratingController.getMyRatingHistory(req, res, next)
);
