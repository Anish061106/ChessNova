import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database/prisma.js';
import { authService } from '../services/authService.js';
import { updateProfileSchema, updateSettingsSchema } from '../validators/userValidator.js';
import { validateBody } from '../utils/validation.js';

export class UserController {
  /**
   * Get current authenticated user profile
   * GET /api/users/me
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
        return;
      }

      const user = await authService.getSafeUserById(req.user.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
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
   * Update current authenticated user profile
   * PATCH /api/users/me
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
        return;
      }

      const validatedData = validateBody(updateProfileSchema, req.body);

      // Explicitly update only safe fields to prevent mass assignment
      const updatedUser = await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          ...(validatedData.displayName !== undefined && { displayName: validatedData.displayName }),
          ...(validatedData.avatarUrl !== undefined && { avatarUrl: validatedData.avatarUrl }),
          ...(validatedData.country !== undefined && { country: validatedData.country }),
          ...(validatedData.bio !== undefined && { bio: validatedData.bio }),
        },
        include: {
          settings: true,
          ratings: true,
        },
      });

      res.status(200).json({
        success: true,
        user: authService.toSafeUser(updatedUser),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user settings
   * GET /api/users/me/settings
   */
  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
        return;
      }

      let settings = await prisma.userSettings.findUnique({
        where: { userId: req.user.userId },
      });

      // If settings record doesn't exist yet, create default
      if (!settings) {
        settings = await prisma.userSettings.create({
          data: {
            userId: req.user.userId,
            theme: 'dark',
            boardTheme: 'classic',
            pieceSet: 'classic',
            soundEnabled: true,
            animationEnabled: true,
            showLegalMoves: true,
            showCoordinates: true,
            highlightLastMove: true,
            confirmMoves: false,
            autoQueen: false,
            animationSpeed: 'normal',
          },
        });
      }

      res.status(200).json({
        success: true,
        settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current authenticated user settings
   * PATCH /api/users/me/settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
        return;
      }

      const validatedData = validateBody(updateSettingsSchema, req.body);

      const settings = await prisma.userSettings.upsert({
        where: { userId: req.user.userId },
        update: validatedData,
        create: {
          userId: req.user.userId,
          ...validatedData,
        },
      });

      res.status(200).json({
        success: true,
        settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search users by username or display name
   * GET /api/users/search?q=...
   */
  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
        return;
      }

      const q = typeof req.query.q === 'string' ? req.query.q : '';
      if (!q || q.trim().length < 2) {
        res.status(200).json({
          success: true,
          users: [],
        });
        return;
      }

      const users = await prisma.user.findMany({
        where: {
          id: { not: req.user.userId },
          isActive: true,
          OR: [
            { username: { contains: q.trim(), mode: 'insensitive' } },
            { displayName: { contains: q.trim(), mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
        take: 10,
      });

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
