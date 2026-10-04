import { Router } from 'express';
import { authenticateUser, optionalAuth } from '../middleware/authenticate.js';
import { gameController } from '../controllers/gameController.js';

export const gameRouter = Router();

/**
 * POST /api/games
 * Create a new online game (requires auth)
 */
gameRouter.post('/', authenticateUser, (req, res, next) =>
  gameController.createGame(req, res, next)
);

/**
 * GET /api/games/history
 * Get completed games history for current user (requires auth)
 */
gameRouter.get('/history', authenticateUser, (req, res, next) =>
  gameController.getGameHistory(req, res, next)
);

/**
 * GET /api/games/:gameId
 * Get game details / replay moves (optionalAuth so participants & public can view completed games)
 */
gameRouter.get('/:gameId', optionalAuth, (req, res, next) =>
  gameController.getGameDetails(req, res, next)
);

/**
 * GET /api/games/:gameId/pgn
 * Download authoritative PGN
 */
gameRouter.get('/:gameId/pgn', optionalAuth, (req, res, next) =>
  gameController.getGamePgn(req, res, next)
);
