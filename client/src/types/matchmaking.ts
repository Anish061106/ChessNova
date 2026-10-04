import { PlayerInfo, PlayerColor } from './multiplayer';

export type MatchmakingStateStatus = 'idle' | 'searching' | 'matched' | 'error';

export interface MatchmakingMatchedPayload {
  gameId: string;
  color: PlayerColor;
  opponent: PlayerInfo;
  timeControl: string;
}

export interface MatchmakingState {
  status: MatchmakingStateStatus;
  timeControl: string | null;
  startedAt: number | null;
  gameId: string | null;
  matchedData: MatchmakingMatchedPayload | null;
  error: string | null;
}
