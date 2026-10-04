export type RatingCategory = 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';

export interface UserRating {
  category: RatingCategory;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  boardTheme: 'classic' | 'modern' | 'midnight' | 'highContrast';
  pieceSet: string;
  soundEnabled: boolean;
  animationEnabled: boolean;
  showLegalMoves: boolean;
  showCoordinates: boolean;
  highlightLastMove: boolean;
  confirmMoves: boolean;
  autoQueen: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  bio: string | null;
  createdAt: string;
  settings?: UserSettings | null;
  ratings?: UserRating[];
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface ChangePasswordCredentials {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword?: string;
}

export interface UpdateProfilePayload {
  displayName?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  bio?: string | null;
}

export interface UpdateSettingsPayload extends Partial<UserSettings> {}
