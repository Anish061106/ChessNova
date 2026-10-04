import { GameResultStatus, TerminationReason, GameType, RatingCategory } from '@prisma/client';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validates request body against a Zod schema and returns parsed typed data.
 * Throws structured 400 error if validation fails.
 */
export function validateBody<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const zodError = result.error as ZodError;
    const firstIssue = zodError.issues[0];
    const message = firstIssue ? firstIssue.message : 'Invalid request payload';

    const error: any = new Error(message);
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    error.issues = zodError.issues;
    throw error;
  }
  return result.data;
}

/**
 * Validates whether a given string is a plausible chess FEN string.
 * Standard FEN has 6 space-separated fields.
 */
export function isValidFen(fen: string): boolean {
  if (!fen || typeof fen !== 'string') return false;
  const parts = fen.trim().split(/\s+/);
  if (parts.length !== 6) return false;

  const [ranks, turn, castling, enPassant, halfMove, fullMove] = parts;

  // Validate ranks (must have 8 rows separated by /)
  const rankList = ranks.split('/');
  if (rankList.length !== 8) return false;

  // Validate active turn
  if (turn !== 'w' && turn !== 'b') return false;

  // Validate castling
  if (!/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(castling)) return false;

  // Validate en passant square (- or a3-h3 / a6-h6)
  if (!/^(-|[a-h][36])$/.test(enPassant)) return false;

  // Validate clock numbers
  if (isNaN(parseInt(halfMove, 10)) || isNaN(parseInt(fullMove, 10))) return false;

  return true;
}

/**
 * Validates time control format like "5+3", "10+0", "1+0"
 */
export function isValidTimeControl(tc: string): boolean {
  if (!tc || typeof tc !== 'string') return false;
  return /^\d+\+\d+$/.test(tc.trim());
}

/**
 * Validates chess UCI move format (e.g. "e2e4", "e7e8q")
 */
export function isValidUciMove(uci: string): boolean {
  if (!uci || typeof uci !== 'string') return false;
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci.trim());
}

/**
 * Validates GameResultStatus enum value
 */
export function isValidGameResult(result: string): result is GameResultStatus {
  return Object.values(GameResultStatus).includes(result as GameResultStatus);
}

/**
 * Validates TerminationReason enum value
 */
export function isValidTerminationReason(reason: string): reason is TerminationReason {
  return Object.values(TerminationReason).includes(reason as TerminationReason);
}

/**
 * Validates GameType enum value
 */
export function isValidGameType(type: string): type is GameType {
  return Object.values(GameType).includes(type as GameType);
}

/**
 * Validates RatingCategory enum value
 */
export function isValidRatingCategory(cat: string): cat is RatingCategory {
  return Object.values(RatingCategory).includes(cat as RatingCategory);
}
