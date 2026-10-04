import { Request, Response, NextFunction } from 'express';
import { friendService } from '../services/social/friendService.js';

export class FriendController {
  /**
   * GET /api/friends/search?q=...
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;
      const currentUserId = req.user!.userId;

      const users = await friendService.searchUsers(query, currentUserId, limit);
      return res.json({
        success: true,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/friends
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const friends = await friendService.getFriendsList(req.user!.userId);
      return res.json({
        success: true,
        data: friends,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/friends/requests
   */
  async requests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await friendService.getPendingRequests(req.user!.userId);
      return res.json({
        success: true,
        data: requests,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/friends/requests
   */
  async send(req: Request, res: Response, next: NextFunction) {
    try {
      const { receiverId } = req.body;
      if (!receiverId) {
        return res.status(400).json({
          success: false,
          error: 'receiverId is required',
        });
      }

      const friendship = await friendService.sendRequest(req.user!.userId, receiverId);
      return res.status(201).json({
        success: true,
        data: friendship,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to send friend request',
      });
    }
  }

  /**
   * POST /api/friends/requests/:id/accept
   */
  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const friendship = await friendService.acceptRequest(req.params.id, req.user!.userId);
      return res.json({
        success: true,
        data: friendship,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to accept friend request',
      });
    }
  }

  /**
   * POST /api/friends/requests/:id/decline
   */
  async decline(req: Request, res: Response, next: NextFunction) {
    try {
      await friendService.declineRequest(req.params.id, req.user!.userId);
      return res.json({
        success: true,
        message: 'Friend request declined',
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to decline friend request',
      });
    }
  }

  /**
   * DELETE /api/friends/:id
   */
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await friendService.removeFriend(req.params.id, req.user!.userId);
      return res.json({
        success: true,
        message: 'Friend removed',
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to remove friend',
      });
    }
  }

  /**
   * POST /api/friends/block
   */
  async block(req: Request, res: Response, next: NextFunction) {
    try {
      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          error: 'targetUserId is required',
        });
      }

      await friendService.blockUser(req.user!.userId, targetUserId);
      return res.json({
        success: true,
        message: 'User blocked',
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to block user',
      });
    }
  }
}

export const friendController = new FriendController();
