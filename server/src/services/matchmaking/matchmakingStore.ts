import { MatchmakingQueueEntry, MatchCriteria } from '../../types/matchmaking.js';

export interface MatchmakingStore {
  add(entry: MatchmakingQueueEntry): void;
  remove(userId: string): MatchmakingQueueEntry | null;
  removeBySocketId(socketId: string): MatchmakingQueueEntry | null;
  findMatch(criteria: MatchCriteria, excludeUserId?: string): MatchmakingQueueEntry | null;
  getEntry(userId: string): MatchmakingQueueEntry | null;
  getQueueLength(timeControl?: string): number;
  clear(): void;
}

export class InMemoryMatchmakingStore implements MatchmakingStore {
  // Map of userId -> MatchmakingQueueEntry
  private userEntries: Map<string, MatchmakingQueueEntry> = new Map();
  // Map of timeControl -> Array of userIds (FIFO queue)
  private queuesByTimeControl: Map<string, string[]> = new Map();

  public add(entry: MatchmakingQueueEntry): void {
    // If user is already queued elsewhere, remove previous entry first
    this.remove(entry.userId);

    this.userEntries.set(entry.userId, entry);

    const tcQueue = this.queuesByTimeControl.get(entry.timeControl) || [];
    tcQueue.push(entry.userId);
    this.queuesByTimeControl.set(entry.timeControl, tcQueue);
  }

  public remove(userId: string): MatchmakingQueueEntry | null {
    const entry = this.userEntries.get(userId);
    if (!entry) return null;

    this.userEntries.delete(userId);

    const tcQueue = this.queuesByTimeControl.get(entry.timeControl);
    if (tcQueue) {
      const filtered = tcQueue.filter((id) => id !== userId);
      if (filtered.length > 0) {
        this.queuesByTimeControl.set(entry.timeControl, filtered);
      } else {
        this.queuesByTimeControl.delete(entry.timeControl);
      }
    }

    return entry;
  }

  public removeBySocketId(socketId: string): MatchmakingQueueEntry | null {
    for (const entry of this.userEntries.values()) {
      if (entry.socketId === socketId) {
        return this.remove(entry.userId);
      }
    }
    return null;
  }

  /**
   * Find first compatible opponent in FIFO order matching criteria
   */
  public findMatch(criteria: MatchCriteria, excludeUserId?: string): MatchmakingQueueEntry | null {
    const queue = this.queuesByTimeControl.get(criteria.timeControl);
    if (!queue || queue.length === 0) return null;

    for (let i = 0; i < queue.length; i++) {
      const candidateUserId = queue[i];
      if (candidateUserId !== excludeUserId) {
        const candidateEntry = this.userEntries.get(candidateUserId);
        if (candidateEntry) {
          // Remove candidate from queue atomically
          this.remove(candidateUserId);
          return candidateEntry;
        }
      }
    }

    return null;
  }

  public getEntry(userId: string): MatchmakingQueueEntry | null {
    return this.userEntries.get(userId) || null;
  }

  public getQueueLength(timeControl?: string): number {
    if (timeControl) {
      return this.queuesByTimeControl.get(timeControl)?.length || 0;
    }
    return this.userEntries.size;
  }

  public clear(): void {
    this.userEntries.clear();
    this.queuesByTimeControl.clear();
  }
}

export const matchmakingStore = new InMemoryMatchmakingStore();
