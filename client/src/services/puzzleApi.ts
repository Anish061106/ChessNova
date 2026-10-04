import { Puzzle, PuzzleAttemptResult, PuzzleAttemptRecord, PuzzleFilterOptions } from '../types/puzzle';

const API_BASE = '/api/puzzles';

export const puzzleApi = {
  /**
   * Fetch list of puzzles with filters
   */
  async listPuzzles(options: PuzzleFilterOptions = {}): Promise<{ puzzles: Puzzle[]; total: number }> {
    const params = new URLSearchParams();
    if (options.difficulty) params.append('difficulty', options.difficulty);
    if (options.theme) params.append('theme', options.theme);
    if (options.minRating) params.append('minRating', String(options.minRating));
    if (options.maxRating) params.append('maxRating', String(options.maxRating));
    if (options.limit) params.append('limit', String(options.limit));
    if (options.offset) params.append('offset', String(options.offset));

    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      credentials: 'include',
    });
    const data = await res.json();
    return {
      puzzles: data.data || [],
      total: data.total || 0,
    };
  },

  /**
   * Fetch random or next tactical puzzle
   */
  async getRandomPuzzle(difficulty?: string): Promise<Puzzle> {
    const params = new URLSearchParams();
    if (difficulty) params.append('difficulty', difficulty);

    const res = await fetch(`${API_BASE}/random?${params.toString()}`, {
      credentials: 'include',
    });
    const data = await res.json();
    return data.data;
  },

  /**
   * Fetch single puzzle by ID
   */
  async getPuzzleById(id: string): Promise<Puzzle> {
    const res = await fetch(`${API_BASE}/${id}`, {
      credentials: 'include',
    });
    const data = await res.json();
    return data.data;
  },

  /**
   * Validate a step move on the server
   */
  async validateMove(puzzleId: string, moveUci: string, moveIndex: number): Promise<PuzzleAttemptResult> {
    const res = await fetch(`${API_BASE}/${puzzleId}/validate-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ moveUci, moveIndex }),
    });
    const data = await res.json();
    return data.data;
  },

  /**
   * Record attempt upon puzzle completion or failure
   */
  async submitAttempt(
    puzzleId: string,
    correct: boolean,
    moves: string[],
    timeTaken: number
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/${puzzleId}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ correct, moves, timeTaken }),
    });
    return res.json();
  },

  /**
   * Fetch user's puzzle solve history
   */
  async getHistory(limit = 20): Promise<PuzzleAttemptRecord[]> {
    const res = await fetch(`${API_BASE}/history?limit=${limit}`, {
      credentials: 'include',
    });
    const data = await res.json();
    return data.data || [];
  },
};
