import React from 'react';
import { Color, PieceSymbol } from '../../../types/chess';

interface PieceSVGProps {
  className?: string;
}

export const ModernWhitePawn: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <circle cx="22.5" cy="12" r="5.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
    <path
      d="M17 19.5 C17 19.5, 14 30, 13 36 L32 36 C31 30, 28 19.5, 28 19.5 Z"
      fill="#f8fafc"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const ModernBlackPawn: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <circle cx="22.5" cy="12" r="5.5" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
    <path
      d="M17 19.5 C17 19.5, 14 30, 13 36 L32 36 C31 30, 28 19.5, 28 19.5 Z"
      fill="#1e293b"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const ModernWhiteKnight: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <path
      d="M14 36 L31 36 C30 26 28 20 30 14 C30 8 23 6 18 10 C14 13 12 18 12 21 C15 21 17 18 17 18 C14 24 10 27 10 30 C10 33 14 36 14 36 Z"
      fill="#f8fafc"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="13" r="1.5" fill="#0f172a" />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const ModernBlackKnight: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <path
      d="M14 36 L31 36 C30 26 28 20 30 14 C30 8 23 6 18 10 C14 13 12 18 12 21 C15 21 17 18 17 18 C14 24 10 27 10 30 C10 33 14 36 14 36 Z"
      fill="#1e293b"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="13" r="1.5" fill="#f8fafc" />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const ModernWhiteBishop: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <circle cx="22.5" cy="8" r="2.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
    <path
      d="M22.5 11 C17 11 14 16 14 22 C14 28 17 32 17 36 L28 36 C28 32 31 28 31 22 C31 16 28 11 22.5 11 Z"
      fill="#f8fafc"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M22.5 17 L22.5 25 M19 20 L26 20" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const ModernBlackBishop: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <circle cx="22.5" cy="8" r="2.5" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
    <path
      d="M22.5 11 C17 11 14 16 14 22 C14 28 17 32 17 36 L28 36 C28 32 31 28 31 22 C31 16 28 11 22.5 11 Z"
      fill="#1e293b"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M22.5 17 L22.5 25 M19 20 L26 20" stroke="#f8fafc" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const ModernWhiteRook: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <path
      d="M13 13 L13 18 L16 18 L16 14 L20 14 L20 18 L25 18 L25 14 L29 14 L29 18 L32 18 L32 13 Z"
      fill="#f8fafc"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M15 18 L16 36 L29 36 L30 18 Z"
      fill="#f8fafc"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const ModernBlackRook: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <path
      d="M13 13 L13 18 L16 18 L16 14 L20 14 L20 18 L25 18 L25 14 L29 14 L29 18 L32 18 L32 13 Z"
      fill="#1e293b"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M15 18 L16 36 L29 36 L30 18 Z"
      fill="#1e293b"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const ModernWhiteQueen: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <circle cx="12" cy="11" r="2" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
    <circle cx="22.5" cy="9" r="2.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
    <circle cx="33" cy="11" r="2" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
    <path
      d="M12 14 L15 36 L30 36 L33 14 L26 24 L22.5 13 L19 24 Z"
      fill="#f8fafc"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const ModernBlackQueen: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    <circle cx="12" cy="11" r="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
    <circle cx="22.5" cy="9" r="2.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
    <circle cx="33" cy="11" r="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
    <path
      d="M12 14 L15 36 L30 36 L33 14 L26 24 L22.5 13 L19 24 Z"
      fill="#1e293b"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const ModernWhiteKing: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    {/* Crown Cross */}
    <path d="M22.5 6 L22.5 12 M19.5 9 L25.5 9" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M14 15 C14 15 16 28 17 36 L28 36 C29 28 31 15 31 15 L26 20 L22.5 13 L19 20 Z"
      fill="#f8fafc"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const ModernBlackKing: React.FC<PieceSVGProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 45 45" className={className}>
    {/* Crown Cross */}
    <path d="M22.5 6 L22.5 12 M19.5 9 L25.5 9" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M14 15 C14 15 16 28 17 36 L28 36 C29 28 31 15 31 15 L26 20 L22.5 13 L19 20 Z"
      fill="#1e293b"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="11" y="36" width="23" height="4" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

export const renderModernPiece = (color: Color, type: PieceSymbol) => {
  if (color === 'w') {
    switch (type) {
      case 'p': return <ModernWhitePawn />;
      case 'n': return <ModernWhiteKnight />;
      case 'b': return <ModernWhiteBishop />;
      case 'r': return <ModernWhiteRook />;
      case 'q': return <ModernWhiteQueen />;
      case 'k': return <ModernWhiteKing />;
    }
  } else {
    switch (type) {
      case 'p': return <ModernBlackPawn />;
      case 'n': return <ModernBlackKnight />;
      case 'b': return <ModernBlackBishop />;
      case 'r': return <ModernBlackRook />;
      case 'q': return <ModernBlackQueen />;
      case 'k': return <ModernBlackKing />;
    }
  }
  return null;
};
