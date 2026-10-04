import React, { useState, useMemo } from 'react';
import {
  Puzzle as PuzzleIcon,
  RotateCcw,
  ArrowRight,
  RefreshCw,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Flame,
  Zap,
  Shield,
  Layers,
} from 'lucide-react';
import { Chess } from 'chess.js';
import { usePuzzleGame } from '../hooks/usePuzzleGame';
import { ChessBoard } from '../components/chess/ChessBoard';
import { PromotionModal } from '../components/chess/PromotionModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useSettingsStore } from '../store/settingsStore';
import { BOARD_THEMES } from '../utils/boardThemes';
import { Square, PieceSymbol } from '../types/chess';

export const Puzzles: React.FC = () => {
  const settings = useSettingsStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Promotion state
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  const {
    puzzle,
    status,
    feedbackMessage,
    history,
    boardState,
    makePlayerMove,
    selectSquare,
    retryCurrent,
    loadNextPuzzle,
    loadPuzzleById,
    flipBoard,
  } = usePuzzleGame(selectedDifficulty === 'all' ? undefined : selectedDifficulty);

  // Calculate legal destinations and pieces from boardState.fen
  const chessInstance = useMemo(() => {
    return new Chess(boardState.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }, [boardState.fen]);

  const legalDestinations = useMemo(() => {
    if (!boardState.selectedSquare) return [];
    try {
      const moves = chessInstance.moves({
        square: boardState.selectedSquare,
        verbose: true,
      });
      return moves.map((m) => ({
        square: m.to as Square,
        isCapture: Boolean(m.captured),
      }));
    } catch {
      return [];
    }
  }, [chessInstance, boardState.selectedSquare]);

  const handleSquareClick = (square: Square) => {
    if (status === 'complete' || status === 'loading') return;

    if (boardState.selectedSquare) {
      // If clicking destination square
      const isDest = legalDestinations.some((d) => d.square === square);
      if (isDest) {
        handleMoveAttempt(boardState.selectedSquare, square);
        return;
      }
    }

    const piece = chessInstance.get(square);
    if (piece && piece.color === boardState.turn) {
      selectSquare(square);
    } else {
      selectSquare(null);
    }
  };

  const handleMoveAttempt = (from: Square, to: Square) => {
    const piece = chessInstance.get(from);

    // Check pawn promotion
    if (
      piece?.type === 'p' &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'))
    ) {
      if (settings.autoQueen) {
        makePlayerMove(from, to, 'q');
      } else {
        setPendingPromotionMove({ from, to });
      }
      return;
    }

    makePlayerMove(from, to);
    selectSquare(null);
  };

  const handlePromotionSelect = (pieceType: PieceSymbol) => {
    if (pendingPromotionMove) {
      makePlayerMove(pendingPromotionMove.from, pendingPromotionMove.to, pieceType);
      setPendingPromotionMove(null);
      selectSquare(null);
    }
  };

  const activeThemeColors = BOARD_THEMES[settings.boardTheme] || BOARD_THEMES.classic;

  return (
    <div className="max-w-7xl mx-auto w-full p-2.5 sm:p-5 lg:p-7 flex flex-col lg:flex-row gap-5 items-start">
      {/* Main Board Arena Column */}
      <div className="flex-1 w-full flex flex-col items-center max-w-2xl mx-auto">
        {/* Puzzle Header / Objective */}
        <div className="w-full mb-3 flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
              <PuzzleIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Tactical Challenge
                </span>
                {puzzle && (
                  <Badge variant="brand" size="sm">
                    {puzzle.rating} Rating
                  </Badge>
                )}
                {puzzle && (
                  <Badge
                    variant={
                      puzzle.difficulty === 'easy'
                        ? 'success'
                        : puzzle.difficulty === 'hard'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {puzzle.difficulty.toUpperCase()}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {boardState.turn === 'w' ? 'White' : 'Black'} to move and find the best continuation.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            {puzzle?.themes.slice(0, 2).map((theme) => (
              <span
                key={theme}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic Status Feedback Banner */}
        {feedbackMessage && (
          <div
            className={`w-full max-w-[min(100vw-2rem,560px)] mx-auto p-3 mb-2.5 rounded-2xl border flex items-center justify-between gap-2 shadow-sm animate-fadeIn ${
              status === 'complete'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : status === 'incorrect'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'bg-brand-500/15 border-brand-500/30 text-brand-600 dark:text-brand-400'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {status === 'complete' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : status === 'incorrect' ? (
                <AlertCircle className="w-4 h-4 text-rose-500" />
              ) : (
                <Sparkles className="w-4 h-4 text-brand-500" />
              )}
              <span>{feedbackMessage}</span>
            </div>
            {status === 'complete' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => loadNextPuzzle(selectedDifficulty === 'all' ? undefined : selectedDifficulty)}
                className="px-3 py-1 text-xs gap-1 shadow-sm"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* 64-Square Chess Board */}
        <div className="relative w-full flex justify-center">
          <ChessBoard
            orientation={boardState.orientation}
            theme={activeThemeColors}
            turn={boardState.turn}
            selectedSquare={boardState.selectedSquare}
            legalDestinations={legalDestinations}
            lastMove={boardState.lastMove}
            checkSquare={boardState.checkSquare}
            getPieceAt={(sq) => chessInstance.get(sq) || null}
            onSquareClick={handleSquareClick}
            onMoveAttempt={handleMoveAttempt}
          />
        </div>

        {/* Mobile Quick Action Buttons Bar */}
        <div className="w-full max-w-[min(100vw-2rem,560px)] flex items-center justify-between gap-2 pt-3 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs flex-1"
            onClick={flipBoard}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Flip</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs flex-1"
            onClick={retryCurrent}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-1 text-xs flex-1 shadow-nova"
            onClick={() => loadNextPuzzle(selectedDifficulty === 'all' ? undefined : selectedDifficulty)}
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Side Game Controls & Difficulty Column */}
      <div className="w-full lg:w-80 flex flex-col gap-3.5">
        {/* Difficulty Selector Card */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Difficulty Tier
            </span>
            <span className="text-[10px] font-mono text-brand-500 uppercase font-bold">
              {selectedDifficulty}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'all', label: 'All', icon: Layers },
              { id: 'easy', label: 'Easy', icon: Zap },
              { id: 'medium', label: 'Med', icon: Flame },
              { id: 'hard', label: 'Hard', icon: Shield },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSelectedDifficulty(id);
                  loadNextPuzzle(id === 'all' ? undefined : id);
                }}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  selectedDifficulty === id
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold ring-1 ring-brand-500/30'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-[11px] font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Puzzle Actions Card */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Puzzle Controls
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={retryCurrent}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={flipBoard}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Flip Board</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => loadNextPuzzle(selectedDifficulty === 'all' ? undefined : selectedDifficulty)}
              className="col-span-2 gap-1.5 text-xs shadow-nova"
            >
              <span>Next Puzzle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* Solved History Card */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Solves
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{history.length}</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
            {history.length === 0 ? (
              <p className="text-slate-500 italic py-4 text-center text-xs">
                No recent puzzle attempts recorded.
              </p>
            ) : (
              history.map((record) => (
                <div
                  key={record.id}
                  onClick={() => loadPuzzleById(record.puzzleId)}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:border-brand-500/40 cursor-pointer flex items-center justify-between gap-2 transition-all"
                >
                  <div className="flex items-center gap-2">
                    {record.correct ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {record.puzzle?.rating ? `${record.puzzle.rating} Rating` : 'Puzzle'}
                      </span>
                      <span className="text-[10px] text-slate-400 block capitalize">
                        {record.puzzle?.difficulty || 'Tactics'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{record.timeTaken}s</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={Boolean(pendingPromotionMove)}
        color={boardState.turn}
        onSelect={handlePromotionSelect}
        onCancel={() => setPendingPromotionMove(null)}
      />
    </div>
  );
};
