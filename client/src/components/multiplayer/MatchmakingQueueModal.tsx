import React, { useEffect, useState } from 'react';
import { Loader2, Swords, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useMatchmakingStore } from '../../store/matchmakingStore';

interface MatchmakingQueueModalProps {
  isOpen: boolean;
  onCancel: () => void;
}

export const MatchmakingQueueModal: React.FC<MatchmakingQueueModalProps> = ({
  isOpen,
  onCancel,
}) => {
  const { timeControl, startedAt } = useMatchmakingStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      if (startedAt) {
        setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      } else {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, startedAt]);

  if (!isOpen) return null;

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6 animate-scaleIn">
        {/* Animated Icon */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-brand-500/10 text-brand-500 flex items-center justify-center animate-pulse">
            <Swords className="w-10 h-10" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-24 h-24 text-brand-500/30 animate-spin" />
          </div>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
            Matchmaking Queue
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Finding Opponent...
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Searching for a compatible player with <span className="font-bold text-slate-800 dark:text-slate-200">{timeControl}</span> time control.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-around">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Time Control
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {timeControl}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Elapsed Time
            </span>
            <span className="text-sm font-mono font-bold text-brand-500">
              {timeFormatted}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full gap-2 text-xs border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
          >
            <X className="w-4 h-4" />
            <span>Cancel Search</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
