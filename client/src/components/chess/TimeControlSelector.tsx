import React, { useState } from 'react';
import { Zap, Flame, Clock, Trophy, X } from 'lucide-react';
import { TimeControl, TIME_CONTROLS, TimeControlCategory } from '../../types/chess';
import { Button } from '../ui/Button';

interface TimeControlSelectorProps {
  isOpen: boolean;
  selectedControl: TimeControl;
  onSelect: (control: TimeControl) => void;
  onClose?: () => void;
}

const CATEGORY_META: Record<
  TimeControlCategory,
  { label: string; icon: React.ReactNode; description: string }
> = {
  bullet: {
    label: 'Bullet',
    icon: <Zap className="w-4 h-4 text-amber-500" />,
    description: '< 3 minutes per player',
  },
  blitz: {
    label: 'Blitz',
    icon: <Flame className="w-4 h-4 text-orange-500" />,
    description: '3 - 5 minutes per player',
  },
  rapid: {
    label: 'Rapid',
    icon: <Clock className="w-4 h-4 text-brand-500" />,
    description: '10 - 15 minutes per player',
  },
  classical: {
    label: 'Classical',
    icon: <Trophy className="w-4 h-4 text-emerald-500" />,
    description: '30+ minutes per player',
  },
};

export const TimeControlSelector: React.FC<TimeControlSelectorProps> = ({
  isOpen,
  selectedControl,
  onSelect,
  onClose,
}) => {
  const [activeChoice, setActiveChoice] = useState<TimeControl>(selectedControl);

  if (!isOpen) return null;

  const categories: TimeControlCategory[] = ['bullet', 'blitz', 'rapid', 'classical'];

  const handleStartGame = () => {
    onSelect(activeChoice);
    if (onClose) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose Time Control"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Choose Time Control
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select time limit and increment for this local game
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close time control selector"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Categories & Options */}
        <div className="space-y-4 mb-6">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const controls = TIME_CONTROLS.filter((tc) => tc.category === cat);

            return (
              <div key={cat} className="rounded-2xl p-3 bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {meta.icon}
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {meta.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {meta.description}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {controls.map((tc) => {
                    const isSelected = activeChoice.id === tc.id;
                    return (
                      <button
                        key={tc.id}
                        type="button"
                        onClick={() => setActiveChoice(tc)}
                        aria-pressed={isSelected}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-500 shadow-nova-sm scale-[1.02]'
                            : 'bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className="text-sm font-mono">{tc.name}</span>
                        <span
                          className={`text-[10px] mt-0.5 ${
                            isSelected ? 'text-brand-100' : 'text-slate-400'
                          }`}
                        >
                          {tc.incrementSeconds > 0
                            ? `+${tc.incrementSeconds}s inc`
                            : 'No inc'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          {onClose && (
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleStartGame}
            className="w-full sm:w-auto px-6 shadow-nova"
          >
            Start Game ({activeChoice.name})
          </Button>
        </div>
      </div>
    </div>
  );
};
