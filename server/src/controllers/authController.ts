import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { setAuthCookie, clearAuthCookie } from '../utils/cookie.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../validators/authValidator.js';
import { validateBody } from '../utils/validation.js';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateBody(registerSchema, req.body);
      const { user, token } = await authService.register(validatedData);

      setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with username or email
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateBody(loginSchema, req.body);
      const { user, token } = await authService.login(validatedData);

      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout and clear session cookie
   * POST /api/auth/logout
   */
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      clearAuthCookie(res);
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get currently authenticated user details
   * GET /api/auth/me
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        });
        return;
      }

      const user = await authService.getSafeUserById(req.user.userId);
      if (!user) {
        clearAuthCookie(res);
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User account not found or deactivated',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change authenticated user password
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        });
        return;
      }

      const validatedData = validateBody(changePasswordSchema, req.body);
      const { token } = await authService.changePassword(req.user.userId, validatedData);

      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
