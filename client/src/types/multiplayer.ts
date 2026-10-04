export type PlayerColor = 'w' | 'b';
export type OnlineGameStatus = 'WAITING' | 'READY' | 'ACTIVE' | 'FINISHED';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface OnlinePlayer {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  rating?: number;
}

export type PlayerInfo = OnlinePlayer;


export interface MoveRecord {
  moveNumber: number;
  ply: number;
  color: string;
  from: string;
  to: string;
  san: string;
  fen: string;
}

export interface LastMove {
  from: string;
  to: string;
  san: string;
  color: PlayerColor;
  piece?: string;
}

export interface OnlineGameState {
  gameId: string | null;
  status: OnlineGameStatus;
  timeControl: string;
  initialTime: number;
  increment: number;
  whitePlayer: OnlinePlayer | null;
  blackPlayer: OnlinePlayer | null;
  playerColor: 'white' | 'black' | null;
  fen: string;
  turn: PlayerColor;
  moveHistory: MoveRecord[];
  lastMove: LastMove | null;
  whiteTime: number;
  blackTime: number;
  activeColor: PlayerColor;
  isCheck: boolean;
  isGameOver: boolean;
  result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ONGOING' | null;
  terminationReason: string | null;
  whiteConnected: boolean;
  blackConnected: boolean;
  drawOfferedBy: PlayerColor | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
}
