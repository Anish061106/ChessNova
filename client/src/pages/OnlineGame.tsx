import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import {
  Swords,
  Copy,
  Check,
  Flag,
  Handshake,
  RotateCcw,
  Wifi,
  WifiOff,
  AlertCircle,
  Trophy,
  ArrowLeft,
  Loader2,
  ListOrdered,
  MessageSquare,
  X,
} from 'lucide-react';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { ChessBoard } from '../components/chess/ChessBoard';
import { PromotionModal } from '../components/chess/PromotionModal';
import { GameChatPanel } from '../components/chat/GameChatPanel';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { soundService } from '../utils/soundService';
import {
  Square,
  Color,
  PieceSymbol,
  BoardOrientation,
  LegalDestination,
} from '../types/chess';

export const OnlineGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const settings = useSettingsStore();

  const {
    status,
    timeControl,
    whitePlayer,
    blackPlayer,
    playerColor,
    fen,
    turn,
    lastMove,
    moveHistory,
    whiteTime,
    blackTime,
    activeColor,
    isCheck,
    isGameOver,
    result,
    terminationReason,
    blackConnected,
    whiteConnected,
    drawOfferedBy,
    connectionStatus,
    error,
    initGame,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    leaveGame,
    clearError,
  } = useOnlineGameStore();

  const [copied, setCopied] = useState(false);
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [orientation, setOrientation] = useState<BoardOrientation>('white');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  // Move confirmation state (for settings.confirmMoves)
  const [pendingConfirmMove, setPendingConfirmMove] = useState<{
    from: Square;
    to: Square;
    promotion?: string;
  } | null>(null);

  // Promotion modal state (when autoQueen is false)
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // Mobile move list sheet toggle
  const [isMobileMovesOpen, setIsMobileMovesOpen] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Desktop sidebar tab ('moves' | 'chat')
  const [sidebarTab, setSidebarTab] = useState<'moves' | 'chat'>('moves');

  // Initialize socket room on mount
  useEffect(() => {
    if (gameId) {
      initGame(gameId);
    }
    return () => {
      leaveGame();
    };
  }, [gameId, initGame, leaveGame]);

  // Set default board orientation based on assigned color
  useEffect(() => {
    if (playerColor) {
      setOrientation(playerColor);
    }
  }, [playerColor]);

  // Sound effects on moves and game results
  useEffect(() => {
    if (lastMove) {
      if (isCheck) soundService.play('check');
      else soundService.play('move');
    }
  }, [lastMove, isCheck]);

  useEffect(() => {
    if (isGameOver) {
      soundService.play('gameEnd');
    }
  }, [isGameOver]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatClock = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Local chess instance for move calculations
  const localChess = useMemo(() => new Chess(fen), [fen]);

  const getPieceAt = (square: Square) => {
    const piece = localChess.get(square);
    if (!piece) return null;
    return { type: piece.type as PieceSymbol, color: piece.color as Color };
  };

  const legalDestinations: LegalDestination[] = useMemo(() => {
    if (!selectedSquare) return [];
    try {
      const moves = localChess.moves({ square: selectedSquare, verbose: true });
      return moves.map((m) => ({
        square: m.to as Square,
        isCapture: Boolean(m.captured),
      }));
    } catch {
      return [];
    }
  }, [localChess, selectedSquare]);

  const isUserWhite = playerColor === 'white';
  const myPlayer = isUserWhite ? whitePlayer : blackPlayer;
  const opponentPlayer = isUserWhite ? blackPlayer : whitePlayer;
  const myTime = isUserWhite ? whiteTime : blackTime;
  const opponentTime = isUserWhite ? blackTime : whiteTime;
  const opponentConnected = isUserWhite ? blackConnected : whiteConnected;
  const isMyTurn =
    (playerColor === 'white' && turn === 'w') || (playerColor === 'black' && turn === 'b');

  const executeMove = (from: Square, to: Square, promotion?: string) => {
    makeMove(from, to, promotion);
    setSelectedSquare(null);
    setPendingConfirmMove(null);
  };

  const checkAndInitiateMove = (from: Square, to: Square) => {
    if (isGameOver || !isMyTurn) return;

    // Check for pawn promotion
    const piece = localChess.get(from);
    const isPawn = piece?.type === 'p';
    const isPromotionRank = (piece?.color === 'w' && to.endsWith('8')) || (piece?.color === 'b' && to.endsWith('1'));

    if (isPawn && isPromotionRank) {
      if (settings.autoQueen) {
        if (settings.confirmMoves) {
          setPendingConfirmMove({ from, to, promotion: 'q' });
        } else {
          executeMove(from, to, 'q');
        }
      } else {
        setPendingPromotionMove({ from, to });
      }
      return;
    }

    if (settings.confirmMoves) {
      setPendingConfirmMove({ from, to });
    } else {
      executeMove(from, to);
    }
  };

  const handleSquareClick = (square: Square) => {
    if (isGameOver || !isMyTurn) return;

    if (selectedSquare) {
      const isDestination = legalDestinations.some((d) => d.square === square);
      if (isDestination) {
        checkAndInitiateMove(selectedSquare, square);
        return;
      }
    }

    const piece = localChess.get(square);
    const expectedColor = playerColor === 'white' ? 'w' : 'b';
    if (piece && piece.color === expectedColor) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  const handleMoveAttempt = (from: Square, to: Square) => {
    checkAndInitiateMove(from, to);
  };

  const handlePromotionSelect = (piece: PieceSymbol) => {
    if (!pendingPromotionMove) return;
    const { from, to } = pendingPromotionMove;
    setPendingPromotionMove(null);

    if (settings.confirmMoves) {
      setPendingConfirmMove({ from, to, promotion: piece });
    } else {
      executeMove(from, to, piece);
    }
  };

  const incomingDrawOffer =
    drawOfferedBy && ((isUserWhite && drawOfferedBy === 'b') || (!isUserWhite && drawOfferedBy === 'w'));

  const lastMoveFormatted = lastMove
    ? { from: lastMove.from as Square, to: lastMove.to as Square }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-6 space-y-4 animate-fadeIn">
      {/* Top Banner Navigation & Connection status */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/play')}
            className="gap-1.5 text-xs touch-manipulation"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lobby</span>
          </Button>
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-brand-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Online Match ({timeControl})
            </span>
          </div>
        </div>

        {/* Connection status badge */}
        <div className="flex items-center gap-2 text-xs">
          {connectionStatus === 'connected' ? (
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Connected</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-500 font-medium animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>{connectionStatus}...</span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Draw Offer Banner */}
      {incomingDrawOffer && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-slideDown">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">
            <Handshake className="w-5 h-5" />
            <span>Your opponent has offered a draw. Do you accept?</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={acceptDraw} className="bg-emerald-600 hover:bg-emerald-500 text-xs">
              Accept Draw
            </Button>
            <Button size="sm" variant="outline" onClick={declineDraw} className="text-xs">
              Decline
            </Button>
          </div>
        </div>
      )}

      {/* Move Confirmation Bar */}
      {pendingConfirmMove && (
        <div className="w-full max-w-[min(100vw-2rem,560px)] mx-auto p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-300">
            Confirm Move: {pendingConfirmMove.from} → {pendingConfirmMove.to}
            {pendingConfirmMove.promotion ? ` (${pendingConfirmMove.promotion.toUpperCase()})` : ''}?
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="primary"
              onClick={() => executeMove(pendingConfirmMove.from, pendingConfirmMove.to, pendingConfirmMove.promotion)}
              className="px-3 py-1 text-xs gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPendingConfirmMove(null)}
              className="px-3 py-1 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Waiting Room Screen */}
      {status === 'WAITING' && (
        <Card className="max-w-xl mx-auto p-6 sm:p-8 text-center space-y-6 shadow-2xl border border-slate-700/80">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Waiting for Opponent...
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Share the invitation link below with a friend or opponent to start the match.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-left">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Time Control</span>
              <span className="font-bold text-slate-200">{timeControl} Blitz</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Host (White)</span>
              <span className="font-bold text-brand-400">@{whitePlayer?.username || user?.username}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="w-full text-xs font-mono p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-400 select-all"
            />
            <Button onClick={handleCopyLink} className="w-full sm:w-auto shrink-0 gap-1.5 text-xs">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Active Online Chess Game */}
      {(status === 'ACTIVE' || status === 'FINISHED') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Main Board & Player Panels Column */}
          <div className="lg:col-span-8 flex flex-col items-center gap-3 w-full">
            {/* Top Opponent Panel */}
            <div className="w-full max-w-[min(100vw-2rem,560px)] flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-300">
                  {opponentPlayer?.username?.substring(0, 2).toUpperCase() || 'OP'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {opponentPlayer?.displayName || opponentPlayer?.username || 'Opponent'}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        opponentConnected ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span>{opponentConnected ? 'Online' : 'Disconnected'}</span>
                    <span>• {isUserWhite ? 'Black' : 'White'}</span>
                  </div>
                </div>
              </div>

              {/* Opponent Clock */}
              <div
                className={`px-3 py-1.5 rounded-xl font-mono text-base sm:text-lg font-black tracking-wider transition-colors ${
                  activeColor === (isUserWhite ? 'b' : 'w')
                    ? 'bg-brand-500/20 text-brand-500 border border-brand-500/40 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                {formatClock(opponentTime)}
              </div>
            </div>

            {/* Chess Board */}
            <div className="w-full flex justify-center">
              <ChessBoard
                orientation={orientation}
                turn={turn as Color}
                selectedSquare={selectedSquare}
                legalDestinations={legalDestinations}
                lastMove={lastMoveFormatted}
                checkSquare={isCheck ? (turn === 'w' ? 'e1' : 'e8') : null}
                getPieceAt={getPieceAt}
                onSquareClick={handleSquareClick}
                onMoveAttempt={handleMoveAttempt}
              />
            </div>

            {/* Bottom Self Player Panel */}
            <div className="w-full max-w-[min(100vw-2rem,560px)] flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                  {myPlayer?.username?.substring(0, 2).toUpperCase() ||
                    user?.username?.substring(0, 2).toUpperCase() ||
                    'ME'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {myPlayer?.displayName || myPlayer?.username || user?.username} (You)
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{isUserWhite ? 'White' : 'Black'}</span>
                    {isMyTurn && <span className="font-bold text-brand-500">• Your Turn</span>}
                  </div>
                </div>
              </div>

              {/* My Clock */}
              <div
                className={`px-3 py-1.5 rounded-xl font-mono text-base sm:text-lg font-black tracking-wider transition-colors ${
                  activeColor === (isUserWhite ? 'w' : 'b')
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                {formatClock(myTime)}
              </div>
            </div>

            {/* Mobile Action & History Bar */}
            <div className="w-full max-w-[min(100vw-2rem,560px)] flex items-center justify-between gap-1.5 pt-1 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs flex-1 touch-manipulation px-2"
                onClick={() => setOrientation(orientation === 'white' ? 'black' : 'white')}
                aria-label="Rotate board"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Flip</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs flex-1 touch-manipulation px-2"
                onClick={() => setIsMobileMovesOpen(true)}
                aria-label="View move list"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Moves ({moveHistory.length})</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs flex-1 touch-manipulation px-2 text-brand-500"
                onClick={() => setIsMobileChatOpen(true)}
                aria-label="Open game chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs flex-1 touch-manipulation px-2"
                disabled={isGameOver}
                onClick={offerDraw}
                aria-label="Propose peace"
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Draw</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1 text-xs text-rose-500 flex-1 touch-manipulation px-2"
                disabled={isGameOver}
                onClick={() => setIsResignModalOpen(true)}
                aria-label="Forfeit the match"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Resign</span>
              </Button>
            </div>
          </div>

          {/* Desktop Right Sidebar: Controls & Move History / Chat */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-3.5">
            {/* Game Action Buttons */}
            <Card className="p-3.5 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs flex-1"
                onClick={() => setOrientation(orientation === 'white' ? 'black' : 'white')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Flip</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs flex-1"
                disabled={isGameOver}
                onClick={offerDraw}
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Draw</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex-1"
                disabled={isGameOver}
                onClick={() => setIsResignModalOpen(true)}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Resign</span>
              </Button>
            </Card>

            {/* Sidebar Tab Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSidebarTab('moves')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'moves'
                    ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Moves ({moveHistory.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('chat')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'chat'
                    ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Game Chat</span>
              </button>
            </div>

            {/* TAB 1: Move History */}
            {sidebarTab === 'moves' && (
              <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Move History ({moveHistory.length} ply)
                </h3>
                <div className="h-64 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                  {moveHistory.length === 0 ? (
                    <p className="text-slate-500 italic py-4 text-center">
                      Game in progress. No moves yet.
                    </p>
                  ) : (
                    Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, idx) => {
                      const whiteMove = moveHistory[idx * 2];
                      const blackMove = moveHistory[idx * 2 + 1];
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        >
                          <span className="text-slate-500 w-8">{idx + 1}.</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                            {whiteMove?.san || ''}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                            {blackMove?.san || ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            )}

            {/* TAB 2: Real-time Game Chat */}
            {sidebarTab === 'chat' && (
              <GameChatPanel gameId={gameId || ''} isGameOver={isGameOver} />
            )}
          </div>
        </div>
      )}

      {/* Mobile Move History Drawer / Modal */}
      {isMobileMovesOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fadeIn"
          onClick={() => setIsMobileMovesOpen(false)}
        >
          <div
            className="bg-white dark:bg-dark-card rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[70vh] flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Move History ({moveHistory.length} ply)
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileMovesOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1">
              {moveHistory.length === 0 ? (
                <p className="text-slate-500 italic py-6 text-center">No moves yet</p>
              ) : (
                Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, idx) => {
                  const whiteMove = moveHistory[idx * 2];
                  const blackMove = moveHistory[idx * 2 + 1];
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/40"
                    >
                      <span className="text-slate-500 w-8">{idx + 1}.</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                        {whiteMove?.san || ''}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                        {blackMove?.san || ''}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Chat Drawer / Modal */}
      {isMobileChatOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fadeIn"
          onClick={() => setIsMobileChatOpen(false)}
        >
          <div
            className="bg-white dark:bg-dark-card rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[80vh] flex flex-col space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Game Chat</h3>
              <button
                type="button"
                onClick={() => setIsMobileChatOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <GameChatPanel gameId={gameId || ''} isGameOver={isGameOver} />
          </div>
        </div>
      )}

      {/* Pawn Promotion Modal */}
      <PromotionModal
        isOpen={Boolean(pendingPromotionMove)}
        color={turn as Color}
        onSelect={handlePromotionSelect}
        onCancel={() => setPendingPromotionMove(null)}
      />

      {/* Resignation Modal */}
      <Modal
        isOpen={isResignModalOpen}
        onClose={() => setIsResignModalOpen(false)}
        title="Resign Online Game"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to resign? Your opponent will be awarded the victory and rating points will be updated.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsResignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-500 text-white"
              onClick={() => {
                setIsResignModalOpen(false);
                resign();
              }}
            >
              Confirm Resign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Game End Modal */}
      {isGameOver && (
        <Modal
          isOpen={true}
          onClose={() => {}}
          title={
            result === 'DRAW'
              ? 'Game Drawn'
              : (result === 'WHITE_WIN' && isUserWhite) || (result === 'BLACK_WIN' && !isUserWhite)
              ? '🏆 Victory!'
              : 'Defeat'
          }
        >
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {result === 'WHITE_WIN'
                  ? 'White Wins!'
                  : result === 'BLACK_WIN'
                  ? 'Black Wins!'
                  : 'Drawn Game'}
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                {terminationReason || 'Match concluded'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/games')}
                className="flex-1 text-xs"
              >
                Review in Games
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/play')}
                className="flex-1 text-xs"
              >
                Play Another Game
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
