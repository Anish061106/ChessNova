export type RatingCategory = 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';

export interface UserRating {
  category: RatingCategory;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface UserProfileRatings {
  user: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    country?: string | null;
    createdAt?: string;
  };
  ratings: UserRating[];
}

export interface RatingHistoryItem {
  id: string;
  category: RatingCategory;
  gameId: string;
  ratingBefore: number;
  ratingChange: number;
  ratingAfter: number;
  createdAt: string;
  game?: {
    id: string;
    timeControl: string;
    result: string;
    terminationReason: string;
    whitePlayer?: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null } | null;
    blackPlayer?: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null } | null;
  } | null;
}

export interface LeaderboardItem {
  rank: number;
  id: string;
  userId: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

export interface LeaderboardResponse {
  category: RatingCategory;
  items: LeaderboardItem[];
  currentUserRank?: LeaderboardItem | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GameHistoryItem {
  id: string;
  timeControl: string;
  rated: boolean;
  result: 'WIN' | 'LOSS' | 'DRAW';
  gameResult: string;
  terminationReason: string;
  userColor: 'white' | 'black';
  opponent: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
  ratingBefore?: number;
  ratingChange?: number;
  ratingAfter?: number;
  playedAt: string;
  endedAt?: string | null;
}

export interface MoveReplayItem {
  id: string;
  moveNumber: number;
  ply: number;
  color: string;
  from: string;
  to: string;
  san: string;
  uci: string;
  fen: string;
  createdAt?: string;
}

export interface GameDetails {
  id: string;
  gameType: string;
  timeControl: string;
  initialTime: number;
  increment: number;
  rated: boolean;
  initialFen: string;
  finalFen: string;
  result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ONGOING';
  terminationReason: string;
  pgn?: string | null;
  createdAt: string;
  endedAt?: string | null;
  whitePlayer: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    country?: string | null;
  };
  blackPlayer?: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    country?: string | null;
  } | null;
  whiteRatingChange?: {
    before: number;
    change: number;
    after: number;
  } | null;
  blackRatingChange?: {
    before: number;
    change: number;
    after: number;
  } | null;
  moves: MoveReplayItem[];
}
