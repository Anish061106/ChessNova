import { PlayerInfo } from '../../types/game.js';
import {
  MatchmakingQueueEntry,
  MatchResult,
  MatchmakingStatus,
} from '../../types/matchmaking.js';
import { VALID_TIME_CONTROLS, isValidTimeControl } from '../../types/timeControl.js';
import { MatchmakingStore, matchmakingStore } from './matchmakingStore.js';
import { gameManager } from '../games/gameManager.js';
import { logger } from '../../utils/logger.js';

export class MatchmakingService {
  constructor(private store: MatchmakingStore = matchmakingStore) {}

  /**
   * Enter the matchmaking queue for a specific time control
   */
  async joinQueue(
    user: PlayerInfo,
    socketId: string,
    timeControl = '5+3'
  ): Promise<MatchResult> {
    if (!isValidTimeControl(timeControl)) {
      throw new Error(`Invalid time control: ${timeControl}`);
    }

    // Check if player is currently in an ongoing active game
    if (gameManager.isPlayerInActiveGame(user.id)) {
      throw new Error('You are already playing in an active online game');
    }

    const config = VALID_TIME_CONTROLS[timeControl];

    // Attempt to match with an existing queued player
    const opponentEntry = this.store.findMatch({ timeControl }, user.id);

    if (opponentEntry) {
      // Opponent found! Create game session
      const isUserWhite = Math.random() < 0.5;
      const whitePlayer = isUserWhite ? user : opponentEntry.user;
      const blackPlayer = isUserWhite ? opponentEntry.user : user;

      const activeGame = await gameManager.createMatchedGame(
        whitePlayer,
        blackPlayer,
        timeControl
      );

      logger.info(
        `[Matchmaking] Match found: ${user.username} vs ${opponentEntry.user.username} (${timeControl}) -> Game ${activeGame.gameId}`
      );

      return {
        matched: true,
        gameId: activeGame.gameId,
        whitePlayer,
        blackPlayer,
        timeControl,
        queueEntry: opponentEntry,
      };
    }

    // No opponent found yet; add user to queue
    const queueEntry: MatchmakingQueueEntry = {
      userId: user.id,
      user,
      socketId,
      timeControl,
      initialTime: config.initialTime,
      increment: config.increment,
      joinedAt: Date.now(),
    };

    this.store.add(queueEntry);

    logger.info(
      `[Matchmaking] User ${user.username} joined queue for ${timeControl}. Total in queue: ${this.store.getQueueLength(timeControl)}`
    );

    return {
      matched: false,
      queueEntry,
    };
  }

  /**
   * Cancel active queue search
   */
  cancelQueue(userId: string): boolean {
    const entry = this.store.remove(userId);
    if (entry) {
      logger.info(`[Matchmaking] User ${entry.user.username} cancelled matchmaking for ${entry.timeControl}`);
      return true;
    }
    return false;
  }

  /**
   * Get player's current queue status
   */
  getStatus(userId: string): MatchmakingStatus {
    const entry = this.store.getEntry(userId);
    if (!entry) {
      return { inQueue: false };
    }

    return {
      inQueue: true,
      timeControl: entry.timeControl,
      joinedAt: entry.joinedAt,
      queueLength: this.store.getQueueLength(entry.timeControl),
    };
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnect(socketId: string): MatchmakingQueueEntry | null {
    const entry = this.store.removeBySocketId(socketId);
    if (entry) {
      logger.info(`[Matchmaking] Cleaned up queue entry on disconnect for user ${entry.user.username}`);
    }
    return entry;
  }
}

export const matchmakingService = new MatchmakingService();
