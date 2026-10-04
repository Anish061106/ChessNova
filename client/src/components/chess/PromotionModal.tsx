import React from 'react';
import { PieceSymbol, Color } from '../../types/chess';
import { ChessPiece } from './ChessPiece';

interface PromotionModalProps {
  isOpen: boolean;
  color: Color;
  onSelect: (piece: PieceSymbol) => void;
  onCancel: () => void;
}

const PROMOTION_PIECES: { type: PieceSymbol; label: string }[] = [
  { type: 'q', label: 'Queen' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
  { type: 'n', label: 'Knight' },
];

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  color,
  onSelect,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pawn Promotion Dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Promote Pawn
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Choose which piece you want your pawn to become:
        </p>

        <div className="grid grid-cols-4 gap-3">
          {PROMOTION_PIECES.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onSelect(item.type)}
              aria-label={`Promote to ${item.label}`}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 hover:border-brand-500 dark:hover:border-brand-400 hover:scale-105 transition-all group"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <ChessPiece color={color} type={item.type} />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2 group-hover:text-brand-500">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
