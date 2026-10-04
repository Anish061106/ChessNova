import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  RefreshCw,
  Swords,
  Paintbrush,
  Copy,
  Check,
  Pause,
  Play as PlayIcon,
  Flag,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Clock as ClockIcon,
  Globe,
  Loader2,
  Zap,
  Flame,
  Clock,
  Award,
  Bot,
  UserCheck,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ChessBoard } from '../components/chess/ChessBoard';
import { PromotionModal } from '../components/chess/PromotionModal';
import { GameResultModal } from '../components/chess/GameResultModal';
import { ConfirmModal } from '../components/chess/ConfirmModal';
import { TimeControlSelector } from '../components/chess/TimeControlSelector';
import { PlayerPanel } from '../components/chess/PlayerPanel';
import { MoveHistory } from '../components/chess/MoveHistory';
import { useChessGame } from '../hooks/useChessGame';
import { useChessClock } from '../hooks/useChessClock';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useMatchmakingStore } from '../store/matchmakingStore';
import { socketService } from '../services/socketService';
import { soundService } from '../utils/soundService';
import { BOARD_THEMES } from '../utils/boardThemes';
import { MatchmakingQueueModal } from '../components/multiplayer/MatchmakingQueueModal';
import { ChallengePlayerModal } from '../components/multiplayer/ChallengePlayerModal';
import { ComputerGameSetupModal } from '../components/ai/ComputerGameSetupModal';
import { stockfishService } from '../services/ai/stockfishService';
import { AIDifficulty, AIPlayerColorChoice } from '../types/ai';
import { AI_DIFFICULTIES } from '../services/ai/aiConfig';
import {
  BoardThemeName,
  Color,
  BoardOrientation,
  TimeControl,
  TIME_CONTROLS,
  Square,
  PieceSymbol,
} from '../types/chess';
import { ListOrdered, X } from 'lucide-react';

