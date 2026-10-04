import React from 'react';
import { PieceSymbol, Color } from '../../types/chess';
import { renderPiece } from './pieceSets/classicPieces';

interface CapturedPiecesProps {
  color: Color; // Whose captured pieces are being displayed (i.e. opponent pieces captured by this color)
  pieces: PieceSymbol[];
  advantage?: number;
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  color,
  pieces,
  advantage = 0,
}) => {
  if (pieces.length === 0 && advantage <= 0) {
    return <div className="min-h-[24px] flex items-center" />;
  }

  // Group captured pieces by type
  const counts: Record<string, number> = {};
  for (const p of pieces) {
    counts[p] = (counts[p] || 0) + 1;
  }

  const pieceOrder: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];
  // The captured pieces belong to the OPPONENT of `color`
  const opponentColor: Color = color === 'w' ? 'b' : 'w';

  return (
    <div className="flex items-center gap-1.5 flex-wrap min-h-[24px]">
      <div className="flex items-center -space-x-1.5">
        {pieceOrder.map((type) => {
          const count = counts[type] || 0;
          if (count === 0) return null;

          return (
            <div key={type} className="flex items-center">
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 flex items-center justify-center -mr-1.5 drop-shadow-sm"
                  title={`Captured ${opponentColor === 'w' ? 'White' : 'Black'} ${type}`}
                >
                  {renderPiece(opponentColor, type)}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {advantage > 0 && (
        <span className="text-[11px] font-bold font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
          +{advantage}
        </span>
      )}
    </div>
  );
};
