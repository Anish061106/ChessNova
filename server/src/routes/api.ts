import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import { authRouter } from './authRoutes.js';
import { userRouter } from './userRoutes.js';
import { gameRouter } from './gameRoutes.js';
import { invitationRouter } from './invitationRoutes.js';
import { ratingRouter } from './ratingRoutes.js';
import puzzleRouter from './puzzleRoutes.js';
import friendRouter from './friendRoutes.js';
import { ratingController } from '../controllers/ratingController.js';
import { optionalAuth } from '../middleware/authenticate.js';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', getHealth);

// Auth endpoints
apiRouter.use('/auth', authRouter);

// User endpoints
apiRouter.use('/users', userRouter);

// Game endpoints
apiRouter.use('/games', gameRouter);

// Game Invitation endpoints
apiRouter.use('/game-invitations', invitationRouter);

// Ratings endpoints
apiRouter.use('/ratings', ratingRouter);

// Puzzles endpoints
apiRouter.use('/puzzles', puzzleRouter);

// Friends endpoints
apiRouter.use('/friends', friendRouter);

// Direct /api/leaderboard endpoint
apiRouter.get('/leaderboard', optionalAuth, (req, res, next) =>
  ratingController.getLeaderboard(req, res, next)
);
