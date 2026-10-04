import React from 'react';
import { Color, PieceSymbol } from '../../../types/chess';

interface PieceSVGProps {
  className?: string;
  size?: number | string;
}

export const WhitePawn: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <path
      d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
      fill="#ffffff"
      stroke="#1e293b"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BlackPawn: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <path
      d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
      fill="#1e293b"
      stroke="#1e293b"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const WhiteKnight: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <g fill="none" fillRule="evenodd" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 14,24 9,19 12,18 16,14 16,8.5 16,6.5 15.5,5 14,3.5 17,2.5 22,2.5 24,6 23.5,7 23.5,8.5 22,10 Z"
        fill="#ffffff"
      />
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 c -1.5,2 -1,5 -1,5 3,1 5,-1 5,-1 0,0 1.5,-1.5 2,-4 0.5,-2.5 2,-4 4,-4 2,0 4,2 4,4 0,3 2,3.5 2,3.5 0,0 2,1 3,-1 0,-3 -1,-4 -2,-6 -1,-2 1,-5 1,-6.5 0,-1.5 -1.5,-2 -2,-2 -0.5,0 -2.5,0.5 -4,2.5 z" fill="#ffffff" />
      <circle cx="9.5" cy="25.5" r="1.5" fill="#1e293b" />
      <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" fill="#1e293b" />
    </g>
  </svg>
);

export const BlackKnight: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <g fill="none" fillRule="evenodd" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 14,24 9,19 12,18 16,14 16,8.5 16,6.5 15.5,5 14,3.5 17,2.5 22,2.5 24,6 23.5,7 23.5,8.5 22,10 Z"
        fill="#1e293b"
      />
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 c -1.5,2 -1,5 -1,5 3,1 5,-1 5,-1 0,0 1.5,-1.5 2,-4 0.5,-2.5 2,-4 4,-4 2,0 4,2 4,4 0,3 2,3.5 2,3.5 0,0 2,1 3,-1 0,-3 -1,-4 -2,-6 -1,-2 1,-5 1,-6.5 0,-1.5 -1.5,-2 -2,-2 -0.5,0 -2.5,0.5 -4,2.5 z" fill="#1e293b" />
      <circle cx="9.5" cy="25.5" r="1.5" fill="#ffffff" />
      <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" fill="#ffffff" />
    </g>
  </svg>
);

export const WhiteBishop: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <g fill="none" fillRule="evenodd" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <g fill="#ffffff" strokeLinecap="butt">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
        <path d="M 12,36 C 12.27,34.01 13.92,33.15 14.5,31 C 15.08,28.85 14.5,23.5 14.5,23.5 C 14.5,23.5 16.5,22.5 17,20.5 C 17.5,18.5 16.5,15.5 17.5,13.5 C 18.5,11.5 21,9 22.5,9 C 24,9 26.5,11.5 27.5,13.5 C 28.5,15.5 27.5,18.5 28,20.5 C 28.5,22.5 30.5,23.5 30.5,23.5 C 30.5,23.5 29.92,28.85 30.5,31 C 31.08,33.15 32.73,34.01 33,36 z" />
        <circle cx="22.5" cy="6.5" r="1.5" />
      </g>
      <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,10 L 22.5,14 M 20,12 L 25,12" />
    </g>
  </svg>
);

export const BlackBishop: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <g fill="none" fillRule="evenodd" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <g fill="#1e293b" strokeLinecap="butt">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
        <path d="M 12,36 C 12.27,34.01 13.92,33.15 14.5,31 C 15.08,28.85 14.5,23.5 14.5,23.5 C 14.5,23.5 16.5,22.5 17,20.5 C 17.5,18.5 16.5,15.5 17.5,13.5 C 18.5,11.5 21,9 22.5,9 C 24,9 26.5,11.5 27.5,13.5 C 28.5,15.5 27.5,18.5 28,20.5 C 28.5,22.5 30.5,23.5 30.5,23.5 C 30.5,23.5 29.92,28.85 30.5,31 C 31.08,33.15 32.73,34.01 33,36 z" />
        <circle cx="22.5" cy="6.5" r="1.5" />
      </g>
      <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,10 L 22.5,14 M 20,12 L 25,12" stroke="#ffffff" />
    </g>
  </svg>
);

