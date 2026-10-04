import { RatingCategory } from '@prisma/client';

export const DEFAULT_RATING = 1200;
export const DEFAULT_K_FACTOR = 32;

/**
 * Maps time control string to standard RatingCategory
 * @param timeControl e.g. "5+3", "10+0", "1+0"
 */
export function getRatingCategory(timeControl: string): RatingCategory {
  const parts = timeControl.split('+');
  const initialMinutes = parseInt(parts[0] || '5', 10);
  const increment = parseInt(parts[1] || '0', 10);

  // Approximate total game duration per player in seconds (60 moves benchmark)
  const totalSeconds = initialMinutes * 60 + increment * 40;

  if (totalSeconds < 180) {
    // Under 3 minutes total -> Bullet (e.g. 1+0, 2+1)
    return RatingCategory.BULLET;
  } else if (totalSeconds < 600) {
    // 3 to under 10 minutes -> Blitz (e.g. 3+0, 3+2, 5+0, 5+3)
    return RatingCategory.BLITZ;
  } else if (totalSeconds < 1800) {
    // 10 to under 30 minutes -> Rapid (e.g. 10+0, 10+5, 15+10)
    return RatingCategory.RAPID;
  } else {
    // 30 minutes and above -> Classical (e.g. 30+0, 30+20)
    return RatingCategory.CLASSICAL;
  }
}

/**
 * Calculate expected score for player A against player B in standard Elo system
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate Elo rating adjustments for both players
 * @param ratingA White's current rating
 * @param ratingB Black's current rating
 * @param actualScoreA White's score (1 = win, 0.5 = draw, 0 = loss)
 * @param kFactor K-factor (default 32)
 */
export function calculateEloChange(
  ratingA: number,
  ratingB: number,
  actualScoreA: number,
  kFactor = DEFAULT_K_FACTOR
): {
  whiteChange: number;
  blackChange: number;
  newWhiteRating: number;
  newBlackRating: number;
} {
  const expectedA = calculateExpectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;
  const actualScoreB = 1 - actualScoreA;

  const whiteChange = Math.round(kFactor * (actualScoreA - expectedA));
  const blackChange = Math.round(kFactor * (actualScoreB - expectedB));

  return {
    whiteChange,
    blackChange,
    newWhiteRating: Math.max(100, ratingA + whiteChange),
    newBlackRating: Math.max(100, ratingB + blackChange),
  };
}
