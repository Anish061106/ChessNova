import { prisma } from '../database/prisma.js';
import { Chess } from 'chess.js';
import { logger } from '../../utils/logger.js';

function withDbTimeout<T>(promise: Promise<T>, timeoutMs = 800): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Database query timed out')), timeoutMs)
    ),
  ]);
}

export interface PuzzleDTO {
  id: string;
  fen: string;
  pgn: string | null;
  rating: number;
  difficulty: string;
  themes: string[];
  initialPlyColor: 'w' | 'b';
  totalMoves: number;
  createdAt: Date;
}

export interface PuzzleFilterOptions {
  difficulty?: string;
  theme?: string;
  minRating?: number;
  maxRating?: number;
  limit?: number;
  offset?: number;
}

// Curated seed puzzles for offline/fresh database fallback
export const SEED_PUZZLES = [
  {
    id: 'puz-101',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Nxe4',
    rating: 1100,
    difficulty: 'easy',
    themes: ['Fork', 'Tactics', 'Pawn'],
    // Solution: 5. Bxf7+ Kxf7 6. dxe4
    solution: ['c4f7', 'e8f7', 'd3e4'],
  },
  {
    id: 'puz-102',
    fen: 'r1b2rk1/pp3ppp/2n1p3/q2pP3/3P4/P1PB1N2/5PPP/R2QK2R w KQ - 1 12',
    pgn: 'Greek Gift sacrifice',
    rating: 1350,
    difficulty: 'medium',
    themes: ['Greek Gift', 'Sacrifice', 'Checkmate'],
    // Solution: Bxh7+ Kxh7 Ng5+
    solution: ['d3h7', 'g8h7', 'f3g5'],
  },
  {
    id: 'puz-103',
    fen: '6k1/5ppp/8/8/8/8/4QPPP/6K1 w - - 0 1',
    pgn: 'Back rank mate in 1',
    rating: 900,
    difficulty: 'easy',
    themes: ['Back Rank', 'Mate in 1'],
    // Solution: Qe8#
    solution: ['e2e8'],
  },
  {
    id: 'puz-104',
    fen: 'r2qkb1r/pp2pppp/2n2n2/3p4/3P2b1/2NB1N2/PPP2PPP/R1BQK2R b KQkq - 4 6',
    pgn: 'Pin exploitation',
    rating: 1550,
    difficulty: 'medium',
    themes: ['Pin', 'Double Attack'],
    // Solution: Bxf3 Qxf3 Nxd4
    solution: ['g4f3', 'd1f3', 'c6d4'],
  },
  {
    id: 'puz-105',
    fen: 'r1b1kb1r/ppppqppp/5n2/4n3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 5',
    pgn: 'Discovered Attack and Knight Fork',
    rating: 1800,
    difficulty: 'hard',
    themes: ['Discovered Attack', 'Knight Fork', 'Tactics'],
    // Solution: Nxe5 Qxe5 d4
    solution: ['f3e5', 'e7e5', 'd2d4'],
  },
  {
    id: 'puz-106',
    fen: 'r2q1rk1/1pp2ppp/p1np1n2/4p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 w - - 0 8',
    pgn: 'Pin on f6 with Nd5',
    rating: 1650,
    difficulty: 'medium',
    themes: ['Pin', 'Piece Control'],
    // Solution: Nd5 Nd4
    solution: ['c3d5', 'c6d4'],
  },
  {
    id: 'puz-107',
    fen: 'r4rk1/ppp2ppp/2n5/3q4/3P4/4PN2/PP1Q1PPP/R3K2R w KQ - 0 12',
    pgn: 'Castling and central control',
    rating: 1250,
    difficulty: 'easy',
    themes: ['Castling', 'Tactics'],
    // Solution: O-O
    solution: ['e1g1'],
  },
  {
    id: 'puz-108',
    fen: '8/5k2/8/8/8/8/4K1P1/7R w - - 0 1',
    pgn: 'Rook endgame pawn promotion',
    rating: 1950,
    difficulty: 'hard',
    themes: ['Endgame', 'Rook', 'Promotion'],
    // Solution: Rh7+ Kg6 Ra7
    solution: ['h1h7', 'f7g6', 'h7a7'],
  },
];