export const Play: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const settings = useSettingsStore();

  // Play Mode: 'local' | 'computer'
  const [playMode, setPlayMode] = useState<'local' | 'computer'>('local');

  // Computer Game Configuration & State
  const [isComputerModalOpen, setIsComputerModalOpen] = useState(false);
  const [computerDifficulty, setComputerDifficulty] = useState<AIDifficulty>('medium');
  const [computerHumanColor, setComputerHumanColor] = useState<Color>('w');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const aiSessionIdRef = useRef<number>(1);

  // Matchmaking store
  const {
    status: matchmakingStatus,
    gameId: matchedGameId,
    startSearch,
    cancelSearch,
    resetMatchmaking,
  } = useMatchmakingStore();

  // Challenge modal state
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);

  // Selected quick match time control
  const [selectedQuickMatchTc, setSelectedQuickMatchTc] = useState('5+3');

  // Sound toggle state (persisted via soundService and settingsStore)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => settings.soundEnabled);

  // Time control selection modal state
  const [isTimeControlModalOpen, setIsTimeControlModalOpen] = useState(false);

  // Online match creation modal state
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [onlineTimeControl, setOnlineTimeControl] = useState('5+3');
  const [isCreatingOnline, setIsCreatingOnline] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);

  // Mobile move history drawer
  const [isMobileMovesOpen, setIsMobileMovesOpen] = useState(false);

  // Move confirmation state (settings.confirmMoves)
  const [pendingConfirmMove, setPendingConfirmMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // Auto-redirect on matchmaking matched
  useEffect(() => {
    if (matchmakingStatus === 'matched' && matchedGameId) {
      const gId = matchedGameId;
      resetMatchmaking();
      navigate(`/online/${gId}`);
    }
  }, [matchmakingStatus, matchedGameId, navigate, resetMatchmaking]);

  // Confirmation modal states
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    type: 'resign' | 'restart' | null;
  }>({ isOpen: false, type: null });

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playContainerRef = useRef<HTMLDivElement>(null);

  // Player identity tracking for Rematch (swapping colors)
  const [playerOneColor, setPlayerOneColor] = useState<BoardOrientation>('white');

  // Dismissed game-end modal state (for "Review Board")
  const [isResultDismissed, setIsResultDismissed] = useState(false);
  const [copiedFen, setCopiedFen] = useState(false);

  // Local chess engine hook
  const {
    turn,
    inCheck,
    checkSquare,
    isGameOver,
    gameResult,
    lastMove,
    history,
    capturedPieces,
    selectedSquare,
    legalDestinations,
    pendingPromotion,
    orientation,
    boardTheme,
    selectSquare,
    makeMove,
    confirmPromotion,
    cancelPromotion,
    flipBoard,
    resetGame,
    newGame,
    resign,
    flagTimeout,
    setBoardTheme,
    setOrientation,
    getPieceAt,
    getFen,
  } = useChessGame();

  // Auto-queen preference handler
  useEffect(() => {
    if (settings.autoQueen && pendingPromotion) {
      confirmPromotion('q');
    }
  }, [settings.autoQueen, pendingPromotion, confirmPromotion]);

  // Clock timeout callback
  const handleTimeout = useCallback(
    (timedOutColor: Color) => {
      flagTimeout(timedOutColor);
    },
    [flagTimeout]
  );

  // Chess clock hook (100ms precision)
  const {
    timeControl,
    whiteTimeMs,
    blackTimeMs,
    isRunning,
    isPaused,
    setTimeControl,
    switchTurn,
    pause,
    resume,
    reset,
  } = useChessClock({
    initialTimeControl: TIME_CONTROLS[3], // Default 5+3 Blitz
    onTimeout: handleTimeout,
  });

  // Keep soundService synced with soundEnabled toggle
  useEffect(() => {
    soundService.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    settings.updateSetting('soundEnabled', nextVal);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleSelectTimeControl = (tc: TimeControl) => {
    setTimeControl(tc);
    setIsTimeControlModalOpen(false);
    resetGame();
    reset(tc);
    setIsResultDismissed(false);
  };

  // AI Move calculation trigger
  const triggerAiTurn = useCallback(
    async (currentFen: string, aiColor: Color, sessionId: number) => {
      if (isGameOver || isAiThinking) return;

      setIsAiThinking(true);
      try {
        const response = await stockfishService.requestBestMove(
          currentFen,
          computerDifficulty,
          sessionId
        );

        // Discard if session changed while calculating
        if (sessionId !== aiSessionIdRef.current) return;

        const success = makeMove(
          response.from as Square,
          response.to as Square,
          (response.promotion as PieceSymbol) || undefined
        );

        if (success) {
          switchTurn(aiColor);
        }
      } catch (err) {
        console.error('AI Move Error:', err);
      } finally {
        if (sessionId === aiSessionIdRef.current) {
          setIsAiThinking(false);
        }
      }
    },
    [isGameOver, isAiThinking, computerDifficulty, makeMove, switchTurn]
  );

  const handleSquareClick = (square: Square) => {
    if (isGameOver || isPaused) return;
    if (playMode === 'computer' && (isAiThinking || turn !== computerHumanColor)) return;

    if (settings.confirmMoves && selectedSquare) {
      const isDest = legalDestinations.some((d) => d.square === square);
      if (isDest) {
        setPendingConfirmMove({ from: selectedSquare, to: square });
        return;
      }
    }

    selectSquare(square);
  };

  const handleMoveAttempt = (from: Square, to: Square) => {
    if (isGameOver || isPaused) return;
    if (playMode === 'computer' && (isAiThinking || turn !== computerHumanColor)) return;

    if (settings.confirmMoves) {
      setPendingConfirmMove({ from, to });
      return;
    }

    const success = makeMove(from, to);
    if (success) {
      switchTurn(turn);
      if (playMode === 'computer' && !isGameOver) {
        const nextFen = getFen();
        const aiColor: Color = computerHumanColor === 'w' ? 'b' : 'w';
        const currentSession = aiSessionIdRef.current;
        setTimeout(() => {
          triggerAiTurn(nextFen, aiColor, currentSession);
        }, 150);
      }
    }
  };

  const handleExecuteConfirmedMove = () => {
    if (!pendingConfirmMove) return;
    const { from, to } = pendingConfirmMove;
    setPendingConfirmMove(null);
    const success = makeMove(from, to);
    if (success) {
      switchTurn(turn);
      if (playMode === 'computer' && !isGameOver) {
        const nextFen = getFen();
        const aiColor: Color = computerHumanColor === 'w' ? 'b' : 'w';
        const currentSession = aiSessionIdRef.current;
        setTimeout(() => {
          triggerAiTurn(nextFen, aiColor, currentSession);
        }, 150);
      }
    }
  };

  const handleTogglePause = () => {
    if (isGameOver) return;
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  const handleResignConfirm = () => {
    stockfishService.stop();
    setIsAiThinking(false);
    aiSessionIdRef.current += 1;
    resign(turn);
    setConfirmModalState({ isOpen: false, type: null });
  };

  const handleRestartConfirm = () => {
    stockfishService.stop();
    setIsAiThinking(false);
    aiSessionIdRef.current += 1;
    resetGame();
    reset();
    setIsResultDismissed(false);
    setConfirmModalState({ isOpen: false, type: null });

    if (playMode === 'computer' && computerHumanColor === 'b') {
      const currentSession = aiSessionIdRef.current;
      setTimeout(() => {
        triggerAiTurn(getFen(), 'w', currentSession);
      }, 500);
    }
  };

  const handleRematch = () => {
    stockfishService.stop();
    setIsAiThinking(false);
    aiSessionIdRef.current += 1;

    if (playMode === 'computer') {
      const nextHumanColor: Color = computerHumanColor === 'w' ? 'b' : 'w';
      setComputerHumanColor(nextHumanColor);
      setOrientation(nextHumanColor === 'w' ? 'white' : 'black');
      newGame();
      reset();
      setIsResultDismissed(false);

      if (nextHumanColor === 'b') {
        const currentSession = aiSessionIdRef.current;
        setTimeout(() => {
          triggerAiTurn(getFen(), 'w', currentSession);
        }, 500);
      }
    } else {
      const nextPlayerOneColor: BoardOrientation = playerOneColor === 'white' ? 'black' : 'white';
      setPlayerOneColor(nextPlayerOneColor);
      setOrientation(nextPlayerOneColor);
      newGame();
      reset();
      setIsResultDismissed(false);
    }
  };

  const handleStartComputerGame = (
    difficulty: AIDifficulty,
    color: AIPlayerColorChoice,
    tc: TimeControl
  ) => {
    setPlayMode('computer');
    setComputerDifficulty(difficulty);

    let hColor: Color = 'w';
    if (color === 'random') {
      hColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      hColor = color === 'white' ? 'w' : 'b';
    }

    setComputerHumanColor(hColor);
    setOrientation(hColor === 'w' ? 'white' : 'black');

    aiSessionIdRef.current += 1;
    stockfishService.stop();
    setIsAiThinking(false);

    setTimeControl(tc);
    resetGame();
    reset(tc);
    setIsResultDismissed(false);

    if (hColor === 'b') {
      const currentSession = aiSessionIdRef.current;
      setTimeout(() => {
        triggerAiTurn(getFen(), 'w', currentSession);
      }, 500);
    }
  };

  const handleCopyFen = () => {
    const currentFen = getFen();
    navigator.clipboard.writeText(currentFen);
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  const handleCreateOnlineMatch = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/play' } } });
      return;
    }

    setIsCreatingOnline(true);
    setOnlineError(null);

    try {
      await socketService.connect();
      const gameId = await socketService.createGame(onlineTimeControl);
      setIsOnlineModalOpen(false);
      navigate(`/online/${gameId}`);
    } catch (err: any) {
      setOnlineError(err.message || 'Failed to initialize online game session');
    } finally {
      setIsCreatingOnline(false);
    }
  };

  const activeThemeColors = BOARD_THEMES[boardTheme] || BOARD_THEMES.classic;

  const topColor: Color = orientation === 'white' ? 'b' : 'w';
  const bottomColor: Color = orientation === 'white' ? 'w' : 'b';

  const getPlayerName = (color: Color) => {
    if (playMode === 'computer') {
      if (color !== computerHumanColor) {
        return `Stockfish AI (${AI_DIFFICULTIES[computerDifficulty].name.split(' ')[0]})`;
      }
      return 'You (Human)';
    }

    const playerOneColorCode: Color = playerOneColor === 'white' ? 'w' : 'b';
    if (color === playerOneColorCode) {
      return 'Player 1';
    }
    return 'Player 2';
  };

  const topName = getPlayerName(topColor);
  const bottomName = getPlayerName(bottomColor);

  const topCaptured = topColor === 'b' ? capturedPieces.black : capturedPieces.white;
  const topAdvantage = topColor === 'b' ? -capturedPieces.whiteAdvantage : capturedPieces.whiteAdvantage;

  const bottomCaptured = bottomColor === 'w' ? capturedPieces.white : capturedPieces.black;
  const bottomAdvantage = bottomColor === 'w' ? capturedPieces.whiteAdvantage : -capturedPieces.whiteAdvantage;

  const topTimeMs = topColor === 'w' ? whiteTimeMs : blackTimeMs;
  const bottomTimeMs = bottomColor === 'w' ? whiteTimeMs : blackTimeMs;

  return (
    <div
      ref={playContainerRef}
      className={`max-w-7xl mx-auto w-full p-2.5 sm:p-5 lg:p-7 flex flex-col lg:flex-row gap-5 items-start ${
        isFullscreen ? 'bg-slate-50 dark:bg-dark-bg min-h-screen p-4' : ''
      }`}
    >
      {/* Main Board Arena Column */}
      <div className="flex-1 w-full flex flex-col items-center max-w-2xl mx-auto">
        {/* Top Player Panel (Opponent) */}
        {/* AI Thinking Banner */}
        {playMode === 'computer' && isAiThinking && (
          <div className="w-full max-w-[min(100vw-2rem,560px)] mx-auto p-2.5 mb-2 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center gap-2 text-brand-600 dark:text-brand-400 font-semibold text-xs animate-pulse shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
            <span>Stockfish AI is calculating...</span>
          </div>
        )}

        {/* Top Player Panel (Opponent) */}
        <div className="w-full mb-2.5">
          <PlayerPanel
            color={topColor}
            name={topName}
            ratingPlaceholder={1500}
            timeMs={topTimeMs}
            isActive={turn === topColor && isRunning && !isPaused && !isGameOver}
            isPaused={isPaused && turn === topColor}
            inCheck={turn === topColor && inCheck}
            capturedPieces={topCaptured}
            advantage={topAdvantage}
          />
        </div>

        {/* 64-Square Interactive Chess Board */}
        <div className="relative w-full flex justify-center">
          <ChessBoard
            orientation={orientation}
            theme={activeThemeColors}
            turn={turn}
            selectedSquare={selectedSquare}
            legalDestinations={legalDestinations}
            lastMove={lastMove}
            checkSquare={checkSquare}
            getPieceAt={getPieceAt}
            onSquareClick={handleSquareClick}
            onMoveAttempt={handleMoveAttempt}
          />

          {/* Paused Overlay */}
          {isPaused && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white z-20 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700 shadow-2xl flex flex-col items-center">
                <Pause className="w-10 h-10 text-amber-400 mb-2 animate-pulse" />
                <h3 className="text-xl font-extrabold uppercase tracking-wider mb-1">
                  Game Paused
                </h3>
                <p className="text-xs text-slate-300 mb-4">
                  Clocks and moves are currently frozen
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleTogglePause}
                  className="gap-2 shadow-nova"
                >
                  <PlayIcon className="w-4 h-4 fill-white" />
                  <span>Resume Game</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Player Panel (Player) */}
        <div className="w-full mt-2.5">
          <PlayerPanel
            color={bottomColor}
            name={bottomName}
            ratingPlaceholder={1500}
            timeMs={bottomTimeMs}
            isActive={turn === bottomColor && isRunning && !isPaused && !isGameOver}
            isPaused={isPaused && turn === bottomColor}
            inCheck={turn === bottomColor && inCheck}
            capturedPieces={bottomCaptured}
            advantage={bottomAdvantage}
          />
        </div>

        {/* Move Confirmation Bar */}
        {pendingConfirmMove && (
          <div className="w-full max-w-[min(100vw-2rem,560px)] mx-auto p-3 mt-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-300">
              Confirm Move: {pendingConfirmMove.from} → {pendingConfirmMove.to}?
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="primary"
                onClick={handleExecuteConfirmedMove}
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

        {/* Mobile Quick Action Buttons Bar */}
        <div className="w-full max-w-[min(100vw-2rem,560px)] flex items-center justify-between gap-2 pt-2 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs flex-1 touch-manipulation"
            onClick={flipBoard}
            aria-label="Rotate board"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rotate</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs flex-1 touch-manipulation"
            onClick={() => setIsMobileMovesOpen(true)}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Moves ({history.length})</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs flex-1 touch-manipulation"
            disabled={isGameOver}
            onClick={handleTogglePause}
          >
            {isPaused ? <PlayIcon className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1 text-xs text-rose-500 flex-1 touch-manipulation"
            disabled={isGameOver}
            onClick={() => setConfirmModalState({ isOpen: true, type: 'resign' })}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Resign</span>
          </Button>
        </div>
      </div>

      {/* Side Game Controls & Info Column */}
      <div className="w-full lg:w-80 flex flex-col gap-3.5">
        {/* Play Mode Selector Switcher */}
        <Card className="p-2 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPlayMode('local');
                stockfishService.stop();
                setIsAiThinking(false);
                aiSessionIdRef.current += 1;
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                playMode === 'local'
                  ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Pass & Play</span>
            </button>
            <button
              type="button"
              onClick={() => setIsComputerModalOpen(true)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                playMode === 'computer'
                  ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-brand-500" />
              <span>vs Computer</span>
            </button>
          </div>
        </Card>

        {/* Online Multiplayer Hub */}
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-brand-600/10 via-indigo-600/5 to-purple-600/10 border border-brand-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Play Online
              </span>
            </div>
            <Badge variant="brand" size="sm">
              Live
            </Badge>
          </div>

          {/* Quick Match Time Controls */}
          <div className="space-y-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Quick Match Time Control
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: '1+0', name: '1+0', cat: 'Bullet', icon: Zap },
                { id: '3+0', name: '3+0', cat: 'Blitz', icon: Flame },
                { id: '5+3', name: '5+3', cat: 'Blitz', icon: Flame },
                { id: '10+0', name: '10+0', cat: 'Rapid', icon: Clock },
                { id: '15+10', name: '15+10', cat: 'Rapid', icon: Clock },
                { id: '30+0', name: '30+0', cat: 'Classical', icon: Award },
              ].map(({ id, name, cat, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedQuickMatchTc(id)}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    selectedQuickMatchTc === id
                      ? 'border-brand-500 bg-brand-500/15 text-brand-600 dark:text-brand-400 font-bold ring-1 ring-brand-500/40'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-[11px] font-semibold">
                    <Icon className="w-3 h-3 text-brand-500" />
                    <span>{name}</span>
                  </div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-tighter block">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Find Opponent Button */}
          <Button
            size="sm"
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login', { state: { from: { pathname: '/play' } } });
              } else {
                startSearch(selectedQuickMatchTc);
              }
            }}
            className="w-full gap-2 text-xs shadow-nova mb-2"
          >
            <Swords className="w-4 h-4" />
            <span>{isAuthenticated ? `Find Opponent (${selectedQuickMatchTc})` : 'Sign In to Play Online'}</span>
          </Button>

          {/* Secondary Actions: Challenge Player & Custom Room Link */}
          {isAuthenticated && (
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChallengeModalOpen(true)}
                className="text-[11px] py-1 px-2 text-slate-700 dark:text-slate-300"
              >
                Challenge
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOnlineModalOpen(true)}
                className="text-[11px] py-1 px-2 text-slate-700 dark:text-slate-300"
              >
                Private Link
              </Button>
            </div>
          )}
        </Card>


        {/* Game Status Card */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              {playMode === 'computer' ? (
                <Bot className="w-4 h-4 text-brand-500" />
              ) : (
                <Swords className="w-4 h-4 text-brand-500" />
              )}
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {playMode === 'computer' ? 'Computer Match' : 'Game Status'}
              </span>
            </div>
            <Badge
              variant={
                isGameOver
                  ? 'warning'
                  : isPaused
                  ? 'default'
                  : inCheck
                  ? 'danger'
                  : 'brand'
              }
              size="sm"
            >
              {isGameOver
                ? 'Game Over'
                : isPaused
                ? 'Paused'
                : inCheck
                ? 'Check!'
                : `${turn === 'w' ? 'White' : 'Black'} to move`}
            </Badge>
          </div>

          <div className="flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5" />
                Time Control:
              </span>
              <button
                onClick={() => {
                  if (playMode === 'computer') {
                    setIsComputerModalOpen(true);
                  } else {
                    setIsTimeControlModalOpen(true);
                  }
                }}
                className="font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                title="Change time control"
              >
                {timeControl.name}
                <span className="text-[10px] text-slate-400 font-normal">
                  ({timeControl.category})
                </span>
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Mode:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {playMode === 'computer'
                  ? `vs Stockfish (${AI_DIFFICULTIES[computerDifficulty].name.split(' ')[0]})`
                  : 'Local Pass & Play'}
              </span>
            </div>
            {playMode === 'computer' && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Difficulty:</span>
                <button
                  onClick={() => setIsComputerModalOpen(true)}
                  className="font-bold text-brand-500 hover:underline flex items-center gap-1"
                >
                  {AI_DIFFICULTIES[computerDifficulty].name}
                  <span className="text-[10px] text-slate-400 font-normal">
                    (~{AI_DIFFICULTIES[computerDifficulty].estimatedElo})
                  </span>
                </button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Turn:</span>
              <span className="font-bold text-brand-500">
                {turn === 'w' ? 'White to move' : 'Black to move'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Moves:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {history.length}
              </span>
            </div>
          </div>
        </Card>

        {/* Move History Card */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Move History
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {history.length} {history.length === 1 ? 'Turn' : 'Turns'}
            </span>
          </div>

          <MoveHistory history={history} />
        </Card>

        {/* Game Controls Card */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Game Controls
            </h3>
            {/* Audio & Fullscreen Quick Toggles */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  soundEnabled
                    ? 'border-brand-500/40 text-brand-500 bg-brand-500/10'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                }`}
                title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
                aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePause}
              disabled={isGameOver}
              className="gap-1.5 text-xs"
              aria-label={isPaused ? 'Resume game' : 'Pause game'}
            >
              {isPaused ? (
                <>
                  <PlayIcon className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={flipBoard}
              className="gap-1.5 text-xs"
              aria-label="Flip board orientation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Flip Board</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalState({ isOpen: true, type: 'restart' })}
              className="gap-1.5 text-xs"
              aria-label="Restart current game"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalState({ isOpen: true, type: 'resign' })}
              disabled={isGameOver}
              className="gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:border-rose-500"
              aria-label="Resign current game"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Resign</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsTimeControlModalOpen(true)}
              className="gap-1.5 col-span-2 text-xs shadow-nova"
              aria-label="Start new game with time control selection"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Game</span>
            </Button>
          </div>

          {/* Board Theme Selector */}
          <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Paintbrush className="w-3.5 h-3.5" />
                Board Theme:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize">
                {boardTheme}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['classic', 'modern', 'midnight'] as BoardThemeName[]).map((themeName) => (
                <button
                  key={themeName}
                  type="button"
                  onClick={() => setBoardTheme(themeName)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium border capitalize transition-all ${
                    boardTheme === themeName
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {themeName}
                </button>
              ))}
            </div>
          </div>

          {/* Copy FEN utility */}
          <div className="pt-2.5 mt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500">Position FEN</span>
            <button
              type="button"
              onClick={handleCopyFen}
              className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors"
              title="Copy FEN string"
            >
              {copiedFen ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </Card>
      </div>

      {/* Online Match Creator Modal */}
      <Modal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        title="Create Online Game"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select the time control for your online match. You will receive a shareable link to invite an opponent.
          </p>

          {onlineError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {onlineError}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: '1+0', name: '1+0 Bullet', icon: Zap, cat: 'Bullet' },
              { id: '3+0', name: '3+0 Blitz', icon: Flame, cat: 'Blitz' },
              { id: '5+3', name: '5+3 Blitz', icon: Flame, cat: 'Blitz' },
              { id: '10+0', name: '10+0 Rapid', icon: Clock, cat: 'Rapid' },
              { id: '15+10', name: '15+10 Rapid', icon: Clock, cat: 'Rapid' },
              { id: '30+0', name: '30+0 Classical', icon: Award, cat: 'Classical' },
            ].map(({ id, name, icon: Icon, cat }) => (
              <button
                key={id}
                type="button"
                onClick={() => setOnlineTimeControl(id)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                  onlineTimeControl === id
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold ring-2 ring-brand-500/30'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-4 h-4 text-brand-500" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{cat}</span>
                </div>
                <span className="text-xs font-semibold">{name}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOnlineModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isCreatingOnline}
              onClick={handleCreateOnlineMatch}
              className="gap-2"
            >
              {isCreatingOnline ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Room...</span>
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  <span>Create Room</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Promotion Selection Modal */}
      <PromotionModal
        isOpen={Boolean(pendingPromotion)}
        color={turn}
        onSelect={confirmPromotion}
        onCancel={cancelPromotion}
      />

      {/* Time Control Selector Modal */}
      <TimeControlSelector
        isOpen={isTimeControlModalOpen}
        selectedControl={timeControl}
        onSelect={handleSelectTimeControl}
        onClose={() => setIsTimeControlModalOpen(false)}
      />

      {/* Resign / Restart Confirmation Modals */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen && confirmModalState.type === 'resign'}
        title="Resign Game?"
        message="Are you sure you want to resign? Your opponent will immediately be declared the winner."
        confirmLabel="Resign"
        variant="danger"
        onConfirm={handleResignConfirm}
        onCancel={() => setConfirmModalState({ isOpen: false, type: null })}
      />

      <ConfirmModal
        isOpen={confirmModalState.isOpen && confirmModalState.type === 'restart'}
        title="Restart Game?"
        message="Your current game and move history will be lost. Clocks will reset to original time."
        confirmLabel="Restart"
        variant="warning"
        onConfirm={handleRestartConfirm}
        onCancel={() => setConfirmModalState({ isOpen: false, type: null })}
      />

      {/* Game Result Modal (with Rematch) */}
      <GameResultModal
        isOpen={isGameOver && !isResultDismissed}
        result={gameResult}
        onRematch={handleRematch}
        onNewGame={() => {
          setIsResultDismissed(true);
          setIsTimeControlModalOpen(true);
        }}
        onClose={() => setIsResultDismissed(true)}
      />

      {/* Matchmaking Queue Modal */}
      <MatchmakingQueueModal
        isOpen={matchmakingStatus === 'searching'}
        onCancel={cancelSearch}
      />

      {/* Challenge Player Modal */}
      <ChallengePlayerModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
      />

      {/* Computer Game Setup Modal */}
      <ComputerGameSetupModal
        isOpen={isComputerModalOpen}
        onClose={() => setIsComputerModalOpen(false)}
        onStartGame={handleStartComputerGame}
        initialDifficulty={computerDifficulty}
        initialColor={computerHumanColor === 'w' ? 'white' : 'black'}
        initialTimeControl={timeControl.name as any}
      />

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
                Move History ({history.length} {history.length === 1 ? 'Turn' : 'Turns'})
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileMovesOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <MoveHistory history={history} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

