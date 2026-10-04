import React from 'react';
import { User, AlertCircle } from 'lucide-react';
import { Color, PieceSymbol } from '../../types/chess';
import { CapturedPieces } from './CapturedPieces';
import { ChessClock } from './ChessClock';

interface PlayerPanelProps {
  color: Color;
  name: string;
  ratingPlaceholder?: number;
  timeMs: number;
  isActive: boolean;
  isPaused?: boolean;
  inCheck?: boolean;
  capturedPieces: PieceSymbol[];
  advantage: number;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  color,
  name,
  ratingPlaceholder = 1500,
  timeMs,
  isActive,
  isPaused = false,
  inCheck = false,
  capturedPieces,
  advantage,
}) => {
  const isWhite = color === 'w';

  return (
    <div
      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
        isActive
          ? 'bg-white dark:bg-dark-card border-brand-500/40 shadow-sm ring-1 ring-brand-500/20'
          : 'bg-white/70 dark:bg-dark-card/60 border-slate-200/80 dark:border-slate-800/80 opacity-90'
      }`}
    >
      {/* Player identity & captured pieces */}
      <div className="flex items-center gap-3">
        {/* Avatar & Color Badge */}
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-all ${
              isWhite
                ? 'bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-900 border border-slate-300'
                : 'bg-gradient-to-tr from-slate-800 to-slate-950 text-slate-100 border border-slate-700'
            }`}
          >
            <User className="w-5 h-5 opacity-80" />
          </div>
          <span
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold border-2 border-white dark:border-dark-card ${
              isWhite ? 'bg-amber-100 text-amber-900' : 'bg-slate-900 text-white'
            }`}
          >
            {isWhite ? 'W' : 'B'}
          </span>
        </div>

        {/* Name, rating & turn badge */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {name}
            </span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              ({ratingPlaceholder})
            </span>
            {isActive && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block" />
                Your Turn
              </span>
            )}
          </div>

          {/* Captured Pieces tray */}
          <div className="mt-1">
            <CapturedPieces color={color} pieces={capturedPieces} advantage={advantage} />
          </div>
        </div>
      </div>

      {/* Right side: Check indicator & Clock */}
      <div className="flex items-center gap-2.5">
        {isActive && inCheck && (
          <span className="text-rose-500 font-bold text-xs hidden sm:flex items-center gap-1 animate-bounce">
            <AlertCircle className="w-3.5 h-3.5" />
            Check!
          </span>
        )}

        <ChessClock
          timeMs={timeMs}
          isActive={isActive}
          isPaused={isPaused}
          color={color}
          label={name}
        />
      </div>
    </div>
  );
};
