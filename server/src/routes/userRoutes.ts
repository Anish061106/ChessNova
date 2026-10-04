import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { ratingController } from '../controllers/ratingController.js';
import { authenticateUser } from '../middleware/authenticate.js';

export const userRouter = Router();

// Public user rating query
userRouter.get('/:username/ratings', (req, res, next) =>
  ratingController.getUserRatings(req, res, next)
);

// All user routes below require authentication
userRouter.use(authenticateUser);

userRouter.get('/search', (req, res, next) => userController.searchUsers(req, res, next));
userRouter.get('/me', (req, res, next) => userController.getProfile(req, res, next));
userRouter.patch('/me', (req, res, next) => userController.updateProfile(req, res, next));
userRouter.get('/me/settings', (req, res, next) => userController.getSettings(req, res, next));
userRouter.patch('/me/settings', (req, res, next) => userController.updateSettings(req, res, next));
userRouter.get('/me/rating-history', (req, res, next) =>
  ratingController.getMyRatingHistory(req, res, next)
);

