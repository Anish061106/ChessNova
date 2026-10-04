import React from 'react';
import { Clock, Pause } from 'lucide-react';
import { formatClockTime } from '../../hooks/useChessClock';

interface ChessClockProps {
  timeMs: number;
  isActive: boolean;
  isPaused?: boolean;
  color: 'w' | 'b';
  label?: string;
}

export const ChessClock: React.FC<ChessClockProps> = ({
  timeMs,
  isActive,
  isPaused = false,
  color,
  label,
}) => {
  const formattedTime = formatClockTime(timeMs);
  const isLowTime = timeMs < 30000 && timeMs > 0;
  const isCriticalTime = timeMs < 10000 && timeMs > 0;

  // Accessible descriptive announcement
  const totalSeconds = Math.max(0, Math.ceil(timeMs / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const ariaText = `${label || (color === 'w' ? 'White' : 'Black')} clock: ${mins} minutes ${secs} seconds remaining`;

  return (
    <div
      role="timer"
      aria-label={ariaText}
      aria-live={isCriticalTime ? 'assertive' : 'off'}
      className={`relative flex items-center justify-between px-3.5 py-1.5 rounded-xl border transition-all duration-150 select-none min-w-[110px] sm:min-w-[124px] ${
        isCriticalTime && isActive
          ? 'bg-rose-500/15 border-rose-500 text-rose-500 dark:text-rose-400 shadow-sm animate-pulse'
          : isLowTime && isActive
          ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
          : isActive
          ? 'bg-brand-500/10 dark:bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/20 shadow-sm'
          : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 opacity-90'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {isPaused && isActive ? (
          <Pause className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        ) : (
          <Clock
            className={`w-3.5 h-3.5 ${
              isCriticalTime && isActive
                ? 'text-rose-500'
                : isLowTime && isActive
                ? 'text-amber-500'
                : isActive
                ? 'text-brand-500'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          />
        )}
        <span
          className={`font-mono text-base sm:text-lg font-extrabold tracking-tight ${
            isCriticalTime && isActive
              ? 'text-rose-600 dark:text-rose-400'
              : isLowTime && isActive
              ? 'text-amber-600 dark:text-amber-400'
              : isActive
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {formattedTime}
        </span>
      </div>

      {isActive && (
        <span className="flex h-2 w-2 relative ml-1.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isCriticalTime ? 'bg-rose-400' : 'bg-brand-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isCriticalTime ? 'bg-rose-500' : 'bg-brand-500'
            }`}
          />
        </span>
      )}
    </div>
  );
};
