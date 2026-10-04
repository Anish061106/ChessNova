import { PlayerInfo } from './game.js';

export interface MatchmakingQueueEntry {
  userId: string;
  user: PlayerInfo;
  socketId: string;
  timeControl: string;
  initialTime: number;
  increment: number;
  joinedAt: number;
}

export interface MatchCriteria {
  timeControl: string;
}

export interface MatchResult {
  matched: boolean;
  gameId?: string;
  whitePlayer?: PlayerInfo;
  blackPlayer?: PlayerInfo;
  timeControl?: string;
  queueEntry?: MatchmakingQueueEntry;
}

export interface MatchmakingStatus {
  inQueue: boolean;
  timeControl?: string;
  joinedAt?: number;
  queueLength?: number;
}
