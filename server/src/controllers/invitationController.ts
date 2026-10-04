import { Request, Response, NextFunction } from 'express';
import { invitationService } from '../services/invitations/invitationService.js';
import { authService } from '../services/authService.js';
import { PlayerInfo } from '../types/game.js';

export class InvitationController {
  /**
   * Send game challenge / invitation
   * POST /api/game-invitations
   */
  async createInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }

      const { receiverId, timeControl } = req.body;
      if (!receiverId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'receiverId is required' } });
        return;
      }

      const senderUser = await authService.getSafeUserById(req.user.userId);
      if (!senderUser) {
        res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
        return;
      }

      const sender: PlayerInfo = {
        id: senderUser.id,
        username: senderUser.username,
        displayName: senderUser.displayName,
        avatarUrl: senderUser.avatarUrl,
      };

      const invitation = await invitationService.sendInvitation(sender, receiverId, timeControl || '5+3');

      res.status(201).json({
        success: true,
        invitation,
      });
    } catch (error: any) {
      if (
        error.message?.includes('cannot challenge yourself') ||
        error.message?.includes('already have a pending') ||
        error.message?.includes('Invalid time control')
      ) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } });
        return;
      }
      next(error);
    }
  }

  /**
   * Get user's incoming & outgoing invitations
   * GET /api/game-invitations
   */
  async getInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }

      const invitations = await invitationService.getUserInvitations(req.user.userId);

      res.status(200).json({
        success: true,
        ...invitations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept an invitation
   * POST /api/game-invitations/:id/accept
   */
  async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }

      const { id } = req.params;
      const receiverUser = await authService.getSafeUserById(req.user.userId);
      if (!receiverUser) {
        res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
        return;
      }

      const receiver: PlayerInfo = {
        id: receiverUser.id,
        username: receiverUser.username,
        displayName: receiverUser.displayName,
        avatarUrl: receiverUser.avatarUrl,
      };

      const matchData = await invitationService.acceptInvitation(id, receiver);

      res.status(200).json({
        success: true,
        ...matchData,
      });
    } catch (error: any) {
      if (
        error.message?.includes('not authorized') ||
        error.message?.includes('no longer pending') ||
        error.message?.includes('expired')
      ) {
        res.status(400).json({ success: false, error: { code: 'INVALID_INVITATION', message: error.message } });
        return;
      }
      next(error);
    }
  }

  /**
   * Decline an invitation
   * POST /api/game-invitations/:id/decline
   */
  async declineInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }

      const { id } = req.params;
      const invitation = await invitationService.declineInvitation(id, req.user.userId);

      res.status(200).json({
        success: true,
        invitation,
      });
    } catch (error: any) {
      if (error.message?.includes('Unauthorized') || error.message?.includes('not pending')) {
        res.status(400).json({ success: false, error: { code: 'INVALID_INVITATION', message: error.message } });
        return;
      }
      next(error);
    }
  }

  /**
   * Cancel an outgoing invitation
   * POST /api/game-invitations/:id/cancel
   */
  async cancelInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }

      const { id } = req.params;
      const invitation = await invitationService.cancelInvitation(id, req.user.userId);

      res.status(200).json({
        success: true,
        invitation,
      });
    } catch (error: any) {
      if (error.message?.includes('Unauthorized') || error.message?.includes('not pending')) {
        res.status(400).json({ success: false, error: { code: 'INVALID_INVITATION', message: error.message } });
        return;
      }
      next(error);
    }
  }
}

export const invitationController = new InvitationController();
