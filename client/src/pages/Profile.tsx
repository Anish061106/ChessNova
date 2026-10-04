import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Shield,
  Calendar,
  Globe,
  Edit3,
  Key,
  LogOut,
  Zap,
  Flame,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  TrendingUp,
  Play,
  BarChart2,
  History,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ratingApi } from '../services/ratingApi';
import { RatingCategory, RatingHistoryItem, GameHistoryItem, UserRating } from '../types/rating';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, changePassword, isLoading } = useAuthStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  // Edit Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [country, setCountry] = useState(user?.country || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Phase 8 Authoritative Data
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [selectedChartCategory, setSelectedChartCategory] = useState<RatingCategory>('BLITZ');
  const [ratingHistory, setRatingHistory] = useState<RatingHistoryItem[]>([]);
  const [recentGames, setRecentGames] = useState<GameHistoryItem[]>([]);

  // Load Authoritative Ratings, History, and Recent Matches
  useEffect(() => {
    if (!user) return;

    Promise.all([
      ratingApi.getUserRatings(user.username).catch(() => null),
      ratingApi.getMyRatingHistory(selectedChartCategory, 1, 30).catch(() => ({ items: [] })),
      ratingApi.getMyGameHistory({ limit: 5 }).catch(() => ({ items: [] })),
    ])
      .then(([ratingsData, historyData, gamesData]) => {
        if (ratingsData?.ratings) {
          setRatings(ratingsData.ratings);
        }
        setRatingHistory(historyData?.items || []);
        setRecentGames(gamesData?.items || []);
      });
  }, [user, selectedChartCategory]);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown';

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await updateProfile({
        displayName: displayName.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        country: country.trim().toUpperCase() || null,
        bio: bio.trim() || null,
      });
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => {
        setIsEditOpen(false);
        setProfileSuccess(null);
      }, 1200);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setIsPasswordOpen(false);
        setPasswordSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    }
  };

  // Find ratings mapping (default 1200)
  const ratingsMap = (ratings.length > 0 ? ratings : user?.ratings || []).reduce<Record<string, UserRating>>(
    (acc, curr) => {
      acc[curr.category] = curr as UserRating;
      return acc;
    },
    {}
  );

  const bulletData = ratingsMap['BULLET'] || { rating: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 };
  const blitzData = ratingsMap['BLITZ'] || { rating: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 };
  const rapidData = ratingsMap['RAPID'] || { rating: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 };
  const classicalData = ratingsMap['CLASSICAL'] || { rating: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 };

  const totalGames = bulletData.gamesPlayed + blitzData.gamesPlayed + rapidData.gamesPlayed + classicalData.gamesPlayed;
  const totalWins = bulletData.wins + blitzData.wins + rapidData.wins + classicalData.wins;
  const totalLosses = bulletData.losses + blitzData.losses + rapidData.losses + classicalData.losses;
  const totalDraws = bulletData.draws + blitzData.draws + rapidData.draws + classicalData.draws;
  const overallWinRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  // Rating Progression SVG Chart Points
  const chartPoints = ratingHistory.slice().reverse();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn text-neutral-100">
      {/* Profile Header Card */}
      <Card className="p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-neutral-900 to-slate-900/90 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar / Fallback Initials */}
          <div className="relative group">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-amber-500/30 shadow-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
            {!user?.avatarUrl && (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-amber-500/30">
                {user?.username?.substring(0, 2).toUpperCase() || 'CN'}
              </div>
            )}
            <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md bg-emerald-500 text-white shadow-md">
              PRO
            </span>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
                  <span>{user?.displayName || user?.username}</span>
                  {user?.country && (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                      {user.country}
                    </span>
                  )}
                </h1>
                <p className="text-sm font-medium text-amber-400">@{user?.username}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-2 pt-2 md:pt-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    setDisplayName(user?.displayName || '');
                    setAvatarUrl(user?.avatarUrl || '');
                    setCountry(user?.country || '');
                    setBio(user?.bio || '');
                    setIsEditOpen(true);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => setIsPasswordOpen(true)}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Password</span>
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 text-xs text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
                  onClick={() => logout()}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-slate-300 max-w-2xl pt-1">
              {user?.bio || 'No chess bio provided yet. Click "Edit Profile" to add your favorite openings and playstyle!'}
            </p>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Member since {memberSince}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                Verified ChessNova Account
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-500" />
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Ratings Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Rating Categories</span>
          </h2>
          <span className="text-xs text-neutral-400">Default starting rating: 1200</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bullet */}
          <Card className="p-5 border border-neutral-800 bg-neutral-900/80 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-neutral-100">Bullet</span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">1+0 • 2+1</span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-amber-400 font-mono">{bulletData.rating}</div>
              <p className="text-xs text-neutral-400">
                {bulletData.gamesPlayed} games played • {bulletData.wins}W-{bulletData.losses}L
              </p>
            </div>
          </Card>

          {/* Blitz */}
          <Card className="p-5 border border-neutral-800 bg-neutral-900/80 flex flex-col justify-between hover:border-rose-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                  <Flame className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-neutral-100">Blitz</span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">3+0 • 5+3</span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-rose-400 font-mono">{blitzData.rating}</div>
              <p className="text-xs text-neutral-400">
                {blitzData.gamesPlayed} games played • {blitzData.wins}W-{blitzData.losses}L
              </p>
            </div>
          </Card>

          {/* Rapid */}
          <Card className="p-5 border border-neutral-800 bg-neutral-900/80 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-neutral-100">Rapid</span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">10+0 • 15+10</span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-emerald-400 font-mono">{rapidData.rating}</div>
              <p className="text-xs text-neutral-400">
                {rapidData.gamesPlayed} games played • {rapidData.wins}W-{rapidData.losses}L
              </p>
            </div>
          </Card>

          {/* Classical */}
          <Card className="p-5 border border-neutral-800 bg-neutral-900/80 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-neutral-100">Classical</span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">30+0 • 60+0</span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-blue-400 font-mono">{classicalData.rating}</div>
              <p className="text-xs text-neutral-400">
                {classicalData.gamesPlayed} games played • {classicalData.wins}W-{classicalData.losses}L
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Overview Statistics Card */}
      <Card className="p-6 bg-neutral-900/70 border border-neutral-800 rounded-2xl shadow-xl">
        <h2 className="text-base font-bold text-neutral-100 mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-400" />
          <span>Overall Record & Statistics</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-800">
            <span className="text-xs text-neutral-400 block mb-1">Total Games</span>
            <span className="text-2xl font-black text-neutral-100 font-mono">{totalGames}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs text-emerald-400 block mb-1">Wins</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">{totalWins}</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-xs text-rose-400 block mb-1">Losses</span>
            <span className="text-2xl font-black text-rose-400 font-mono">{totalLosses}</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-800">
            <span className="text-xs text-neutral-400 block mb-1">Draws</span>
            <span className="text-2xl font-black text-neutral-300 font-mono">{totalDraws}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 col-span-2 sm:col-span-1">
            <span className="text-xs text-amber-400 block mb-1">Win Rate</span>
            <span className="text-2xl font-black text-amber-400 font-mono">{overallWinRate}%</span>
          </div>
        </div>
      </Card>

      {/* Rating Progression Graph & Table */}
      <Card className="p-6 bg-neutral-900/70 border border-neutral-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-neutral-100">Rating Progression</h2>
          </div>

          {/* Category Tabs for Graph */}
          <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-xl">
            {(['BLITZ', 'RAPID', 'BULLET', 'CLASSICAL'] as RatingCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedChartCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedChartCategory === cat
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Graph */}
        {chartPoints.length > 1 ? (
          <div className="space-y-2">
            <div className="h-44 w-full bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4 flex items-center justify-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                {(() => {
                  const ratingsList = chartPoints.map((p) => p.ratingAfter);
                  const min = Math.min(...ratingsList) - 30;
                  const max = Math.max(...ratingsList) + 30;
                  const range = max - min || 1;

                  const points = chartPoints.map((p, idx) => {
                    const x = (idx / (chartPoints.length - 1)) * 480 + 10;
                    const y = 110 - ((p.ratingAfter - min) / range) * 90;
                    return { x, y, rating: p.ratingAfter };
                  });

                  const pathD = points.reduce(
                    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
                    ''
                  );

                  return (
                    <>
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {points.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          className="fill-amber-400 stroke-neutral-900 stroke-2 hover:r-6 transition-all"
                        >
                          <title>Rating: {p.rating}</title>
                        </circle>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="flex justify-between text-[11px] text-neutral-500 font-mono px-2">
              <span>Earlier Games</span>
              <span>Latest Match</span>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-neutral-400 bg-neutral-950/40 rounded-xl border border-neutral-800/60">
            Play more rated {selectedChartCategory.toLowerCase()} games to generate your progression timeline.
          </div>
        )}

        {/* Rating History Table */}
        {ratingHistory.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">
              Recent Rating Updates ({selectedChartCategory})
            </h3>
            <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden text-xs">
              {ratingHistory.slice(0, 5).map((item) => (
                <div key={item.id} className="p-3 bg-neutral-900/60 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-200">
                      {item.game
                        ? `vs ${
                            item.game.whitePlayer?.id === user?.id
                              ? item.game.blackPlayer?.displayName || item.game.blackPlayer?.username || 'Opponent'
                              : item.game.whitePlayer?.displayName || item.game.whitePlayer?.username || 'Opponent'
                          }`
                        : 'Rated Match'}
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} •{' '}
                      {item.category}
                    </span>
                  </div>

                  <div className="text-right font-mono">
                    <div
                      className={`font-bold ${
                        item.ratingChange > 0
                          ? 'text-emerald-400'
                          : item.ratingChange < 0
                          ? 'text-rose-400'
                          : 'text-neutral-400'
                      }`}
                    >
                      {item.ratingChange > 0 ? `+${item.ratingChange}` : item.ratingChange}
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {item.ratingBefore} → {item.ratingAfter}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Recent Matches Section */}
      <Card className="p-6 bg-neutral-900/70 border border-neutral-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-neutral-100">Recent Completed Matches</h2>
          </div>
          <button
            onClick={() => navigate('/games')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            View Full Archive →
          </button>
        </div>

        {recentGames.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">No completed matches recorded yet.</div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {recentGames.map((g) => (
              <div
                key={g.id}
                onClick={() => navigate(`/games/${g.id}`)}
                className="py-3 flex items-center justify-between hover:bg-neutral-800/40 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      g.result === 'WIN'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : g.result === 'LOSS'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-neutral-700/40 text-neutral-300'
                    }`}
                  >
                    {g.result}
                  </span>
                  <div>
                    <span className="font-semibold text-sm text-neutral-200 block">
                      vs {g.opponent?.displayName || g.opponent?.username || 'Opponent'}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {g.timeControl} • {g.rated ? 'Rated' : 'Casual'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {g.rated && g.ratingChange !== undefined && (
                    <span
                      className={`font-mono text-xs font-bold ${
                        g.ratingChange > 0
                          ? 'text-emerald-400'
                          : g.ratingChange < 0
                          ? 'text-rose-400'
                          : 'text-neutral-400'
                      }`}
                    >
                      {g.ratingChange > 0 ? `+${g.ratingChange}` : g.ratingChange}
                    </span>
                  )}
                  <button className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-indigo-600 hover:text-white transition-colors">
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 shadow-2xl relative animate-scaleIn border border-neutral-700 bg-neutral-900">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-neutral-100 mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-500" />
              <span>Edit Profile Information</span>
            </h3>

            {profileSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <Input
                label="Display Name"
                placeholder="e.g. Magnus Carlsen"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
              />

              <Input
                label="Country Code (e.g. US, IN, NO)"
                placeholder="US"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                maxLength={4}
              />

              <Input
                label="Avatar Image URL"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                maxLength={300}
              />

              <div>
                <label className="text-xs font-semibold text-neutral-300 tracking-wide block mb-1.5">
                  Bio / Playstyle
                </label>
                <textarea
                  className="w-full rounded-lg text-sm bg-neutral-950 border border-neutral-700 text-neutral-100 p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  rows={3}
                  placeholder="Tell other players about your chess style, favorite openings..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 shadow-2xl relative animate-scaleIn border border-neutral-700 bg-neutral-900">
            <button
              onClick={() => setIsPasswordOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-neutral-100 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              <span>Change Account Password</span>
            </h3>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Repeat new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPasswordOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
