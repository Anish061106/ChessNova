import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/authRateLimit.js';

export const authRouter = Router();

// Public auth endpoints
authRouter.post('/register', authRateLimiter, (req, res, next) =>
  authController.register(req, res, next)
);

authRouter.post('/login', authRateLimiter, (req, res, next) =>
  authController.login(req, res, next)
);

authRouter.post('/logout', (req, res, next) =>
  authController.logout(req, res, next)
);

// Authenticated session check
authRouter.get('/me', authenticateUser, (req, res, next) =>
  authController.getMe(req, res, next)
);

// Authenticated password change
authRouter.post('/change-password', authenticateUser, authRateLimiter, (req, res, next) =>
  authController.changePassword(req, res, next)
);
