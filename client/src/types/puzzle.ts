export interface Puzzle {
  id: string;
  fen: string;
  pgn: string | null;
  rating: number;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  themes: string[];
  initialPlyColor: 'w' | 'b';
  totalMoves: number;
  createdAt: string;
}

export interface PuzzleAttemptResult {
  isCorrect: boolean;
  isComplete: boolean;
  opponentResponseUci?: string;
  nextExpectedMoveIndex?: number;
}

export interface PuzzleAttemptRecord {
  id: string;
  puzzleId: string;
  correct: boolean;
  moves: string[];
  timeTaken: number;
  createdAt: string;
  puzzle?: {
    id: string;
    rating: number;
    difficulty: string;
    themes: string[];
  };
}

export interface PuzzleFilterOptions {
  difficulty?: string;
  theme?: string;
  minRating?: number;
  maxRating?: number;
  limit?: number;
  offset?: number;
}
