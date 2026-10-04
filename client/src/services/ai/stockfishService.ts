import { AIDifficulty, BestMoveResponse } from '../../types/ai';
import { AI_DIFFICULTIES } from './aiConfig';
import { computeBestMove } from './engineWorker';

export class StockfishService {
  private currentSessionId = 0;
  private isInitialized = true;
  private pendingTimer: any = null;
  private pendingReject: ((err: Error) => void) | null = null;

  constructor() {
    this.isInitialized = true;
  }

  /**
   * Checks if engine service is ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Generates a new session generation ID, cancelling any pending previous calculations
   */
  public createNewSession(): number {
    this.stop();
    this.currentSessionId += 1;
    return this.currentSessionId;
  }

  /**
   * Asynchronously calculates best move for given FEN and difficulty
   */
  public async requestBestMove(
    fen: string,
    difficulty: AIDifficulty = 'medium',
    sessionId?: number
  ): Promise<BestMoveResponse> {
    const activeSession = sessionId ?? this.currentSessionId;
    const config = AI_DIFFICULTIES[difficulty] || AI_DIFFICULTIES.medium;

    return new Promise<BestMoveResponse>((resolve, reject) => {
      this.pendingReject = reject;

      // Natural thinking delay according to difficulty
      const thinkingTime = Math.min(
        config.maxThinkingMs,
        Math.max(config.minThinkingMs, Math.floor(Math.random() * (config.maxThinkingMs - config.minThinkingMs + 1)) + config.minThinkingMs)
      );

      this.pendingTimer = setTimeout(() => {
        this.pendingReject = null;
        if (activeSession !== this.currentSessionId) {
          reject(new Error('Calculation cancelled: session expired'));
          return;
        }

        try {
          const res = computeBestMove(fen, config.depth, config.skillLevel, config.maxThinkingMs);
          if (res) {
            resolve({
              from: res.from,
              to: res.to,
              promotion: res.promotion,
              evalScore: res.evalScore,
              sessionId: activeSession,
            });
          } else {
            reject(new Error('No legal moves available'));
          }
        } catch (err) {
          reject(err);
        }
      }, thinkingTime);
    });
  }

  /**
   * Immediately stops any ongoing search and discards pending callbacks
   */
  public stop(): void {
    this.currentSessionId += 1;
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
    if (this.pendingReject) {
      this.pendingReject(new Error('Calculation stopped'));
      this.pendingReject = null;
    }
  }

  /**
   * Terminates the engine instance
   */
  public terminate(): void {
    this.stop();
  }
}

export const stockfishService = new StockfishService();
