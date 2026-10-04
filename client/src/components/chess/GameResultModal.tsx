import React from 'react';
import { Trophy, RefreshCw, Handshake, Clock, Flag, Eye } from 'lucide-react';
import { GameResult } from '../../types/chess';
import { Button } from '../ui/Button';

interface GameResultModalProps {
  isOpen: boolean;
  result: GameResult | null;
  onRematch: () => void;
  onNewGame: () => void;
  onClose: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  isOpen,
  result,
  onRematch,
  onNewGame,
  onClose,
}) => {
  if (!isOpen || !result) return null;

  const isCheckmate = result.reason === 'checkmate';
  const isTimeout = result.reason === 'timeout';
  const isResignation = result.reason === 'resignation';
  const isDraw = result.winner === 'draw';

  let title = 'Game Over';
  let subtitle = '';
  let IconComponent = Trophy;

  if (isCheckmate) {
    title = 'Checkmate';
    subtitle = `${result.winner === 'w' ? 'White' : 'Black'} wins by checkmate!`;
    IconComponent = Trophy;
  } else if (isTimeout) {
    title = 'Time Out';
    subtitle = `${result.winner === 'w' ? 'White' : 'Black'} wins on time!`;
    IconComponent = Clock;
  } else if (isResignation) {
    title = 'Resignation';
    subtitle = `${result.winner === 'w' ? 'White' : 'Black'} wins by resignation!`;
    IconComponent = Flag;
  } else if (isDraw) {
    title = 'Draw';
    IconComponent = Handshake;
    switch (result.reason) {
      case 'stalemate':
        subtitle = 'Stalemate — No legal moves available.';
        break;
      case 'threefold_repetition':
        subtitle = 'Draw by threefold repetition.';
        break;
      case 'insufficient_material':
        subtitle = 'Draw — Insufficient mating material.';
        break;
      case '50_move_rule':
        subtitle = 'Draw by 50-move rule.';
        break;
      default:
        subtitle = 'The game is drawn.';
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game Result Announcement"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 p-7 shadow-2xl text-center flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 shadow-nova-sm">
          <IconComponent className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-1">
          {title}
        </h2>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6">
          {subtitle}
        </p>

        <div className="flex flex-col gap-2.5 w-full">
          <Button
            size="md"
            variant="primary"
            onClick={onRematch}
            className="w-full gap-2 shadow-nova"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rematch (Swap Colors)</span>
          </Button>

          <Button
            size="md"
            variant="outline"
            onClick={onNewGame}
            className="w-full gap-2"
          >
            <span>New Game</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="w-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Review Board</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
