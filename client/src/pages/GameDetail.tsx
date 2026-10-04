import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import {
  ArrowLeft,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Download,
  Trophy,
  Shield,
  User,
  Clock,
} from 'lucide-react';
import { ChessBoard } from '../components/chess/ChessBoard';
import { BOARD_THEMES } from '../utils/boardThemes';
import { ratingApi } from '../services/ratingApi';
import { GameDetails, MoveReplayItem } from '../types/rating';
import { Square, Color, PieceSymbol, BoardOrientation } from '../types/chess';
import { useAuthStore } from '../store/authStore';

export const GameDetail: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();

  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPly, setCurrentPly] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [orientation, setOrientation] = useState<BoardOrientation>('white');
  const [copiedPgn, setCopiedPgn] = useState(false);

  const moveListRef = useRef<HTMLDivElement>(null);

  // 1. Fetch game details
  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    setError(null);

    ratingApi
      .getGameDetails(gameId)
      .then((data) => {
        setGame(data);
        // Default orientation to user's playing color if participant
        if (authUser && data.blackPlayer?.id === authUser.id) {
          setOrientation('black');
        } else {
          setOrientation('white');
        }
        // Start at final position or start? Start at end or 0: standard is initial or end (0 is great for stepping, or end)
        setCurrentPly(0);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load game details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [gameId, authUser]);

  // 2. Pre-calculate all board positions for instantaneous replay
  const positions = useMemo(() => {
    if (!game) return [];

    const list: {
      ply: number;
      moveNumber: number;
      fen: string;
      move: MoveReplayItem | null;
      chess: Chess;
      lastMove: { from: Square; to: Square } | null;
      checkSquare: Square | null;
    }[] = [];

    const initialFen =
      game.initialFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const c = new Chess(initialFen);

    // Ply 0
    list.push({
      ply: 0,
      moveNumber: 0,
      fen: c.fen(),
      move: null,
      chess: new Chess(c.fen()),
      lastMove: null,
      checkSquare: c.inCheck() ? findKingSquare(c, c.turn()) : null,
    });

    const moves = [...(game.moves || [])].sort((a, b) => a.ply - b.ply);

    for (const m of moves) {
      try {
        c.move({ from: m.from, to: m.to, promotion: 'q' });
      } catch {
        // Fallback to stored FEN if SAN/move cannot be re-applied
        if (m.fen) c.load(m.fen);
      }

      list.push({
        ply: m.ply,
        moveNumber: m.moveNumber,
        fen: c.fen(),
        move: m,
        chess: new Chess(c.fen()),
        lastMove: { from: m.from as Square, to: m.to as Square },
        checkSquare: c.inCheck() ? findKingSquare(c, c.turn()) : null,
      });
    }

    return list;
  }, [game]);

  const totalPlies = positions.length > 0 ? positions.length - 1 : 0;
  const currentPosition = positions[currentPly] || positions[0];

  // Helper to locate king square in check
  function findKingSquare(chessInstance: Chess, turnColor: 'w' | 'b'): Square | null {
    const board = chessInstance.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turnColor) {
          const file = String.fromCharCode(97 + c);
          const rank = String(8 - r);
          return `${file}${rank}` as Square;
        }
      }
    }
    return null;
  }

  // Auto-step when playing
  useEffect(() => {
    if (!isPlaying) return;

    if (currentPly >= totalPlies) {
      setIsPlaying(false);
      return;
    }

    const intervalTime = Math.round(1000 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentPly((prev) => {
        if (prev >= totalPlies) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, currentPly, totalPlies, playbackSpeed]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/selects
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentPly((p) => Math.max(0, p - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentPly((p) => Math.min(totalPlies, p + 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentPly(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentPly(totalPlies);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPlies]);

  // Copy PGN handler
  const handleCopyPgn = () => {
    if (!game) return;
    const pgnText = game.pgn || '';
    navigator.clipboard.writeText(pgnText);
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  // Download PGN handler
  const handleDownloadPgn = () => {
    if (!game) return;
    const pgnText = game.pgn || '';
    const blob = new Blob([pgnText], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChessNova_${game.whitePlayer.username}_vs_${game.blackPlayer?.username || 'Opponent'}_${game.id}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPieceAt = useCallback(
    (square: Square): { type: PieceSymbol; color: Color } | null => {
      if (!currentPosition) return null;
      const piece = currentPosition.chess.get(square);
      if (!piece) return null;
      return {
        type: piece.type as PieceSymbol,
        color: piece.color as Color,
      };
    },
    [currentPosition]
  );

  // Group moves into standard numbered pairs [ { moveNumber, whitePly, whiteSan, blackPly, blackSan } ]
  const movePairs = useMemo(() => {
    if (!game || !game.moves) return [];
    const sorted = [...game.moves].sort((a, b) => a.ply - b.ply);
    const pairs: {
      moveNumber: number;
      white?: MoveReplayItem;
      black?: MoveReplayItem;
    }[] = [];

    for (const m of sorted) {
      if (m.ply % 2 === 1) {
        // White move
        pairs.push({
          moveNumber: m.moveNumber,
          white: m,
        });
      } else {
        // Black move
        const lastPair = pairs[pairs.length - 1];
        if (lastPair && lastPair.moveNumber === m.moveNumber) {
          lastPair.black = m;
        } else {
          pairs.push({
            moveNumber: m.moveNumber,
            black: m,
          });
        }
      }
    }

    return pairs;
  }, [game]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-400 gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Loading game replay...</span>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 py-12 px-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center space-y-4">
          <Shield className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-neutral-100">Game Not Available</h2>
          <p className="text-sm text-neutral-400">{error || 'Could not find the requested match.'}</p>
          <button
            onClick={() => navigate('/games')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Back to Match History
          </button>
        </div>
      </div>
    );
  }

  const resultString =
    game.result === 'WHITE_WIN'
      ? '1 - 0'
      : game.result === 'BLACK_WIN'
      ? '0 - 1'
      : game.result === 'DRAW'
      ? '½ - ½'
      : '*';

  const resultTitle =
    game.result === 'WHITE_WIN'
      ? `${game.whitePlayer.displayName || game.whitePlayer.username} won`
      : game.result === 'BLACK_WIN'
      ? `${game.blackPlayer?.displayName || game.blackPlayer?.username || 'Black'} won`
      : game.result === 'DRAW'
      ? 'Game drawn'
      : 'Game in progress';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/games')}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Games</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-neutral-100">
                  {game.whitePlayer.displayName || game.whitePlayer.username} vs{' '}
                  {game.blackPlayer?.displayName || game.blackPlayer?.username || 'Opponent'}
                </h1>
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                    game.rated
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}
                >
                  {game.rated ? 'Rated' : 'Casual'}
                </span>
              </div>
              <span className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {game.timeControl} • {new Date(game.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPgn}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm"
              title="Copy PGN notation"
            >
              {copiedPgn ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPgn ? 'Copied!' : 'Copy PGN'}</span>
            </button>
            <button
              onClick={handleDownloadPgn}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm"
              title="Download standard PGN file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Replay Board & Move List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Board Column */}
          <div className="lg:col-span-7 flex flex-col items-center space-y-4">
            {/* Opponent (Top) Player Card */}
            <div className="w-full max-w-[560px] bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                  {orientation === 'white' ? (
                    game.blackPlayer?.avatarUrl ? (
                      <img src={game.blackPlayer.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-neutral-400" />
                    )
                  ) : game.whitePlayer.avatarUrl ? (
                    <img src={game.whitePlayer.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-neutral-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-200">
                      {orientation === 'white'
                        ? game.blackPlayer?.displayName || game.blackPlayer?.username || 'Black'
                        : game.whitePlayer.displayName || game.whitePlayer.username}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        orientation === 'white'
                          ? 'bg-neutral-800 border border-neutral-600 text-neutral-300'
                          : 'bg-neutral-100 text-neutral-900'
                      }`}
                    >
                      {orientation === 'white' ? 'Black' : 'White'}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">
                    {orientation === 'white'
                      ? `@${game.blackPlayer?.username || 'player'}`
                      : `@${game.whitePlayer.username}`}
                  </span>
                </div>
              </div>

              {/* Rating Transition (if rated) */}
              {game.rated && (
                <div className="text-right font-mono">
                  {orientation === 'white' && game.blackRatingChange ? (
                    <div>
                      <span
                        className={`text-xs font-bold ${
                          game.blackRatingChange.change > 0
                            ? 'text-emerald-400'
                            : game.blackRatingChange.change < 0
                            ? 'text-rose-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {game.blackRatingChange.change >= 0
                          ? `+${game.blackRatingChange.change}`
                          : game.blackRatingChange.change}
                      </span>
                      <span className="text-[10px] text-neutral-400 block">
                        {game.blackRatingChange.before} → {game.blackRatingChange.after}
                      </span>
                    </div>
                  ) : orientation === 'black' && game.whiteRatingChange ? (
                    <div>
                      <span
                        className={`text-xs font-bold ${
                          game.whiteRatingChange.change > 0
                            ? 'text-emerald-400'
                            : game.whiteRatingChange.change < 0
                            ? 'text-rose-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {game.whiteRatingChange.change >= 0
                          ? `+${game.whiteRatingChange.change}`
                          : game.whiteRatingChange.change}
                      </span>
                      <span className="text-[10px] text-neutral-400 block">
                        {game.whiteRatingChange.before} → {game.whiteRatingChange.after}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Replay Board */}
            <div className="w-full max-w-[560px] aspect-square relative rounded-2xl overflow-hidden shadow-2xl border-4 border-neutral-800 bg-neutral-900">
              <ChessBoard
                orientation={orientation}
                theme={BOARD_THEMES.classic}
                turn={currentPosition.chess.turn() as Color}
                selectedSquare={null}
                legalDestinations={[]}
                lastMove={currentPosition.lastMove}
                checkSquare={currentPosition.checkSquare}
                getPieceAt={getPieceAt}
                onSquareClick={() => {}}
                onMoveAttempt={() => {}}
              />
            </div>

            {/* Self (Bottom) Player Card */}
            <div className="w-full max-w-[560px] bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                  {orientation === 'white' ? (
                    game.whitePlayer.avatarUrl ? (
                      <img src={game.whitePlayer.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-neutral-400" />
                    )
                  ) : game.blackPlayer?.avatarUrl ? (
                    <img src={game.blackPlayer.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-neutral-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-200">
                      {orientation === 'white'
                        ? game.whitePlayer.displayName || game.whitePlayer.username
                        : game.blackPlayer?.displayName || game.blackPlayer?.username || 'Black'}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        orientation === 'white'
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'bg-neutral-800 border border-neutral-600 text-neutral-300'
                      }`}
                    >
                      {orientation === 'white' ? 'White' : 'Black'}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">
                    {orientation === 'white'
                      ? `@${game.whitePlayer.username}`
                      : `@${game.blackPlayer?.username || 'player'}`}
                  </span>
                </div>
              </div>

              {/* Rating Transition (if rated) */}
              {game.rated && (
                <div className="text-right font-mono">
                  {orientation === 'white' && game.whiteRatingChange ? (
                    <div>
                      <span
                        className={`text-xs font-bold ${
                          game.whiteRatingChange.change > 0
                            ? 'text-emerald-400'
                            : game.whiteRatingChange.change < 0
                            ? 'text-rose-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {game.whiteRatingChange.change >= 0
                          ? `+${game.whiteRatingChange.change}`
                          : game.whiteRatingChange.change}
                      </span>
                      <span className="text-[10px] text-neutral-400 block">
                        {game.whiteRatingChange.before} → {game.whiteRatingChange.after}
                      </span>
                    </div>
                  ) : orientation === 'black' && game.blackRatingChange ? (
                    <div>
                      <span
                        className={`text-xs font-bold ${
                          game.blackRatingChange.change > 0
                            ? 'text-emerald-400'
                            : game.blackRatingChange.change < 0
                            ? 'text-rose-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {game.blackRatingChange.change >= 0
                          ? `+${game.blackRatingChange.change}`
                          : game.blackRatingChange.change}
                      </span>
                      <span className="text-[10px] text-neutral-400 block">
                        {game.blackRatingChange.before} → {game.blackRatingChange.after}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Replay Controls Toolbar */}
            <div className="w-full max-w-[560px] bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-lg">
              {/* Stepping controls */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  disabled={currentPly <= 0}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentPly(0);
                  }}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="First Move (Home)"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPly <= 0}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentPly((p) => Math.max(0, p - 1));
                  }}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous Move (Left Arrow)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md flex items-center gap-1.5 text-xs"
                  title="Play / Pause (Space)"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  disabled={currentPly >= totalPlies}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentPly((p) => Math.min(totalPlies, p + 1));
                  }}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next Move (Right Arrow)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPly >= totalPlies}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentPly(totalPlies);
                  }}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Last Move (End)"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Right tools: Flip & Speed */}
              <div className="flex items-center gap-2">
                {/* Speed selector */}
                <select
                  aria-label="Replay Playback Speed"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl px-2 py-1.5 text-xs font-mono focus:outline-none"
                >
                  <option value="0.5">0.5x</option>
                  <option value="1">1.0x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2.0x</option>
                </select>

                <button
                  onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                  title="Flip Board"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right / Move List & Result Column */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Game Outcome Card */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-neutral-200 text-sm">Game Result</span>
                </div>
                <span className="text-xl font-black font-mono tracking-widest text-amber-400">
                  {resultString}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-semibold text-neutral-200">{resultTitle}</div>
                <div className="text-xs text-neutral-400 capitalize">
                  Termination: {game.terminationReason.toLowerCase().replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            {/* Move List */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-xs font-semibold text-neutral-400">
                <span>Move Notation ({game.moves?.length || 0} plies)</span>
                <span className="font-mono text-neutral-500">
                  Ply {currentPly} / {totalPlies}
                </span>
              </div>

              {/* Scrollable Move Rows */}
              <div ref={moveListRef} className="flex-1 overflow-y-auto divide-y divide-neutral-800/40 py-2">
                {movePairs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                    No moves recorded in this match
                  </div>
                ) : (
                  movePairs.map((pair) => {
                    const isWhiteActive = currentPly === pair.white?.ply;
                    const isBlackActive = pair.black && currentPly === pair.black.ply;

                    return (
                      <div
                        key={pair.moveNumber}
                        className="grid grid-cols-12 py-1 px-2 text-sm font-mono items-center hover:bg-neutral-800/30 rounded-lg transition-colors"
                      >
                        <span className="col-span-2 text-xs text-neutral-400">
                          {pair.moveNumber}.
                        </span>

                        {/* White move */}
                        <button
                          onClick={() => {
                            setIsPlaying(false);
                            if (pair.white) setCurrentPly(pair.white.ply);
                          }}
                          className={`col-span-5 text-left py-1 px-2 rounded-md font-semibold transition-all ${
                            isWhiteActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-neutral-200 hover:bg-neutral-800'
                          }`}
                        >
                          {pair.white?.san || '—'}
                        </button>

                        {/* Black move */}
                        {pair.black ? (
                          <button
                            onClick={() => {
                              setIsPlaying(false);
                              if (pair.black) setCurrentPly(pair.black.ply);
                            }}
                            className={`col-span-5 text-left py-1 px-2 rounded-md font-semibold transition-all ${
                              isBlackActive
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-neutral-200 hover:bg-neutral-800'
                            }`}
                          >
                            {pair.black.san}
                          </button>
                        ) : (
                          <span className="col-span-5 text-neutral-600 py-1 px-2">—</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Keyboard helper footer */}
              <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                <span>Shortcuts: ← / → or Space</span>
                <span className="font-mono">Home / End</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