export class PuzzleService {
  /**
   * Ensure seed puzzles exist in the database on startup
   */
  async seedInitialPuzzlesIfEmpty(): Promise<void> {
    try {
      const count = await prisma.puzzle.count();
      if (count === 0) {
        for (const p of SEED_PUZZLES) {
          await prisma.puzzle.create({
            data: {
              id: p.id,
              fen: p.fen,
              pgn: p.pgn,
              rating: p.rating,
              difficulty: p.difficulty,
              themes: p.themes,
              solution: p.solution,
            },
          });
        }
        logger.info(`[PuzzleService] Seeded ${SEED_PUZZLES.length} tactical puzzles into database`);
      }
    } catch (err) {
      logger.warn('[PuzzleService] Could not seed database puzzles (running in-memory fallback):', err);
    }
  }

  /**
   * List puzzles with filtering and pagination
   */
  async listPuzzles(options: PuzzleFilterOptions = {}): Promise<{ puzzles: PuzzleDTO[]; total: number }> {
    const { difficulty, theme, minRating, maxRating, limit = 20, offset = 0 } = options;

    try {
      const where: any = {};
      if (difficulty) where.difficulty = difficulty.toLowerCase();
      if (theme) where.themes = { has: theme };
      if (minRating || maxRating) {
        where.rating = {};
        if (minRating) where.rating.gte = minRating;
        if (maxRating) where.rating.lte = maxRating;
      }

      const [puzzles, total] = await withDbTimeout(
        Promise.all([
          prisma.puzzle.findMany({
            where,
            take: Math.min(limit, 50),
            skip: offset,
            orderBy: { rating: 'asc' },
          }),
          prisma.puzzle.count({ where }),
        ])
      );

      return {
        puzzles: puzzles.map((p) => this.toDTO(p)),
        total,
      };
    } catch {
      // Fallback to in-memory filter
      let filtered = [...SEED_PUZZLES];
      if (difficulty) {
        filtered = filtered.filter((p) => p.difficulty.toLowerCase() === difficulty.toLowerCase());
      }
      if (theme) {
        filtered = filtered.filter((p) => p.themes.some((t) => t.toLowerCase() === theme.toLowerCase()));
      }
      if (minRating) filtered = filtered.filter((p) => p.rating >= minRating);
      if (maxRating) filtered = filtered.filter((p) => p.rating <= maxRating);

      const paginated = filtered.slice(offset, offset + limit);
      return {
        puzzles: paginated.map((p) => ({
          id: p.id,
          fen: p.fen,
          pgn: p.pgn,
          rating: p.rating,
          difficulty: p.difficulty,
          themes: p.themes,
          initialPlyColor: new Chess(p.fen).turn(),
          totalMoves: p.solution.length,
          createdAt: new Date(),
        })),
        total: filtered.length,
      };
    }
  }

  /**
   * Get a single puzzle by ID
   */
  async getPuzzleById(puzzleId: string): Promise<PuzzleDTO | null> {
    try {
      const puzzle = await withDbTimeout(
        prisma.puzzle.findUnique({
          where: { id: puzzleId },
        })
      );
      if (puzzle) return this.toDTO(puzzle);
    } catch {
      // Fallback
    }

    const fallback = SEED_PUZZLES.find((p) => p.id === puzzleId);
    if (fallback) {
      return {
        id: fallback.id,
        fen: fallback.fen,
        pgn: fallback.pgn,
        rating: fallback.rating,
        difficulty: fallback.difficulty,
        themes: fallback.themes,
        initialPlyColor: new Chess(fallback.fen).turn(),
        totalMoves: fallback.solution.length,
        createdAt: new Date(),
      };
    }
    return null;
  }

  /**
   * Get random or next puzzle for a player
   */
  async getRandomPuzzle(difficulty?: string, userId?: string): Promise<PuzzleDTO> {
    try {
      let solvedIds: string[] = [];
      if (userId) {
        const attempts = await prisma.puzzleAttempt.findMany({
          where: { userId, correct: true },
          select: { puzzleId: true },
        });
        solvedIds = attempts.map((a) => a.puzzleId);
      }

      const where: any = {};
      if (difficulty) where.difficulty = difficulty.toLowerCase();
      if (solvedIds.length > 0) {
        where.id = { notIn: solvedIds };
      }

      const count = await prisma.puzzle.count({ where });
      if (count > 0) {
        const randomSkip = Math.floor(Math.random() * count);
        const [puzzle] = await prisma.puzzle.findMany({
          where,
          take: 1,
          skip: randomSkip,
        });
        if (puzzle) return this.toDTO(puzzle);
      }

      // If all solved or count is 0, pick any random puzzle
      const anyCount = await prisma.puzzle.count();
      if (anyCount > 0) {
        const randomSkip = Math.floor(Math.random() * anyCount);
        const [puzzle] = await prisma.puzzle.findMany({
          take: 1,
          skip: randomSkip,
        });
        if (puzzle) return this.toDTO(puzzle);
      }
    } catch {
      // Fallback
    }

    let pool = [...SEED_PUZZLES];
    if (difficulty) {
      const diffFiltered = pool.filter((p) => p.difficulty.toLowerCase() === difficulty.toLowerCase());
      if (diffFiltered.length > 0) pool = diffFiltered;
    }
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    return {
      id: chosen.id,
      fen: chosen.fen,
      pgn: chosen.pgn,
      rating: chosen.rating,
      difficulty: chosen.difficulty,
      themes: chosen.themes,
      initialPlyColor: new Chess(chosen.fen).turn(),
      totalMoves: chosen.solution.length,
      createdAt: new Date(),
    };
  }

