import { Request, Response, NextFunction } from 'express';
import { gameManager } from '../services/games/gameManager.js';
import { gameRepository } from '../services/games/game.repository.js';
import { GameResultStatus } from '@prisma/client';

export class GameController {
  /**
   * POST /api/games
   * Create a new online game session
   */
  async createGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { timeControl = '5+3', rated = true } = req.body;

      const game = await gameManager.createGame(
        {
          id: user.userId,
          username: user.username,
        },
        timeControl,
        '',
        rated
      );

      res.status(201).json({
        success: true,
        gameId: game.gameId,
        timeControl: game.timeControl,
        initialTime: game.initialTime,
        increment: game.increment,
        rated: game.rated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/games/history
   * Get completed games for the authenticated player with pagination & filters
   */
  async getGameHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const category = req.query.category as string | undefined;
      const result = req.query.result as string | undefined;
      const ratedQuery = req.query.rated;
      let rated: boolean | undefined = undefined;
      if (ratedQuery === 'true') rated = true;
      if (ratedQuery === 'false') rated = false;

      const rawPage = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1);
      const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 50);

      const { games, total } = await gameRepository.findGamesByPlayer(user.userId, {
        category,
        result,
        rated,
        page,
        limit,
      });

      // Format response items with opponent and rating change info
      const items = games.map((game) => {
        const isWhite = game.whitePlayerId === user.userId;
        const userColor = isWhite ? 'white' : 'black';
        const opponent = isWhite ? game.blackPlayer : game.whitePlayer;

        let userResult: 'WIN' | 'LOSS' | 'DRAW';
        if (game.result === GameResultStatus.DRAW) {
          userResult = 'DRAW';
        } else if (
          (isWhite && game.result === GameResultStatus.WHITE_WIN) ||
          (!isWhite && game.result === GameResultStatus.BLACK_WIN)
        ) {
          userResult = 'WIN';
        } else {
          userResult = 'LOSS';
        }

        const userRatingHist = game.ratingHistories?.find(
          (rh: any) => rh.userId === user.userId
        );

        return {
          id: game.id,
          timeControl: game.timeControl,
          rated: game.rated,
          result: userResult,
          gameResult: game.result,
          terminationReason: game.terminationReason,
          userColor,
          opponent: opponent
            ? {
                id: opponent.id,
                username: opponent.username,
                displayName: opponent.displayName,
                avatarUrl: opponent.avatarUrl,
              }
            : null,
          ratingBefore: userRatingHist?.ratingBefore,
          ratingChange: userRatingHist?.ratingChange,
          ratingAfter: userRatingHist?.ratingAfter,
          playedAt: game.createdAt,
          endedAt: game.endedAt,
        };
      });

      res.status(200).json({
        success: true,
        items,
        pagination: {
          page: isNaN(page) ? 1 : page,
          limit: isNaN(limit) ? 20 : limit,
          total,
          totalPages: Math.ceil(total / (isNaN(limit) ? 20 : limit)) || 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/games/:gameId
   * Get detailed game metadata and full moves for replay
   */
  async getGameDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { gameId } = req.params;
      const user = req.user;

      // 1. Check if it's an active in-memory game first
      const activeState = gameManager.getGameState(gameId, user?.userId);
      if (activeState && activeState.status === 'ACTIVE') {
        res.status(200).json({
          success: true,
          game: activeState,
        });
        return;
      }

      // 2. Load from database
      const dbGame = await gameRepository.findGameDetails(gameId);
      if (!dbGame) {
        res.status(404).json({
          success: false,
          error: { code: 'GAME_NOT_FOUND', message: 'Game not found' },
        });
        return;
      }

      // 3. Authorization check: completed games can be viewed; ongoing private games only by participants
      if (dbGame.result === GameResultStatus.ONGOING) {
        if (!user || (dbGame.whitePlayerId !== user.userId && dbGame.blackPlayerId !== user.userId)) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You are not authorized to view this ongoing game' },
          });
          return;
        }
      }

      const whiteRatingHistory = dbGame.ratingHistories?.find(
        (rh) => rh.userId === dbGame.whitePlayerId
      );
      const blackRatingHistory = dbGame.ratingHistories?.find(
        (rh) => rh.userId === dbGame.blackPlayerId
      );

      res.status(200).json({
        success: true,
        game: {
          id: dbGame.id,
          gameType: dbGame.gameType,
          timeControl: dbGame.timeControl,
          initialTime: dbGame.initialTime,
          increment: dbGame.increment,
          rated: dbGame.rated,
          initialFen: dbGame.initialFen,
          finalFen: dbGame.finalFen,
          result: dbGame.result,
          terminationReason: dbGame.terminationReason,
          pgn: dbGame.pgn,
          createdAt: dbGame.createdAt,
          endedAt: dbGame.endedAt,
          whitePlayer: dbGame.whitePlayer,
          blackPlayer: dbGame.blackPlayer,
          whiteRatingChange: whiteRatingHistory
            ? {
                before: whiteRatingHistory.ratingBefore,
                change: whiteRatingHistory.ratingChange,
                after: whiteRatingHistory.ratingAfter,
              }
            : null,
          blackRatingChange: blackRatingHistory
            ? {
                before: blackRatingHistory.ratingBefore,
                change: blackRatingHistory.ratingChange,
                after: blackRatingHistory.ratingAfter,
              }
            : null,
          moves: dbGame.moves.map((m) => ({
            id: m.id,
            moveNumber: m.moveNumber,
            ply: m.ply,
            color: m.color,
            from: m.from,
            to: m.to,
            san: m.san,
            uci: m.uci,
            fen: m.fen,
            createdAt: m.createdAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/games/:gameId/pgn
   * Authoritative PGN download / string
   */
  async getGamePgn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { gameId } = req.params;
      const game = await gameRepository.findGameById(gameId);

      if (!game) {
        res.status(404).json({
          success: false,
          error: { code: 'GAME_NOT_FOUND', message: 'Game not found' },
        });
        return;
      }

      const pgn = game.pgn || '';
      res.setHeader('Content-Type', 'application/x-chess-pgn');
      res.setHeader('Content-Disposition', `attachment; filename="chessnova_game_${gameId}.pgn"`);
      res.status(200).send(pgn);
    } catch (error) {
      next(error);
    }
  }
}

export const gameController = new GameController();
