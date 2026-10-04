import React from 'react';
import { Color, PieceSymbol } from '../../types/chess';
import { renderPiece as renderClassicPiece } from './pieceSets/classicPieces';
import { renderModernPiece } from './pieceSets/modernPieces';
import { useSettingsStore } from '../../store/settingsStore';

interface ChessPieceProps {
  color: Color;
  type: PieceSymbol;
  square?: string;
  pieceSet?: 'classic' | 'modern';
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
}

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

const ChessPieceBase: React.FC<ChessPieceProps> = ({
  color,
  type,
  square,
  pieceSet,
  isDraggable = false,
  onDragStart,
  className = 'w-full h-full',
}) => {
  const storePieceSet = useSettingsStore((state) => state.pieceSet);
  const activeSet = pieceSet || storePieceSet || 'classic';

  const colorName = color === 'w' ? 'White' : 'Black';
  const pieceName = PIECE_NAMES[type] || 'piece';
  const ariaLabel = square
    ? `${colorName} ${pieceName} on ${square}`
    : `${colorName} ${pieceName}`;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      draggable={isDraggable}
      onDragStart={onDragStart}
      className={`relative flex items-center justify-center select-none w-full h-full transition-transform duration-100 ${
        isDraggable ? 'cursor-grab active:cursor-grabbing hover:scale-105' : ''
      } ${className}`}
    >
      <div className="w-[85%] h-[85%] flex items-center justify-center drop-shadow-md pointer-events-none">
        {activeSet === 'modern'
          ? renderModernPiece(color, type)
          : renderClassicPiece(color, type)}
      </div>
    </div>
  );
};

export const ChessPiece = React.memo(ChessPieceBase);

