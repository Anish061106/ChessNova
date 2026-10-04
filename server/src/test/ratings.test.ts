import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DEFAULT_RATING,
  DEFAULT_K_FACTOR,
  getRatingCategory,
  calculateExpectedScore,
  calculateEloChange,
} from '../utils/ratingConfig.js';
import { ratingService } from '../services/ratings/ratingService.js';
import { prisma } from '../services/database/prisma.js';
import { RatingCategory, GameResultStatus } from '@prisma/client';

describe('ChessNova Phase 8 — Rating System & Elo Calculations', () => {
  describe('Elo Formula & Expected Score calculations', () => {
    it('calculates equal expected scores for identical ratings', () => {
      const expA = calculateExpectedScore(1200, 1200);
      const expB = calculateExpectedScore(1200, 1200);
      expect(expA).toBeCloseTo(0.5, 4);
      expect(expB).toBeCloseTo(0.5, 4);
    });

    it('calculates higher expected score for higher rated player', () => {
      const expHigher = calculateExpectedScore(1400, 1200);
      const expLower = calculateExpectedScore(1200, 1400);

      expect(expHigher).toBeGreaterThan(0.5);
      expect(expLower).toBeLessThan(0.5);
      expect(expHigher + expLower).toBeCloseTo(1.0, 4);
      // 1400 vs 1200 expected score is ~0.7597
      expect(expHigher).toBeCloseTo(0.7597, 2);
    });

    it('calculates 1200 vs 1200 White Win: +16 for White, -16 for Black (K=32)', () => {
      const { whiteChange, blackChange, newWhiteRating, newBlackRating } = calculateEloChange(
        1200,
        1200,
        1 // White wins
      );

      expect(whiteChange).toBe(16);
      expect(blackChange).toBe(-16);
      expect(newWhiteRating).toBe(1216);
      expect(newBlackRating).toBe(1184);
    });

    it('calculates 1200 vs 1200 Black Win: -16 for White, +16 for Black (K=32)', () => {
      const { whiteChange, blackChange, newWhiteRating, newBlackRating } = calculateEloChange(
        1200,
        1200,
        0 // Black wins
      );

      expect(whiteChange).toBe(-16);
      expect(blackChange).toBe(16);
      expect(newWhiteRating).toBe(1184);
      expect(newBlackRating).toBe(1216);
    });

    it('calculates 1200 vs 1200 Draw: 0 change for both players', () => {
      const { whiteChange, blackChange, newWhiteRating, newBlackRating } = calculateEloChange(
        1200,
        1200,
        0.5 // Draw
      );

      expect(whiteChange).toBe(0);
      expect(blackChange).toBe(0);
      expect(newWhiteRating).toBe(1200);
      expect(newBlackRating).toBe(1200);
    });

    it('calculates 1200 vs 1400 Upset (1200 wins): high rating gain for underdog', () => {
      // White (1200) vs Black (1400), White wins (actualScore = 1)
      const { whiteChange, blackChange, newWhiteRating, newBlackRating } = calculateEloChange(
        1200,
        1400,
        1
      );

      // Expected for 1200 is ~0.24, so delta = 32 * (1 - 0.24) = ~24
      expect(whiteChange).toBe(24);
      expect(blackChange).toBe(-24);
      expect(newWhiteRating).toBe(1224);
      expect(newBlackRating).toBe(1376);
    });

    it('calculates 1400 vs 1200 Expected Win: small rating gain for favorite', () => {
      // White (1400) vs Black (1200), White wins (actualScore = 1)
      const { whiteChange, blackChange, newWhiteRating, newBlackRating } = calculateEloChange(
        1400,
        1200,
        1
      );

      // Expected for 1400 is ~0.76, so delta = 32 * (1 - 0.76) = ~8
      expect(whiteChange).toBe(8);
      expect(blackChange).toBe(-8);
      expect(newWhiteRating).toBe(1408);
      expect(newBlackRating).toBe(1192);
    });

    it('calculates draw between 1200 and 1400: underdog gains, favorite loses rating', () => {
      const { whiteChange, blackChange } = calculateEloChange(
        1200,
        1400,
        0.5 // Draw
      );

      // 1200 player gained rating from a draw against 1400 player
      expect(whiteChange).toBeGreaterThan(0);
      expect(blackChange).toBeLessThan(0);
    });
  });

  describe('Rating Categories & Time Control Mapping', () => {
    it('maps Bullet time controls correctly (< 180s total time)', () => {
      expect(getRatingCategory('1+0')).toBe(RatingCategory.BULLET);
      expect(getRatingCategory('2+1')).toBe(RatingCategory.BULLET);
      expect(getRatingCategory('1+1')).toBe(RatingCategory.BULLET);
    });

    it('maps Blitz time controls correctly (180s - 599s total time)', () => {
      expect(getRatingCategory('3+0')).toBe(RatingCategory.BLITZ);
      expect(getRatingCategory('3+2')).toBe(RatingCategory.BLITZ);
      expect(getRatingCategory('5+0')).toBe(RatingCategory.BLITZ);
      expect(getRatingCategory('5+3')).toBe(RatingCategory.BLITZ);
    });

    it('maps Rapid time controls correctly (600s - 1799s total time)', () => {
      expect(getRatingCategory('10+0')).toBe(RatingCategory.RAPID);
      expect(getRatingCategory('10+5')).toBe(RatingCategory.RAPID);
      expect(getRatingCategory('15+10')).toBe(RatingCategory.RAPID);
    });

    it('maps Classical time controls correctly (>= 1800s total time)', () => {
      expect(getRatingCategory('30+0')).toBe(RatingCategory.CLASSICAL);
      expect(getRatingCategory('30+20')).toBe(RatingCategory.CLASSICAL);
      expect(getRatingCategory('60+0')).toBe(RatingCategory.CLASSICAL);
    });
  });

  describe('Rating Service Idempotency & Database Flow', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('ignores unrated games (returns null without modifying database)', async () => {
      vi.spyOn(prisma.game, 'findUnique').mockResolvedValue({
        id: 'game-unrated',
        rated: false,
        whitePlayerId: 'user-1',
        blackPlayerId: 'user-2',
        result: GameResultStatus.WHITE_WIN,
        timeControl: '5+3',
      } as any);

      const result = await ratingService.processCompletedRatedGame('game-unrated');
      expect(result).toBeNull();
    });

    it('ignores ongoing games', async () => {
      vi.spyOn(prisma.game, 'findUnique').mockResolvedValue({
        id: 'game-ongoing',
        rated: true,
        whitePlayerId: 'user-1',
        blackPlayerId: 'user-2',
        result: GameResultStatus.ONGOING,
        timeControl: '5+3',
      } as any);

      const result = await ratingService.processCompletedRatedGame('game-ongoing');
      expect(result).toBeNull();
    });

    it('prevents double rating updates via existing RatingHistory records', async () => {
      vi.spyOn(prisma.game, 'findUnique').mockResolvedValue({
        id: 'game-already-processed',
        rated: true,
        whitePlayerId: 'user-1',
        blackPlayerId: 'user-2',
        result: GameResultStatus.WHITE_WIN,
        timeControl: '5+3',
      } as any);

      vi.spyOn(prisma.ratingHistory, 'findMany').mockResolvedValue([
        {
          id: 'rh-1',
          gameId: 'game-already-processed',
          userId: 'user-1',
          category: RatingCategory.BLITZ,
          ratingBefore: 1200,
          ratingChange: 16,
          ratingAfter: 1216,
          createdAt: new Date(),
        },
        {
          id: 'rh-2',
          gameId: 'game-already-processed',
          userId: 'user-2',
          category: RatingCategory.BLITZ,
          ratingBefore: 1200,
          ratingChange: -16,
          ratingAfter: 1184,
          createdAt: new Date(),
        },
      ] as any);

      const txSpy = vi.spyOn(prisma, '$transaction');

      const result = await ratingService.processCompletedRatedGame('game-already-processed');
      expect(result).toBeDefined();
      expect(result?.white.change).toBe(16);
      expect(result?.black.change).toBe(-16);
      // Transaction must NOT run again because history was already present
      expect(txSpy).not.toHaveBeenCalled();
    });
  });
});
