import { Color, TimeControl } from './chess';

export type AIDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

export type AIPlayerColorChoice = 'white' | 'black' | 'random';

export interface AIDifficultyConfig {
  id: AIDifficulty;
  name: string;
  tagline: string;
  depth: number;
  skillLevel: number; // 0 to 20
  minThinkingMs: number;
  maxThinkingMs: number;
  estimatedElo: number;
  avatarIcon: string;
  badgeColor: string;
}

export interface ComputerGameSettings {
  difficulty: AIDifficulty;
  humanColorChoice: AIPlayerColorChoice;
  timeControl: TimeControl;
}

export interface ComputerGameSession {
  sessionId: number;
  difficulty: AIDifficulty;
  humanColor: Color;
  aiColor: Color;
  timeControl: TimeControl;
  isThinking: boolean;
  engineReady: boolean;
  engineError: string | null;
}

export interface BestMoveResponse {
  from: string;
  to: string;
  promotion?: string;
  san?: string;
  evalScore?: number;
  sessionId: number;
}
