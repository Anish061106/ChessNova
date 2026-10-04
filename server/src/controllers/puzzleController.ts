import { Request, Response, NextFunction } from 'express';
import { puzzleService } from '../services/puzzles/puzzleService.js';

export class PuzzleController {
  /**
   * GET /api/puzzles
   */
  async listPuzzles(req: Request, res: Response, next: NextFunction) {
    try {
      const difficulty = req.query.difficulty as string | undefined;
      const theme = req.query.theme as string | undefined;
      const minRating = req.query.minRating ? parseInt(req.query.minRating as string, 10) : undefined;
      const maxRating = req.query.maxRating ? parseInt(req.query.maxRating as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await puzzleService.listPuzzles({
        difficulty,
        theme,
        minRating,
        maxRating,
        limit,
        offset,
      });

      return res.json({
        success: true,
        data: result.puzzles,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/puzzles/random
   */
  async getRandom(req: Request, res: Response, next: NextFunction) {
    try {
      const difficulty = req.query.difficulty as string | undefined;
      const userId = req.user?.userId;

      const puzzle = await puzzleService.getRandomPuzzle(difficulty, userId);
      return res.json({
        success: true,
        data: puzzle,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/puzzles/:id
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const puzzle = await puzzleService.getPuzzleById(req.params.id);
      if (!puzzle) {
        return res.status(404).json({
          success: false,
          error: 'Puzzle not found',
        });
      }

      return res.json({
        success: true,
        data: puzzle,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/puzzles/:id/validate-move
   */
  async validateMove(req: Request, res: Response, next: NextFunction) {
    try {
      const { moveUci, moveIndex } = req.body;
      if (!moveUci || typeof moveIndex !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'moveUci and moveIndex are required',
        });
      }

      const result = await puzzleService.validateMove(req.params.id, moveUci, moveIndex);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/puzzles/:id/attempt
   */
  async submitAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const { correct, moves, timeTaken } = req.body;
      const userId = req.user?.userId;

      const result = await puzzleService.recordAttempt(
        userId,
        req.params.id,
        Boolean(correct),
        Array.isArray(moves) ? moves : [],
        typeof timeTaken === 'number' ? timeTaken : 0
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/puzzles/history
   */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const history = await puzzleService.getUserHistory(req.user.userId, limit);

      return res.json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const puzzleController = new PuzzleController();