export const WhiteRook: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <g fill="none" fillRule="evenodd" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 9,39 L 36,39 L 36,36 L 9,36 z M 12,36 L 12,32 L 33,32 L 33,36 z M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z M 34,14 L 31,17 L 14,17 L 11,14 z M 31,17 L 31,29.5 L 14,29.5 L 14,17 z M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5 z"
        fill="#ffffff"
      />
    </g>
  </svg>
);

export const BlackRook: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <g fill="none" fillRule="evenodd" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 9,39 L 36,39 L 36,36 L 9,36 z M 12,36 L 12,32 L 33,32 L 33,36 z M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z M 34,14 L 31,17 L 14,17 L 11,14 z M 31,17 L 31,29.5 L 14,29.5 L 14,17 z M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5 z"
        fill="#1e293b"
      />
      <path d="M 12,36 L 33,36 M 11,14 L 34,14" stroke="#ffffff" />
    </g>
  </svg>
);

export const WhiteQueen: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <g fill="none" fillRule="evenodd" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.5 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.5 L 14,25 L 6.5,13.5 z"
        fill="#ffffff"
      />
      <path
        d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 11.5,36.5 13,36.5 14,36 C 16,35 18,36 22.5,36 C 27,36 29,35 31,36 C 32,36.5 33.5,36.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z"
        fill="#ffffff"
      />
      <path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5" />
      <circle cx="6" cy="12" r="2" fill="#ffffff" />
      <circle cx="14" cy="9" r="2" fill="#ffffff" />
      <circle cx="22.5" cy="8" r="2" fill="#ffffff" />
      <circle cx="31" cy="9" r="2" fill="#ffffff" />
      <circle cx="39" cy="12" r="2" fill="#ffffff" />
    </g>
  </svg>
);

export const BlackQueen: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <g fill="none" fillRule="evenodd" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.5 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.5 L 14,25 L 6.5,13.5 z"
        fill="#1e293b"
      />
      <path
        d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 11.5,36.5 13,36.5 14,36 C 16,35 18,36 22.5,36 C 27,36 29,35 31,36 C 32,36.5 33.5,36.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z"
        fill="#1e293b"
      />
      <path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5" stroke="#ffffff" />
      <circle cx="6" cy="12" r="2" fill="#1e293b" />
      <circle cx="14" cy="9" r="2" fill="#1e293b" />
      <circle cx="22.5" cy="8" r="2" fill="#1e293b" />
      <circle cx="31" cy="9" r="2" fill="#1e293b" />
      <circle cx="39" cy="12" r="2" fill="#1e293b" />
    </g>
  </svg>
);

export const WhiteKing: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <g fill="none" fillRule="evenodd" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 22.5,11.5 L 22.5,6 M 20,8 L 25,8 M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 20,14.5 C 18.5,17.5 22.5,25 22.5,25"
        strokeLinejoin="miter"
      />
      <path
        d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 11.5,30 11.5,30 L 11.5,37 z"
        fill="#ffffff"
      />
      <path d="M 11.5,30 C 17,27 27,27 32.5,30 M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5 M 11.5,37 C 17,34 27,34 32.5,37" />
    </g>
  </svg>
);

export const BlackKing: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <g fill="none" fillRule="evenodd" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 22.5,11.5 L 22.5,6 M 20,8 L 25,8 M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 20,14.5 C 18.5,17.5 22.5,25 22.5,25"
        stroke="#1e293b"
        strokeLinejoin="miter"
      />
      <path
        d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 11.5,30 11.5,30 L 11.5,37 z"
        fill="#1e293b"
      />
      <path
        d="M 11.5,30 C 17,27 27,27 32.5,30 M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5 M 11.5,37 C 17,34 27,34 32.5,37"
        stroke="#ffffff"
      />
    </g>
  </svg>
);

export function renderPiece(color: Color, type: PieceSymbol, className?: string) {
  if (color === 'w') {
    switch (type) {
      case 'p': return <WhitePawn className={className} />;
      case 'n': return <WhiteKnight className={className} />;
      case 'b': return <WhiteBishop className={className} />;
      case 'r': return <WhiteRook className={className} />;
      case 'q': return <WhiteQueen className={className} />;
      case 'k': return <WhiteKing className={className} />;
    }
  } else {
    switch (type) {
      case 'p': return <BlackPawn className={className} />;
      case 'n': return <BlackKnight className={className} />;
      case 'b': return <BlackBishop className={className} />;
      case 'r': return <BlackRook className={className} />;
      case 'q': return <BlackQueen className={className} />;
      case 'k': return <BlackKing className={className} />;
    }
  }
}

export const renderClassicPiece = renderPiece;
