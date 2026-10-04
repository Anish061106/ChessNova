import React, { useCallback, useRef } from 'react';
import {
  Square,
  Color,
  PieceSymbol,
  BoardOrientation,
  BoardThemeColors,
  LegalDestination,
} from '../../types/chess';
import { ChessSquare } from './ChessSquare';
import { BoardCoordinates } from './BoardCoordinates';
import { useSettingsStore } from '../../store/settingsStore';
import { BOARD_THEMES } from '../../utils/boardThemes';

interface ChessBoardProps {
  orientation: BoardOrientation;
  theme?: BoardThemeColors;
  turn: Color;
  selectedSquare: Square | null;
  legalDestinations: LegalDestination[];
  lastMove: { from: Square; to: Square } | null;
  checkSquare: Square | null;
  getPieceAt: (square: Square) => { type: PieceSymbol; color: Color } | null;
  onSquareClick: (square: Square) => void;
  onMoveAttempt: (from: Square, to: Square) => void;
  showCoordinates?: boolean;
  showLegalMoves?: boolean;
  highlightLastMove?: boolean;
  className?: string;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  orientation,
  theme: themeProp,
  turn,
  selectedSquare,
  legalDestinations,
  lastMove,
  checkSquare,
  getPieceAt,
  onSquareClick,
  onMoveAttempt,
  showCoordinates: showCoordsProp,
  showLegalMoves: showLegalProp,
  highlightLastMove: highlightLastProp,
  className = '',
}) => {
  const draggedSquareRef = useRef<Square | null>(null);

  // Read user preferences from settings store with prop fallbacks
  const settings = useSettingsStore();
  const theme = themeProp || BOARD_THEMES[settings.boardTheme] || BOARD_THEMES.classic;
  const showCoordinates = showCoordsProp !== undefined ? showCoordsProp : settings.showCoordinates;
  const showLegalMoves = showLegalProp !== undefined ? showLegalProp : settings.showLegalMoves;
  const highlightLastMove = highlightLastProp !== undefined ? highlightLastProp : settings.highlightLastMove;

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayedFiles = orientation === 'black' ? [...files].reverse() : files;
  const displayedRanks = orientation === 'black' ? [...ranks].reverse() : ranks;

  // HTML5 Drag and Drop Handlers
  const handleDragStart = useCallback(
    (square: Square, e: React.DragEvent<HTMLDivElement>) => {
      const piece = getPieceAt(square);
      if (!piece || piece.color !== turn) {
        e.preventDefault();
        return;
      }
      draggedSquareRef.current = square;
      e.dataTransfer.setData('text/plain', square);
      e.dataTransfer.effectAllowed = 'move';
      // Automatically select the dragged piece so legal moves are shown
      onSquareClick(square);
    },
    [getPieceAt, turn, onSquareClick]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (targetSquare: Square, e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const fromSquare =
        draggedSquareRef.current || (e.dataTransfer.getData('text/plain') as Square);
      draggedSquareRef.current = null;

      if (fromSquare && fromSquare !== targetSquare) {
        onMoveAttempt(fromSquare, targetSquare);
      }
    },
    [onMoveAttempt]
  );

  // Map of legal destination squares for instant O(1) lookup
  const legalDestMap = React.useMemo(() => {
    if (!showLegalMoves) return new Map<Square, boolean>();
    const map = new Map<Square, boolean>();
    for (const d of legalDestinations) {
      map.set(d.square, d.isCapture);
    }
    return map;
  }, [legalDestinations, showLegalMoves]);

  return (
    <div
      role="grid"
      aria-label="Interactive Chess Board"
      className={`w-full max-w-[min(100vw-2rem,560px)] aspect-square rounded-2xl border-4 border-slate-800/80 shadow-2xl relative select-none overflow-hidden touch-manipulation mx-auto ${className}`}
      style={{ borderColor: theme.darkSquare }}
    >
      <div className="w-full h-full grid grid-cols-8 grid-rows-8 relative">
        {displayedRanks.map((rank) =>
          displayedFiles.map((file) => {
            const square = `${file}${rank}` as Square;
            const fileIdx = file.charCodeAt(0) - 'a'.charCodeAt(0);
            const rankNum = parseInt(rank, 10);
            const isDark = (fileIdx + (8 - rankNum)) % 2 === 1;

            const piece = getPieceAt(square);
            const isSelected = selectedSquare === square;
            const isLastMove = highlightLastMove && (lastMove?.from === square || lastMove?.to === square);
            const isLegalMove = legalDestMap.has(square);
            const isCapture = legalDestMap.get(square) || false;
            const isInCheck = checkSquare === square;
            const isDraggablePiece = Boolean(piece && piece.color === turn);

            return (
              <ChessSquare
                key={square}
                square={square}
                isDark={isDark}
                piece={piece}
                isSelected={isSelected}
                isLastMove={isLastMove}
                isLegalMove={isLegalMove}
                isCapture={isCapture}
                isInCheck={isInCheck}
                isDraggablePiece={isDraggablePiece}
                theme={theme}
                onClick={onSquareClick}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              />
            );
          })
        )}
      </div>

      {/* Board rank and file coordinate labels */}
      {showCoordinates && <BoardCoordinates orientation={orientation} theme={theme} />}
    </div>
  );
};

