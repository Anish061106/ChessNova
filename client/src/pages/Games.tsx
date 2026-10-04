import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Shield, Play, ChevronLeft, ChevronRight, User, TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react';
import { ratingApi } from '../services/ratingApi';
import { GameHistoryItem } from '../types/rating';

export const Games: React.FC = () => {
  const navigate = useNavigate();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [ratedFilter, setRatedFilter] = useState<string>('ALL');
  const [games, setGames] = useState<GameHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const ratedParam = ratedFilter === 'RATED' ? true : ratedFilter === 'UNRATED' ? false : undefined;
      const res = await ratingApi.getMyGameHistory({
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        result: resultFilter !== 'ALL' ? resultFilter : undefined,
        rated: ratedParam,
        page,
        limit: 15,
      });

      setGames(res.items);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [categoryFilter, resultFilter, ratedFilter, page]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1) {
      return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-lg shadow-indigo-500/10">
                <History className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                  Game History & Archive
                </h1>
                <p className="text-sm text-neutral-400 mt-0.5">
                  Browse and review all completed matches, rating transitions, and replay games move-by-move
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 self-start md:self-auto flex items-center gap-2">
            <span className="font-semibold text-neutral-200">{totalCount}</span> Total Completed Matches
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 mr-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Filter:</span>
            </div>

            {/* Category Filter */}
            <select
              aria-label="Filter by Time Control Category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="BULLET">Bullet</option>
              <option value="BLITZ">Blitz</option>
              <option value="RAPID">Rapid</option>
              <option value="CLASSICAL">Classical</option>
            </select>

            {/* Result Filter */}
            <select
              aria-label="Filter by Match Result"
              value={resultFilter}
              onChange={(e) => {
                setResultFilter(e.target.value);
                setPage(1);
              }}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Outcomes</option>
              <option value="WIN">Wins Only</option>
              <option value="LOSS">Losses Only</option>
              <option value="DRAW">Draws Only</option>
            </select>

            {/* Rated/Unrated Filter */}
            <select
              aria-label="Filter by Rated Status"
              value={ratedFilter}
              onChange={(e) => {
                setRatedFilter(e.target.value);
                setPage(1);
              }}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Rated & Unrated</option>
              <option value="RATED">Rated Games</option>
              <option value="UNRATED">Unrated Games</option>
            </select>
          </div>

          {(categoryFilter !== 'ALL' || resultFilter !== 'ALL' || ratedFilter !== 'ALL') && (
            <button
              onClick={() => {
                setCategoryFilter('ALL');
                setResultFilter('ALL');
                setRatedFilter('ALL');
                setPage(1);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Game History List */}
        <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
          {error && (
            <div className="p-6 text-center text-red-400 bg-red-500/10 border-b border-red-500/20">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading game archives...</span>
            </div>
          ) : games.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
              <Shield className="w-10 h-10 text-neutral-600 mb-1" />
              <p className="font-semibold text-neutral-300">No matching games found</p>
              <p className="text-xs text-neutral-400">Play an online game to build your match history archive.</p>
              <button
                onClick={() => navigate('/play')}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20"
              >
                Play Online Now
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-xs font-semibold text-neutral-400 bg-neutral-900/80">
                      <th className="py-3.5 px-5">Opponent</th>
                      <th className="py-3.5 px-5 text-center">Result</th>
                      <th className="py-3.5 px-5 text-center">Time</th>
                      <th className="py-3.5 px-5 text-center">Rated / Mode</th>
                      <th className="py-3.5 px-5 text-center font-mono">Rating Change</th>
                      <th className="py-3.5 px-5 text-right">Date</th>
                      <th className="py-3.5 px-5 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50 text-sm">
                    {games.map((g) => {
                      return (
                        <tr
                          key={g.id}
                          onClick={() => navigate(`/games/${g.id}`)}
                          className="transition-colors hover:bg-neutral-800/40 cursor-pointer group"
                        >
                          {/* Opponent */}
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                                {g.opponent?.avatarUrl ? (
                                  <img src={g.opponent.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-neutral-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-neutral-200 group-hover:text-indigo-300 transition-colors truncate">
                                    {g.opponent?.displayName || g.opponent?.username || 'Opponent'}
                                  </span>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                      g.userColor === 'white'
                                        ? 'bg-neutral-100 text-neutral-900'
                                        : 'bg-neutral-800 border border-neutral-600 text-neutral-300'
                                    }`}
                                  >
                                    {g.userColor === 'white' ? 'White' : 'Black'}
                                  </span>
                                </div>
                                <span className="text-xs text-neutral-400 font-mono">
                                  @{g.opponent?.username || 'player'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Result */}
                          <td className="py-3 px-5 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                g.result === 'WIN'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : g.result === 'LOSS'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-neutral-700/40 text-neutral-300 border border-neutral-600/40'
                              }`}
                            >
                              {g.result}
                            </span>
                            <span className="block text-[10px] text-neutral-400 mt-0.5 capitalize">
                              {g.terminationReason.toLowerCase().replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* Time Control */}
                          <td className="py-3 px-5 text-center font-mono text-neutral-300 font-medium">
                            {g.timeControl}
                          </td>

                          {/* Mode */}
                          <td className="py-3 px-5 text-center">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                                g.rated
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                              }`}
                            >
                              {g.rated ? 'Rated' : 'Casual'}
                            </span>
                          </td>

                          {/* Rating Change */}
                          <td className="py-3 px-5 text-center font-mono">
                            {g.rated && g.ratingChange !== undefined ? (
                              <div className="inline-flex flex-col items-center">
                                <div
                                  className={`flex items-center gap-1 font-bold text-sm ${
                                    g.ratingChange > 0
                                      ? 'text-emerald-400'
                                      : g.ratingChange < 0
                                      ? 'text-rose-400'
                                      : 'text-neutral-400'
                                  }`}
                                >
                                  {g.ratingChange > 0 ? (
                                    <TrendingUp className="w-3.5 h-3.5" />
                                  ) : g.ratingChange < 0 ? (
                                    <TrendingDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <Minus className="w-3.5 h-3.5" />
                                  )}
                                  <span>
                                    {g.ratingChange > 0 ? `+${g.ratingChange}` : `${g.ratingChange}`}
                                  </span>
                                </div>
                                {g.ratingBefore !== undefined && g.ratingAfter !== undefined && (
                                  <span className="text-[10px] text-neutral-400">
                                    {g.ratingBefore} → {g.ratingAfter}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-neutral-500 text-xs">—</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-5 text-right text-xs text-neutral-400">
                            {formatDate(g.playedAt)}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/games/${g.id}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 group-hover:bg-indigo-600 text-neutral-300 group-hover:text-white transition-all text-xs font-medium flex items-center gap-1 mx-auto"
                            >
                              <Play className="w-3 h-3" />
                              Replay
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-neutral-800">
                {games.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => navigate(`/games/${g.id}`)}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-neutral-800/40 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            g.result === 'WIN'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : g.result === 'LOSS'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-neutral-700/40 text-neutral-300'
                          }`}
                        >
                          {g.result}
                        </span>
                        <span className="text-xs font-mono text-neutral-400">{g.timeControl}</span>
                        {g.rated && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300">
                            Rated
                          </span>
                        )}
                      </div>

                      <div className="font-semibold text-sm text-neutral-200 truncate">
                        vs {g.opponent?.displayName || g.opponent?.username || 'Opponent'}
                      </div>
                      <span className="text-xs text-neutral-400 block">{formatDate(g.playedAt)}</span>
                    </div>

                    <div className="text-right shrink-0">
                      {g.rated && g.ratingChange !== undefined ? (
                        <div
                          className={`font-mono font-bold text-sm ${
                            g.ratingChange > 0
                              ? 'text-emerald-400'
                              : g.ratingChange < 0
                              ? 'text-rose-400'
                              : 'text-neutral-400'
                          }`}
                        >
                          {g.ratingChange > 0 ? `+${g.ratingChange}` : `${g.ratingChange}`}
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-xs">—</span>
                      )}
                      <span className="text-[10px] text-indigo-400 mt-1 block">Tap to replay →</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 bg-neutral-900/60">
              <div>
                Page <span className="font-semibold text-neutral-200">{page}</span> of{' '}
                <span className="font-semibold text-neutral-200">{totalPages}</span>
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
