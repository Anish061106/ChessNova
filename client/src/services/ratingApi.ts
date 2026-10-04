import { api } from './api';
import {
  RatingCategory,
  LeaderboardResponse,
  UserProfileRatings,
  RatingHistoryItem,
  GameHistoryItem,
  GameDetails,
} from '../types/rating';

export const ratingApi = {
  /**
   * Fetch global leaderboard for category
   */
  async getLeaderboard(
    category: RatingCategory = 'BLITZ',
    page = 1,
    limit = 50
  ): Promise<LeaderboardResponse> {
    const res = await api.get<{
      success: boolean;
      category: RatingCategory;
      items: LeaderboardResponse['items'];
      currentUserRank?: LeaderboardResponse['currentUserRank'];
      pagination: LeaderboardResponse['pagination'];
    }>(`/leaderboard?category=${category}&page=${page}&limit=${limit}`);

    return {
      category: res.category,
      items: res.items || [],
      currentUserRank: res.currentUserRank || null,
      pagination: res.pagination,
    };
  },

  /**
   * Fetch user ratings by username
   */
  async getUserRatings(username: string): Promise<UserProfileRatings> {
    const res = await api.get<{
      success: boolean;
      user: UserProfileRatings['user'];
      ratings: UserProfileRatings['ratings'];
    }>(`/ratings/user/${username}`);

    return {
      user: res.user,
      ratings: res.ratings || [],
    };
  },

  /**
   * Fetch authenticated user's rating progression
   */
  async getMyRatingHistory(
    category?: RatingCategory,
    page = 1,
    limit = 20
  ): Promise<{ items: RatingHistoryItem[]; pagination: any }> {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(category ? { category } : {}),
    });

    const res = await api.get<{
      success: boolean;
      items: RatingHistoryItem[];
      pagination: any;
    }>(`/users/me/rating-history?${query.toString()}`);

    return {
      items: res.items || [],
      pagination: res.pagination,
    };
  },

  /**
   * Fetch authenticated user's game history with filters
   */
  async getMyGameHistory(options: {
    category?: string;
    result?: string;
    rated?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: GameHistoryItem[]; pagination: any }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', String(options.page));
    if (options.limit) params.append('limit', String(options.limit));
    if (options.category && options.category !== 'ALL') params.append('category', options.category);
    if (options.result && options.result !== 'ALL') params.append('result', options.result.toLowerCase());
    if (typeof options.rated === 'boolean') params.append('rated', String(options.rated));

    const res = await api.get<{
      success: boolean;
      items: GameHistoryItem[];
      pagination: any;
    }>(`/games/history?${params.toString()}`);

    return {
      items: res.items || [],
      pagination: res.pagination,
    };
  },

  /**
   * Fetch detailed game moves & metadata for replay
   */
  async getGameDetails(gameId: string): Promise<GameDetails> {
    const res = await api.get<{
      success: boolean;
      game: GameDetails;
    }>(`/games/${gameId}`);

    return res.game;
  },

  /**
   * Download PGN string
   */
  async getGamePgn(gameId: string): Promise<string> {
    return api.get<string>(`/games/${gameId}/pgn`);
  },
};
