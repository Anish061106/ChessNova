import type { Square, PieceSymbol, Color } from 'chess.js';

export type { Square, PieceSymbol, Color };

export type BoardOrientation = 'white' | 'black';

export type BoardThemeName = 'classic' | 'modern' | 'midnight' | 'highContrast';

export interface BoardThemeColors {
  name: string;
  lightSquare: string;
  darkSquare: string;
  selectedSquare: string;
  lastMoveSquare: string;
  legalMoveDot: string;
  legalCaptureRing: string;
  checkSquare: string;
  coordinateLight: string;
  coordinateDark: string;
}

export interface LegalDestination {
  square: Square;
  isCapture: boolean;
}

export interface PendingPromotion {
  from: Square;
  to: Square;
}

export interface MoveRecord {
  san: string;
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
}

export interface PairedMove {
  moveNumber: number;
  white?: MoveRecord;
  black?: MoveRecord;
}

export type TimeControlCategory = 'bullet' | 'blitz' | 'rapid' | 'classical';

export interface TimeControl {
  id: string;
  name: string;
  category: TimeControlCategory;
  minutes: number;
  incrementSeconds: number;
}

export const TIME_CONTROLS: TimeControl[] = [
  // Bullet
  { id: '1+0', name: '1 + 0', category: 'bullet', minutes: 1, incrementSeconds: 0 },
  { id: '2+1', name: '2 + 1', category: 'bullet', minutes: 2, incrementSeconds: 1 },
  // Blitz
  { id: '3+0', name: '3 + 0', category: 'blitz', minutes: 3, incrementSeconds: 0 },
  { id: '3+2', name: '3 + 2', category: 'blitz', minutes: 3, incrementSeconds: 2 },
  { id: '5+0', name: '5 + 0', category: 'blitz', minutes: 5, incrementSeconds: 0 },
  { id: '5+3', name: '5 + 3', category: 'blitz', minutes: 5, incrementSeconds: 3 },
  // Rapid
  { id: '10+0', name: '10 + 0', category: 'rapid', minutes: 10, incrementSeconds: 0 },
  { id: '10+5', name: '10 + 5', category: 'rapid', minutes: 10, incrementSeconds: 5 },
  { id: '15+10', name: '15 + 10', category: 'rapid', minutes: 15, incrementSeconds: 10 },
  // Classical
  { id: '30+0', name: '30 + 0', category: 'classical', minutes: 30, incrementSeconds: 0 },
  { id: '30+20', name: '30 + 20', category: 'classical', minutes: 30, incrementSeconds: 20 },
];

export interface GameResult {
  winner: Color | 'draw';
  reason:
    | 'checkmate'
    | 'stalemate'
    | 'threefold_repetition'
    | 'insufficient_material'
    | '50_move_rule'
    | 'timeout'
    | 'resignation';
}

export interface CapturedPiecesState {
  white: PieceSymbol[]; // pieces captured by White (i.e. Black pieces lost)
  black: PieceSymbol[]; // pieces captured by Black (i.e. White pieces lost)
  whiteAdvantage: number; // point differential (+ for white, - for black)
}

export interface ClockState {
  whiteTimeMs: number;
  blackTimeMs: number;
  activeColor: Color | null;
  isRunning: boolean;
  isPaused: boolean;
  timeControl: TimeControl;
}

export interface PlayerInfo {
  id: string;
  name: string;
  color: Color;
  ratingPlaceholder: number;
}

