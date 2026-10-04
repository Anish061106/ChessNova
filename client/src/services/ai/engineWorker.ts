import { Chess, Square } from 'chess.js';

// Piece values in centipawns
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// PeSTO piece-square tables (MiddleGame) for positional evaluation
const PAWN_TABLE_MG = [
  0, 0, 0, 0, 0, 0, 0, 0,
  98, 134, 61, 95, 68, 126, 34, -11,
  -6, 7, 26, 31, 65, 56, 25, -20,
  -14, 13, 6, 21, 23, 12, 17, -23,
  -27, -2, -5, 12, 17, 6, 10, -25,
  -26, -4, -4, -10, 3, 3, 33, -12,
  -35, -1, -20, -23, -15, 24, 38, -22,
  0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_TABLE_MG = [
  -167, -89, -34, -49, 61, -97, -15, -107,
  -73, -41, 72, 36, 23, 62, 7, -17,
  -47, 60, 37, 65, 84, 129, 73, 44,
  -9, 17, 19, 53, 37, 69, 18, 22,
  -13, 4, 16, 13, 28, 19, 21, -8,
  -23, -9, 12, 10, 19, 17, 25, -16,
  -29, -53, -12, -3, -1, 18, -14, -19,
  -105, -21, -58, -33, -17, -28, -19, -23,
];

const BISHOP_TABLE_MG = [
  -29, 4, -82, -37, -25, -42, 7, -8,
  -26, 16, -18, -13, 30, 59, 18, -47,
  -16, 37, 43, 40, 35, 50, 37, -2,
  -4, 5, 19, 50, 37, 37, 7, -2,
  -6, 13, 13, 26, 34, 12, 10, 4,
  0, 15, -15, 15, 14, 15, 26, 1,
  15, 8, 19, 4, 2, 23, 10, 20,
  -33, -3, -14, -21, -13, -12, -39, -21,
];

const ROOK_TABLE_MG = [
  32, 42, 32, 51, 63, 9, 31, 43,
  27, 32, 58, 62, 80, 67, 26, 44,
  -5, 19, 26, 36, 17, 45, 61, 16,
  -24, -11, 7, 26, 24, 35, -8, -20,
  -36, -26, -12, -1, 9, -7, 6, -23,
  -45, -25, -16, -17, 3, 0, -5, -33,
  -44, -16, -20, -9, -1, 11, -6, -71,
  -19, -13, 1, 17, 16, 7, -37, -26,
];

const QUEEN_TABLE_MG = [
  -28, 0, 29, 12, 59, 44, 43, 45,
  -24, -39, -5, 1, -16, 57, 28, 54,
  -13, -17, 7, 8, 29, 56, 47, 57,
  -27, -27, -16, -16, -1, 17, -2, 1,
  -9, -26, -9, -10, -2, -4, 3, -3,
  -14, 2, -11, -2, -5, 2, 14, 5,
  -35, -8, 11, 2, 8, 15, -3, 1,
  -1, -18, -9, 10, -15, -25, -31, -50,
];

const KING_TABLE_MG = [
  -65, 23, 16, -15, -56, -34, 2, 13,
  29, -1, -20, -7, -8, -4, -38, -29,
  -9, 24, 2, -16, -20, 6, 22, -22,
  -17, -20, -12, -27, -30, -25, -14, -36,
  -49, -1, -27, -39, -46, -44, -33, -51,
  -14, -14, -22, -46, -44, -30, -15, -27,
  1, 7, -8, -64, -43, -16, 9, 8,
  -15, 36, 12, -54, 8, -28, 24, 14,
];

function getSquareIndex(square: Square, color: 'w' | 'b'): number {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1], 10) - 1;
  const row = 7 - rank;
  const col = file;
  const idx = row * 8 + col;
  return color === 'w' ? idx : (7 - row) * 8 + col;
}

