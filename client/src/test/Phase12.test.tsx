import { describe, it, expect, beforeEach } from 'vitest';
import { stockfishService } from '../services/ai/stockfishService';
import { AI_DIFFICULTIES } from '../services/ai/aiConfig';
import { AIDifficulty } from '../types/ai';
import { calculateEngineBestMove } from '../services/ai/engineWorker';
import { Chess } from 'chess.js';

describe('Phase 12: Stockfish Engine & AI Configuration', () => {
  describe('AI Difficulty Mapping', () => {
    it('defines all 5 difficulty levels with proper progression', () => {
      const levels: AIDifficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];
      
      levels.forEach((level) => {
        const config = AI_DIFFICULTIES[level];
        expect(config).toBeDefined();
        expect(config.id).toBe(level);
        expect(config.depth).toBeGreaterThanOrEqual(1);
        expect(config.skillLevel).toBeGreaterThanOrEqual(0);
        expect(config.skillLevel).toBeLessThanOrEqual(20);
        expect(config.estimatedElo).toBeGreaterThan(0);
      });

      // Assert increasing depth and elo progression
      expect(AI_DIFFICULTIES.beginner.depth).toBeLessThan(AI_DIFFICULTIES.expert.depth);
      expect(AI_DIFFICULTIES.beginner.estimatedElo).toBeLessThan(AI_DIFFICULTIES.expert.estimatedElo);
      expect(AI_DIFFICULTIES.easy.estimatedElo).toBeLessThan(AI_DIFFICULTIES.hard.estimatedElo);
    });
  });

  describe('Engine Worker Move Generation', () => {
    it('generates a valid opening move for White from starting position', () => {
      const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const move = calculateEngineBestMove(startingFen, 2, 10, 0);

      expect(move).toBeDefined();
      expect(move.from).toMatch(/^[a-h][1-8]$/);
      expect(move.to).toMatch(/^[a-h][1-8]$/);

      // Verify with chess.js
      const chess = new Chess(startingFen);
      const legal = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      expect(legal).not.toBeNull();
    });

    it('generates a valid response for Black after 1. e4', () => {
      const fenAfterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const move = calculateEngineBestMove(fenAfterE4, 2, 10, 0);

      expect(move).toBeDefined();
      const chess = new Chess(fenAfterE4);
      const legal = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      expect(legal).not.toBeNull();
    });

    it('finds immediate checkmate in 1 (Fool\'s Mate test position)', () => {
      // White to move: Qh5# is checkmate
      const foolsMateFen = 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2';
      // Black Qh4#
      const move = calculateEngineBestMove(foolsMateFen, 3, 20, 0);
      expect(move.from).toBe('d8');
      expect(move.to).toBe('h4');
    });

    it('correctly handles pawn promotion without crashing', () => {
      // White pawn on a7 about to promote to a8
      const promoFen = '8/P7/8/8/8/8/k7/4K3 w - - 0 1';
      const move = calculateEngineBestMove(promoFen, 2, 20, 0);
      expect(move.from).toBe('a7');
      expect(move.to).toBe('a8');
      expect(move.promotion).toBe('q');
    });

    it('handles stalemate / draw positions gracefully', () => {
      // Stalemate position where black has no legal moves
      const stalemateFen = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1';
      const move = calculateEngineBestMove(stalemateFen, 2, 10, 0);
      expect(move.from).toBe('');
      expect(move.to).toBe('');
    });
  });

  describe('Stockfish Service & Generation ID Race Condition Protection', () => {
    beforeEach(() => {
      stockfishService.stop();
    });

    it('returns a best move through the service facade for all 5 difficulty levels', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const levels: AIDifficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

      for (const lvl of levels) {
        const session = stockfishService.createNewSession();
        const res = await stockfishService.requestBestMove(fen, lvl, session);
        expect(res).toBeDefined();
        expect(res.from).toMatch(/^[a-h][1-8]$/);
        expect(res.to).toMatch(/^[a-h][1-8]$/);

        const chess = new Chess(fen);
        const legalMove = chess.move({
          from: res.from as any,
          to: res.to as any,
          promotion: res.promotion as any,
        });
        expect(legalMove).not.toBeNull();
      }
    }, 15000);

    it('generates moves for Black across all 5 difficulty levels', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const levels: AIDifficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

      for (const lvl of levels) {
        const session = stockfishService.createNewSession();
        const res = await stockfishService.requestBestMove(fen, lvl, session);
        expect(res).toBeDefined();
        expect(res.from).toMatch(/^[a-h][1-8]$/);
        expect(res.to).toMatch(/^[a-h][1-8]$/);

        const chess = new Chess(fen);
        const legalMove = chess.move({
          from: res.from as any,
          to: res.to as any,
          promotion: res.promotion as any,
        });
        expect(legalMove).not.toBeNull();
      }
    }, 15000);

    it('rejects / ignores stale responses if session ID has changed', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // Request move with session 10
      const oldPromise = stockfishService.requestBestMove(fen, 'beginner', 10);

      // User triggers restart -> stops old session and starts session 11
      stockfishService.stop();
      const newSession = stockfishService.createNewSession();
      
      // Old promise rejects cleanly
      await expect(oldPromise).rejects.toThrow();

      // The new session request completes successfully
      const resNew = await stockfishService.requestBestMove(fen, 'beginner', newSession);
      expect(resNew).toBeDefined();
      expect(resNew.sessionId).toBe(newSession);
    });
  });
});
