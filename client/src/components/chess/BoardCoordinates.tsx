import React from 'react';
import { BoardOrientation, BoardThemeColors } from '../../types/chess';

interface BoardCoordinatesProps {
  orientation: BoardOrientation;
  theme: BoardThemeColors;
}

export const BoardCoordinates: React.FC<BoardCoordinatesProps> = ({
  orientation,
  theme,
}) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayedFiles = orientation === 'black' ? [...files].reverse() : files;
  const displayedRanks = orientation === 'black' ? [...ranks].reverse() : ranks;

  return (
    <>
      {/* File letters across the bottom row */}
      <div className="absolute bottom-0.5 left-0 right-0 grid grid-cols-8 pointer-events-none select-none z-10 px-0.5">
        {displayedFiles.map((file, idx) => {
          // In standard orientation, idx 0 (a) is dark square, idx 1 (b) is light square, etc.
          // Dark square uses coordinateDark, Light square uses coordinateLight
          const isDarkCell = idx % 2 === 0;
          return (
            <div key={file} className="flex justify-end pr-1">
              <span
                className="text-[10px] sm:text-xs font-bold font-mono leading-none"
                style={{
                  color: isDarkCell ? theme.coordinateDark : theme.coordinateLight,
                }}
              >
                {file}
              </span>
            </div>
          );
        })}
      </div>

      {/* Rank numbers along the left column */}
      <div className="absolute top-0 bottom-0 left-0.5 grid grid-rows-8 pointer-events-none select-none z-10 py-0.5">
        {displayedRanks.map((rank, idx) => {
          const isDarkCell = idx % 2 === 1;
          return (
            <div key={rank} className="flex items-start pt-0.5 pl-0.5">
              <span
                className="text-[10px] sm:text-xs font-bold font-mono leading-none"
                style={{
                  color: isDarkCell ? theme.coordinateDark : theme.coordinateLight,
                }}
              >
                {rank}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
};
