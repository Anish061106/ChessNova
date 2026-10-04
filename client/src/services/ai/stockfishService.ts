import { AIDifficulty, BestMoveResponse } from '../../types/ai';
import { AI_DIFFICULTIES } from './aiConfig';
import { computeBestMove } from './engineWorker';

export class StockfishService {
  private worker: Worker | null = null;
  private currentSessionId = 0;
  private pendingResolver: ((value: BestMoveResponse) => void) | null = null;
  private pendingRejecter: ((reason: any) => void) | null = null;
  private isInitialized = false;

  constructor() {
    this.initWorker();
  }

  /**
   * Initializes the engine Web Worker instance
   */
  private initWorker(): void {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return;
    }

    try {
      this.worker = new Worker(new URL('./engineWorker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (e: MessageEvent) => {
        const data = e.data;
        if (!data) return;

        if (data.type === 'bestmove') {
          // Drop response if it belongs to a previous or cancelled game session
          if (data.sessionId !== this.currentSessionId) {
            return;
          }

          if (this.pendingResolver) {
            this.pendingResolver({
              from: data.from,
              to: data.to,
              promotion: data.promotion,
              evalScore: data.evalScore,
              sessionId: data.sessionId,
            });
            this.pendingResolver = null;
            this.pendingRejecter = null;
          }
        } else if (data.type === 'error') {
          if (data.sessionId === this.currentSessionId && this.pendingRejecter) {
            this.pendingRejecter(new Error(data.message || 'Engine computation error'));
            this.pendingResolver = null;
            this.pendingRejecter = null;
          }
        }
      };

      this.worker.onerror = (err) => {
        if (this.pendingRejecter) {
          this.pendingRejecter(err);
          this.pendingResolver = null;
          this.pendingRejecter = null;
        }
      };

      this.isInitialized = true;
    } catch {
      // Fallback to in-process async execution for environments without Worker support
      this.worker = null;
      this.isInitialized = true;
    }
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

    // 1. If Web Worker is available, dispatch off-thread
    if (this.worker) {
      return new Promise<BestMoveResponse>((resolve, reject) => {
        this.pendingResolver = resolve;
        this.pendingRejecter = reject;

        this.worker!.postMessage({
          type: 'search',
          fen,
          depth: config.depth,
          skillLevel: config.skillLevel,
          maxThinkingMs: config.maxThinkingMs,
          sessionId: activeSession,
        });

        // Safety timeout in case worker hangs
        setTimeout(() => {
          if (this.pendingResolver && activeSession === this.currentSessionId) {
            // Direct fallback calculation
            try {
              const res = computeBestMove(fen, config.depth, config.skillLevel, config.maxThinkingMs);
              if (res) {
                resolve({ ...res, sessionId: activeSession });
              } else {
                reject(new Error('No legal moves found'));
              }
            } catch (err) {
              reject(err);
            }
          }
        }, config.maxThinkingMs + 1500);
      });
    }

    // 2. In-process fallback execution
    return new Promise<BestMoveResponse>((resolve, reject) => {
      // Small intentional delay to allow UI to render thinking indicators smoothly
      setTimeout(() => {
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
      }, config.minThinkingMs);
    });
  }

  /**
   * Immediately stops any ongoing search and discards pending callbacks
   */
  public stop(): void {
    this.currentSessionId += 1;
    if (this.pendingRejecter) {
      this.pendingRejecter(new Error('Calculation stopped'));
    }
    this.pendingResolver = null;
    this.pendingRejecter = null;
  }

  /**
   * Terminates the worker thread instance entirely
   */
  public terminate(): void {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const stockfishService = new StockfishService();
