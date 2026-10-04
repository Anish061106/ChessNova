import React, { useEffect, useRef } from 'react';
import { PairedMove } from '../../types/chess';

interface MoveHistoryProps {
  history: PairedMove[];
  className?: string;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new moves are made
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  if (history.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400 ${className}`}>
        <span>No moves played yet.</span>
        <span className="text-[11px] text-slate-500 mt-1">Make your first move to start!</span>
      </div>
    );
  }

  const lastIndex = history.length - 1;
  const lastPair = history[lastIndex];
  const lastIsBlack = Boolean(lastPair?.black);

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto max-h-60 pr-1 text-xs font-mono select-none ${className}`}
      aria-label="Move History"
    >
      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
        {history.map((pair, idx) => {
          const isLatestMove = idx === lastIndex;

          return (
            <div
              key={pair.moveNumber}
              className={`flex items-center py-1.5 px-2 rounded-md transition-colors ${
                idx % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''
              }`}
            >
              {/* Turn Number */}
              <span className="w-8 text-slate-400 dark:text-slate-500 font-semibold text-[11px]">
                {pair.moveNumber}.
              </span>

              {/* White Move */}
              <div
                className={`flex-1 px-2 py-0.5 rounded font-medium ${
                  isLatestMove && !lastIsBlack
                    ? 'bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {pair.white?.san || ''}
              </div>

              {/* Black Move */}
              <div
                className={`flex-1 px-2 py-0.5 rounded font-medium ${
                  isLatestMove && lastIsBlack
                    ? 'bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {pair.black?.san || ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
