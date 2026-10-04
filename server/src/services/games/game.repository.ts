import { prisma } from '../database/prisma.js';
import {
  Game,
  Move,
  GameType,
  GameResultStatus,
  TerminationReason,
  Prisma,
} from '@prisma/client';

export interface CreateGameInput {
  whitePlayerId?: string;
  blackPlayerId?: string;
  gameType?: GameType;
  timeControl?: string;
  initialTime?: number;
  increment?: number;
  rated?: boolean;
  initialFen?: string;
}

export interface MoveRecordInput {
  moveNumber: number;
  ply: number;
  color: string;
  from: string;
  to: string;
  san: string;
  uci: string;
  fen: string;
}

export interface SaveCompletedGameInput {
  game: CreateGameInput & {
    finalFen: string;
    result: GameResultStatus;
    terminationReason: TerminationReason;
    pgn?: string;
    endedAt?: Date;
  };
  moves: MoveRecordInput[];
}

export class GameRepository {
  /**
   * Create a new game record
   */
  async createGame(input: CreateGameInput): Promise<Game> {
    return prisma.game.create({
      data: {
        whitePlayerId: input.whitePlayerId,
        blackPlayerId: input.blackPlayerId,
        gameType: input.gameType || GameType.LOCAL,
        timeControl: input.timeControl || '5+3',
        initialTime: input.initialTime || 300,
        increment: input.increment || 3,
        rated: input.rated || false,
        initialFen:
          input.initialFen ||
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      },
    });
  }

  /**
   * Find game by ID with moves ordered by ply
   */
  async findGameById(id: string): Promise<(Game & { moves: Move[] }) | null> {
    return prisma.game.findUnique({
      where: { id },
      include: {
        moves: {
          orderBy: {
            ply: 'asc',
          },
        },
        whitePlayer: true,
        blackPlayer: true,
      },
    });
  }

  /**
   * Find completed games played by a specific user with filters and pagination
   */
  async findGamesByPlayer(
    playerId: string,
    options: {
      category?: string;
      result?: string; // 'win', 'loss', 'draw'
      rated?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ games: any[]; total: number }> {
    const { category, result, rated, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ whitePlayerId: playerId }, { blackPlayerId: playerId }],
      result: { not: GameResultStatus.ONGOING }, // Completed games only
    };

    if (typeof rated === 'boolean') {
      where.rated = rated;
    }

    if (result) {
      if (result === 'win') {
        where.OR = [
          { whitePlayerId: playerId, result: GameResultStatus.WHITE_WIN },
          { blackPlayerId: playerId, result: GameResultStatus.BLACK_WIN },
        ];
      } else if (result === 'loss') {
        where.OR = [
          { whitePlayerId: playerId, result: GameResultStatus.BLACK_WIN },
          { blackPlayerId: playerId, result: GameResultStatus.WHITE_WIN },
        ];
      } else if (result === 'draw') {
        where.result = GameResultStatus.DRAW;
      }
    }

    const [total, games] = await Promise.all([
      prisma.game.count({ where }),
      prisma.game.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          whitePlayer: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          blackPlayer: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          ratingHistories: {
            select: {
              userId: true,
              ratingBefore: true,
              ratingChange: true,
              ratingAfter: true,
            },
          },
        },
      }),
    ]);

    // Optional category filtering on time control if specified
    let filteredGames = games;
    if (category) {
      filteredGames = games.filter((g) => {
        const parts = g.timeControl.split('+');
        const mins = parseInt(parts[0] || '5', 10);
        const inc = parseInt(parts[1] || '0', 10);
        const totalSec = mins * 60 + inc * 40;
        if (category === 'BULLET') return totalSec < 180;
        if (category === 'BLITZ') return totalSec >= 180 && totalSec < 600;
        if (category === 'RAPID') return totalSec >= 600 && totalSec < 1800;
        if (category === 'CLASSICAL') return totalSec >= 1800;
        return true;
      });
    }

    return { games: filteredGames, total };
  }

  /**
   * Find detailed game record for replay
   */
  async findGameDetails(gameId: string) {
    return prisma.game.findUnique({
      where: { id: gameId },
      include: {
        moves: {
          orderBy: { ply: 'asc' },
        },
        whitePlayer: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, country: true },
        },
        blackPlayer: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, country: true },
        },
        ratingHistories: {
          select: {
            userId: true,
            category: true,
            ratingBefore: true,
            ratingChange: true,
            ratingAfter: true,
          },
        },
      },
    });
  }


  /**
   * Add a single move to a game
   */
  async addMove(gameId: string, move: MoveRecordInput): Promise<Move> {
    return prisma.move.create({
      data: {
        gameId,
        ...move,
      },
    });
  }

  /**
   * Add multiple moves to a game in batch
   */
  async addMovesBatch(
    gameId: string,
    moves: MoveRecordInput[]
  ): Promise<Prisma.BatchPayload> {
    return prisma.move.createMany({
      data: moves.map((m) => ({
        gameId,
        ...m,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Update game result and status on completion
   */
  async updateGameResult(
    gameId: string,
    result: GameResultStatus,
    terminationReason: TerminationReason,
    finalFen?: string,
    pgn?: string
  ): Promise<Game> {
    return prisma.game.update({
      where: { id: gameId },
      data: {
        result,
        terminationReason,
        finalFen,
        pgn,
        endedAt: new Date(),
      },
    });
  }

  /**
   * Persist a full completed game with all moves atomically in a transaction
   */
  async saveCompletedGame(input: SaveCompletedGameInput): Promise<Game & { moves: Move[] }> {
    return prisma.$transaction(async (tx) => {
      const game = await tx.game.create({
        data: {
          whitePlayerId: input.game.whitePlayerId,
          blackPlayerId: input.game.blackPlayerId,
          gameType: input.game.gameType || GameType.LOCAL,
          timeControl: input.game.timeControl || '5+3',
          initialTime: input.game.initialTime || 300,
          increment: input.game.increment || 3,
          rated: input.game.rated || false,
          initialFen:
            input.game.initialFen ||
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          finalFen: input.game.finalFen,
          result: input.game.result,
          terminationReason: input.game.terminationReason,
          pgn: input.game.pgn,
          endedAt: input.game.endedAt || new Date(),
        },
      });

      if (input.moves.length > 0) {
        await tx.move.createMany({
          data: input.moves.map((m) => ({
            gameId: game.id,
            ...m,
          })),
        });
      }

      const fullGame = await tx.game.findUnique({
        where: { id: game.id },
        include: {
          moves: {
            orderBy: { ply: 'asc' },
          },
        },
      });

      if (!fullGame) throw new Error('Failed to retrieve created game');
      return fullGame;
    });
  }
}

export const gameRepository = new GameRepository();
