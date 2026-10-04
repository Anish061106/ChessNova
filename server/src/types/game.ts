export type PlayerColor = 'w' | 'b';

export type OnlineGameStatus = 'WAITING' | 'READY' | 'ACTIVE' | 'FINISHED';

export interface PlayerInfo {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  rating?: number;
}

export interface LastMoveInfo {
  from: string;
  to: string;
  san: string;
  color: PlayerColor;
  piece?: string;
}

export interface GameStatePayload {
  gameId: string;
  status: OnlineGameStatus;
  timeControl: string;
  initialTime: number;
  increment: number;
  whitePlayer: PlayerInfo;
  blackPlayer: PlayerInfo | null;
  playerColor?: 'white' | 'black';
  fen: string;
  turn: PlayerColor;
  moveHistory: {
    moveNumber: number;
    ply: number;
    color: string;
    from: string;
    to: string;
    san: string;
    fen: string;
  }[];
  lastMove: LastMoveInfo | null;
  whiteTime: number; // in seconds
  blackTime: number; // in seconds
  activeColor: PlayerColor;
  isCheck: boolean;
  isGameOver: boolean;
  result?: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ONGOING';
  terminationReason?: string | null;
  whiteConnected: boolean;
  blackConnected: boolean;
}

export interface MovePayload {
  gameId: string;
  from: string;
  to: string;
  san: string;
  fen: string;
  turn: PlayerColor;
  whiteTime: number;
  blackTime: number;
  ply: number;
  moveNumber: number;
  isCheck: boolean;
  isGameOver: boolean;
  result?: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ONGOING';
  terminationReason?: string | null;
}

export interface GameEndedPayload {
  gameId: string;
  result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW';
  terminationReason: string;
  winnerColor?: 'white' | 'black' | null;
  winnerName?: string | null;
  finalFen: string;
  pgn?: string;
  ratingChanges?: {
    category?: string;
    white?: {
      userId: string;
      before: number;
      change: number;
      after: number;
    };
    black?: {
      userId: string;
      before: number;
      change: number;
      after: number;
    };
  } | null;
}
