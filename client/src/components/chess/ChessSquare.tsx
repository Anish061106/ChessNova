import React from 'react';
import { Square, Color, PieceSymbol, BoardThemeColors } from '../../types/chess';
import { ChessPiece } from './ChessPiece';

interface ChessSquareProps {
  square: Square;
  isDark: boolean;
  piece?: { type: PieceSymbol; color: Color } | null;
  isSelected: boolean;
  isLastMove: boolean;
  isLegalMove: boolean;
  isCapture: boolean;
  isInCheck: boolean;
  isDraggablePiece: boolean;
  theme: BoardThemeColors;
  onClick: (square: Square) => void;
  onDragStart: (square: Square, e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (square: Square, e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

const ChessSquareBase: React.FC<ChessSquareProps> = ({
  square,
  isDark,
  piece,
  isSelected,
  isLastMove,
  isLegalMove,
  isCapture,
  isInCheck,
  isDraggablePiece,
  theme,
  onClick,
  onDragStart,
  onDrop,
  onDragOver,
}) => {
  const baseBg = isDark ? theme.darkSquare : theme.lightSquare;

  return (
    <div
      role="gridcell"
      data-square={square}
      aria-label={`Square ${square}${piece ? `, occupied by ${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}` : ', empty'}`}
      onClick={() => onClick(square)}
      onDrop={(e) => onDrop(square, e)}
      onDragOver={onDragOver}
      style={{ backgroundColor: baseBg }}
      className="relative flex items-center justify-center aspect-square select-none cursor-pointer transition-colors duration-150 overflow-hidden"
    >
      {/* Last move highlight */}
      {isLastMove && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-200"
          style={{ backgroundColor: theme.lastMoveSquare }}
        />
      )}

      {/* Selected square highlight */}
      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none ring-2 ring-inset ring-amber-400/80"
          style={{ backgroundColor: theme.selectedSquare }}
        />
      )}

      {/* King in check warning highlight */}
      {isInCheck && (
        <div
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{ background: theme.checkSquare }}
        />
      )}

      {/* Legal Move Destination Indicator (Non-Capture) */}
      {isLegalMove && !isCapture && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className="w-[28%] h-[28%] rounded-full shadow-sm"
            style={{ backgroundColor: theme.legalMoveDot }}
          />
        </div>
      )}

      {/* Legal Move Capture Indicator */}
      {isLegalMove && isCapture && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-1">
          <div
            className="w-full h-full rounded-full border-4 shadow-sm"
            style={{ borderColor: theme.legalCaptureRing }}
          />
        </div>
      )}

      {/* Piece Rendering */}
      {piece && (
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <ChessPiece
            color={piece.color}
            type={piece.type}
            square={square}
            isDraggable={isDraggablePiece}
            onDragStart={(e) => onDragStart(square, e)}
          />
        </div>
      )}
    </div>
  );
};

export const ChessSquare = React.memo(ChessSquareBase);