function evaluatePosition(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -30000 : 30000;
  }
  if (chess.isDraw()) {
    return 0;
  }

  let whiteScore = 0;
  let blackScore = 0;

  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const file = String.fromCharCode('a'.charCodeAt(0) + c);
      const rank = (8 - r).toString();
      const sq = `${file}${rank}` as Square;
      const val = PIECE_VALUES[piece.type] || 0;
      const idx = getSquareIndex(sq, piece.color);

      let psqt = 0;
      if (piece.type === 'p') psqt = PAWN_TABLE_MG[idx] || 0;
      else if (piece.type === 'n') psqt = KNIGHT_TABLE_MG[idx] || 0;
      else if (piece.type === 'b') psqt = BISHOP_TABLE_MG[idx] || 0;
      else if (piece.type === 'r') psqt = ROOK_TABLE_MG[idx] || 0;
      else if (piece.type === 'q') psqt = QUEEN_TABLE_MG[idx] || 0;
      else if (piece.type === 'k') psqt = KING_TABLE_MG[idx] || 0;

      const totalPieceVal = val + psqt;

      if (piece.color === 'w') {
        whiteScore += totalPieceVal;
      } else {
        blackScore += totalPieceVal;
      }
    }
  }

  return whiteScore - blackScore;
}

function alphaBeta(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  deadline: number
): number {
  if (Date.now() > deadline || depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess);
  }

  const moves = chess.moves({ verbose: true });
  // Move ordering: sort captures and promotions first for faster alpha-beta cutoff
  moves.sort((a, b) => {
    const scoreA = (a.captured ? PIECE_VALUES[a.captured] : 0) + (a.promotion ? 800 : 0);
    const scoreB = (b.captured ? PIECE_VALUES[b.captured] : 0) + (b.promotion ? 800 : 0);
    return scoreB - scoreA;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalVal = alphaBeta(chess, depth - 1, alpha, beta, false, deadline);
      chess.undo();
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalVal = alphaBeta(chess, depth - 1, alpha, beta, true, deadline);
      chess.undo();
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function computeBestMove(
  fen: string,
  depth: number,
  skillLevel: number,
  maxTimeMs: number
): { from: string; to: string; promotion?: string; evalScore: number } | null {
  const chess = new Chess(fen);
  if (chess.isGameOver()) return null;

  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  const isWhite = chess.turn() === 'w';
  const deadline = Date.now() + maxTimeMs;

  const scoredMoves: Array<{ move: any; score: number }> = [];

  for (const move of legalMoves) {
    chess.move(move);
    const score = alphaBeta(chess, depth - 1, -Infinity, Infinity, !isWhite, deadline);
    chess.undo();
    scoredMoves.push({ move, score });
  }

  // Sort moves from best to worst for current player
  scoredMoves.sort((a, b) => (isWhite ? b.score - a.score : a.score - b.score));

  // Determine blunder probability based on skill level (0 to 20)
  // Skill 20 = 0% blunder, Skill 2 = 35% random pick among top legal moves
  const blunderProbability = Math.max(0, (20 - skillLevel) * 0.025);
  let chosenMove = scoredMoves[0].move;

  if (Math.random() < blunderProbability && scoredMoves.length > 1) {
    // Pick randomly from top 3 moves to simulate human novice/casual play
    const candidatePool = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    const randomIdx = Math.floor(Math.random() * candidatePool.length);
    chosenMove = candidatePool[randomIdx].move;
  }

  return {
    from: chosenMove.from,
    to: chosenMove.to,
    promotion: chosenMove.promotion,
    evalScore: scoredMoves[0].score,
  };
}

export const calculateEngineBestMove = (
  fen: string,
  depth: number,
  skillLevel: number,
  maxTimeMs: number
): { from: string; to: string; promotion?: string; evalScore: number } => {
  const res = computeBestMove(fen, depth, skillLevel, maxTimeMs);
  return res || { from: '', to: '', promotion: undefined, evalScore: 0 };
};

// Web Worker message listener for standard UCI commands and custom JSON protocol
if (typeof self !== 'undefined' && typeof (self as any).addEventListener === 'function') {
  self.addEventListener('message', (e: MessageEvent) => {
    const { type, fen, depth, skillLevel, maxThinkingMs, sessionId } = e.data || {};

    if (type === 'search') {
      try {
        const result = computeBestMove(fen, depth || 6, skillLevel ?? 10, maxThinkingMs || 1000);
        if (result) {
          self.postMessage({
            type: 'bestmove',
            from: result.from,
            to: result.to,
            promotion: result.promotion,
            evalScore: result.evalScore,
            sessionId,
          });
        } else {
          self.postMessage({
            type: 'error',
            message: 'No legal moves available or game is over',
            sessionId,
          });
        }
      } catch (err: any) {
        self.postMessage({
          type: 'error',
          message: err?.message || 'Calculation error',
          sessionId,
        });
      }
    } else if (type === 'ping') {
      self.postMessage({ type: 'pong' });
    }
  });
}
