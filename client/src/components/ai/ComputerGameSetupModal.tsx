import React, { useState } from 'react';
import { Bot, Play } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AIDifficulty, AIPlayerColorChoice } from '../../types/ai';
import { AI_DIFFICULTIES } from '../../services/ai/aiConfig';
import { TimeControl, TIME_CONTROLS } from '../../types/chess';

interface ComputerGameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (difficulty: AIDifficulty, color: AIPlayerColorChoice, timeControl: TimeControl) => void;
  initialDifficulty?: AIDifficulty;
  initialColor?: AIPlayerColorChoice;
  initialTimeControl?: TimeControl;
}

export const ComputerGameSetupModal: React.FC<ComputerGameSetupModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  initialDifficulty = 'medium',
  initialColor = 'white',
  initialTimeControl = TIME_CONTROLS[4], // 5+3 Blitz
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>(initialDifficulty);
  const [selectedColor, setSelectedColor] = useState<AIPlayerColorChoice>(initialColor);
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(initialTimeControl);

  const handleStart = () => {
    onStartGame(selectedDifficulty, selectedColor, selectedTimeControl);
    onClose();
  };

  const difficultyList: AIDifficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Play vs Stockfish AI"
    >
      <div className="space-y-6">
        {/* Header Intro */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
          <Bot className="w-6 h-6 text-brand-500 shrink-0" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-slate-900 dark:text-white">AI Engine Match</span>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Test your skills against Stockfish AI. Computer games do not affect your competitive multiplayer rating.
            </p>
          </div>
        </div>

        {/* 1. Difficulty Selection */}
        <div className="space-y-2.5">
          <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Select AI Level</span>
            <span className="text-xs font-semibold text-brand-500">
              ~{AI_DIFFICULTIES[selectedDifficulty].estimatedElo} Elo Rating
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {difficultyList.map((diffKey) => {
              const item = AI_DIFFICULTIES[diffKey];
              const isSelected = selectedDifficulty === diffKey;
              return (
                <button
                  key={diffKey}
                  type="button"
                  onClick={() => setSelectedDifficulty(diffKey)}
                  className={`p-3 rounded-xl border text-left transition-all flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 ${
                    isSelected
                      ? 'bg-brand-500/10 border-brand-500 ring-2 ring-brand-500/30'
                      : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.avatarIcon}</span>
                    <div className="sm:hidden font-semibold text-xs text-slate-900 dark:text-white">
                      {item.name.split(' ')[0]}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="hidden sm:block font-bold text-xs text-slate-900 dark:text-white">
                      {item.name.split(' ')[0]}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      ~{item.estimatedElo}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            {AI_DIFFICULTIES[selectedDifficulty].tagline}
          </p>
        </div>

        {/* 2. Color Selection */}
        <div className="space-y-2.5">
          <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Play As
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'white', label: 'White', icon: '♔', desc: 'You move first' },
              { id: 'random', label: 'Random', icon: '☯', desc: 'Random color' },
              { id: 'black', label: 'Black', icon: '♚', desc: 'Computer moves first' },
            ].map((c) => {
              const isSelected = selectedColor === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id as AIPlayerColorChoice)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                      : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-0.5">{c.icon}</div>
                  <div className="font-bold text-xs">{c.label}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {c.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Time Control */}
        <div className="space-y-2.5">
          <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Time Control
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {TIME_CONTROLS.map((tc) => {
              const isSelected = selectedTimeControl.id === tc.id;
              return (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => setSelectedTimeControl(tc)}
                  className={`py-2 px-1 rounded-lg border text-center font-mono text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                      : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {tc.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleStart} className="gap-2">
            <Play className="w-4 h-4 fill-current" />
            <span>Start Game</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
