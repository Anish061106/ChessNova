import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Flame, Clock, Award, ChevronLeft, ChevronRight, User, Shield } from 'lucide-react';
import { ratingApi } from '../services/ratingApi';
import { RatingCategory, LeaderboardItem } from '../types/rating';
import { useAuthStore } from '../store/authStore';

const CATEGORIES: { key: RatingCategory; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { key: 'BLITZ', label: 'Blitz', icon: Flame, desc: '3+0, 3+2, 5+0, 5+3' },
  { key: 'RAPID', label: 'Rapid', icon: Clock, desc: '10+0, 10+5, 15+10' },
  { key: 'BULLET', label: 'Bullet', icon: Zap, desc: '1+0, 2+1' },
  { key: 'CLASSICAL', label: 'Classical', icon: Award, desc: '30+0, 30+20' },
];

export const Leaderboard: React.FC = () => {
  const { user: authUser } = useAuthStore();
  const [category, setCategory] = useState<RatingCategory>('BLITZ');
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardItem | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (cat: RatingCategory, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ratingApi.getLeaderboard(cat, pageNum, 25);
      setItems(res.items);
      setCurrentUserRank(res.currentUserRank || null);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(category, page);
  }, [category, page]);

  const handleCategoryChange = (newCat: RatingCategory) => {
    if (newCat !== category) {
      setCategory(newCat);
      setPage(1);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/20">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/20 text-slate-200 font-bold border border-slate-300/40 shadow-sm">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 font-bold border border-amber-700/40">
          🥉
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 text-neutral-400 font-medium text-sm">
        #{rank}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 shadow-lg shadow-amber-500/10">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                  Global Leaderboard
                </h1>
                <p className="text-sm text-neutral-400 mt-0.5">
                  Real-time competitive Elo rankings across official ChessNova time controls
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 self-start md:self-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Server Authoritative • Updated Live
          </div>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`flex flex-col items-start p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-500/15 to-amber-500/5 border-amber-500/50 shadow-lg shadow-amber-500/5 text-amber-200'
                    : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                    <span className={`font-bold ${isSelected ? 'text-neutral-100' : 'text-neutral-300'}`}>
                      {cat.label}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
                  )}
                </div>
                <span className="text-xs text-neutral-400 font-mono">{cat.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Current User Rank Card (if authenticated) */}
        {authUser && currentUserRank && (
          <div className="bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-lg">
                #{currentUserRank.rank}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                  {currentUserRank.avatarUrl ? (
                    <img src={currentUserRank.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-neutral-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-100">Your Standings</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-medium">
                      {category}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400">
                    @{currentUserRank.username} • {currentUserRank.gamesPlayed} games played
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-neutral-800/80 pt-3 sm:pt-0">
              <div className="text-left sm:text-right">
                <span className="text-xs text-neutral-400 block">Rating</span>
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {currentUserRank.rating}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-neutral-400 block">Win Rate</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {currentUserRank.winRate}%
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-neutral-400 block">Record</span>
                <span className="text-sm font-semibold text-neutral-300 font-mono">
                  {currentUserRank.wins}W / {currentUserRank.losses}L / {currentUserRank.draws}D
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table / Cards */}
        <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
          {error && (
            <div className="p-6 text-center text-red-400 bg-red-500/10 border-b border-red-500/20">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading {category} leaderboard...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <Shield className="w-10 h-10 text-neutral-600 mb-1" />
              <p className="font-semibold text-neutral-300">No ranked players found</p>
              <p className="text-xs text-neutral-400">Play a rated {category.toLowerCase()} game to claim #1!</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-xs font-semibold text-neutral-400 bg-neutral-900/80">
                      <th className="py-3.5 px-5 w-16 text-center">Rank</th>
                      <th className="py-3.5 px-5">Player</th>
                      <th className="py-3.5 px-5 text-right font-mono">Rating</th>
                      <th className="py-3.5 px-5 text-center">Games</th>
                      <th className="py-3.5 px-5 text-center">W / L / D</th>
                      <th className="py-3.5 px-5 text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50 text-sm">
                    {items.map((item) => {
                      const isCurrentUser = authUser?.id === item.userId;
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors hover:bg-neutral-800/40 ${
                            isCurrentUser ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : ''
                          }`}
                        >
                          <td className="py-3 px-5 text-center">
                            <div className="flex justify-center">{getRankBadge(item.rank)}</div>
                          </td>
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                                {item.avatarUrl ? (
                                  <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-neutral-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-neutral-200 truncate">
                                    {item.displayName || item.username}
                                  </span>
                                  {item.country && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono uppercase">
                                      {item.country}
                                    </span>
                                  )}
                                  {isCurrentUser && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-neutral-400 font-mono">@{item.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <span className="text-base font-black text-amber-400 font-mono">
                              {item.rating}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-center text-neutral-300 font-mono">
                            {item.gamesPlayed}
                          </td>
                          <td className="py-3 px-5 text-center font-mono text-xs">
                            <span className="text-emerald-400">{item.wins}</span>
                            <span className="text-neutral-500"> / </span>
                            <span className="text-rose-400">{item.losses}</span>
                            <span className="text-neutral-500"> / </span>
                            <span className="text-neutral-400">{item.draws}</span>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-neutral-800 rounded-full h-2 overflow-hidden hidden sm:block">
                                <div
                                  className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full"
                                  style={{ width: `${item.winRate}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold font-mono text-xs text-neutral-200">
                                {item.winRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-neutral-800">
                {items.map((item) => {
                  const isCurrentUser = authUser?.id === item.userId;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 flex items-center justify-between gap-3 ${
                        isCurrentUser ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">{getRankBadge(item.rank)}</div>
                        <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                          {item.avatarUrl ? (
                            <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-sm text-neutral-200 truncate">
                              {item.displayName || item.username}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-300 shrink-0">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-400 font-mono">
                            {item.gamesPlayed} games • {item.winRate}% Win
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-amber-400 font-mono block">
                          {item.rating}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {item.wins}W-{item.losses}L
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 bg-neutral-900/60">
              <div>
                Showing page <span className="font-semibold text-neutral-200">{page}</span> of{' '}
                <span className="font-semibold text-neutral-200">{totalPages}</span> ({totalCount} players)
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <button
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