  /**
   * Validates a step move or submitted attempt against the puzzle solution
   */
  async validateMove(
    puzzleId: string,
    moveUci: string,
    moveIndex: number
  ): Promise<{
    isCorrect: boolean;
    isComplete: boolean;
    opponentResponseUci?: string;
    nextExpectedMoveIndex?: number;
  }> {
    let solution: string[] | undefined;

    try {
      const p = await withDbTimeout(
        prisma.puzzle.findUnique({
          where: { id: puzzleId },
          select: { solution: true },
        })
      );
      if (p) solution = p.solution;
    } catch {
      // Fallback
    }

    if (!solution) {
      const fallback = SEED_PUZZLES.find((p) => p.id === puzzleId);
      solution = fallback?.solution;
    }

    if (!solution || moveIndex >= solution.length) {
      return { isCorrect: false, isComplete: false };
    }

    const expectedMove = solution[moveIndex];
    const isCorrect = expectedMove.toLowerCase() === moveUci.toLowerCase();

    if (!isCorrect) {
      return { isCorrect: false, isComplete: false };
    }

    // Check if player's move was the final move in solution
    const isFinalMove = moveIndex === solution.length - 1;
    if (isFinalMove) {
      return {
        isCorrect: true,
        isComplete: true,
      };
    }

    // Otherwise, the next move in solution is the opponent response
    const opponentResponseUci = solution[moveIndex + 1];
    const nextPlayerMoveIndex = moveIndex + 2;
    const isCompleteAfterOpponent = nextPlayerMoveIndex >= solution.length;

    return {
      isCorrect: true,
      isComplete: isCompleteAfterOpponent,
      opponentResponseUci,
      nextExpectedMoveIndex: nextPlayerMoveIndex,
    };
  }

  /**
   * Records a puzzle attempt for an authenticated user
   */
  async recordAttempt(
    userId: string | undefined,
    puzzleId: string,
    correct: boolean,
    moves: string[],
    timeTaken: number
  ): Promise<any> {
    if (!userId) {
      return { success: true, recorded: false, message: 'Anonymous attempt' };
    }

    try {
      const attempt = await prisma.puzzleAttempt.create({
        data: {
          userId,
          puzzleId,
          correct,
          moves,
          timeTaken,
        },
      });
      return { success: true, recorded: true, attempt };
    } catch (err) {
      logger.warn('[PuzzleService] Failed to record attempt:', err);
      return { success: true, recorded: false };
    }
  }

  /**
   * Get puzzle attempt history for a user
   */
  async getUserHistory(userId: string, limit = 20): Promise<any[]> {
    try {
      return await prisma.puzzleAttempt.findMany({
        where: { userId },
        take: Math.min(limit, 50),
        orderBy: { createdAt: 'desc' },
        include: {
          puzzle: {
            select: {
              id: true,
              rating: true,
              difficulty: true,
              themes: true,
            },
          },
        },
      });
    } catch {
      return [];
    }
  }

  private toDTO(puzzle: any): PuzzleDTO {
    const chess = new Chess(puzzle.fen);
    return {
      id: puzzle.id,
      fen: puzzle.fen,
      pgn: puzzle.pgn,
      rating: puzzle.rating,
      difficulty: puzzle.difficulty,
      themes: puzzle.themes,
      initialPlyColor: chess.turn(),
      totalMoves: puzzle.solution.length,
      createdAt: puzzle.createdAt,
    };
  }
}

export const puzzleService = new PuzzleService();
