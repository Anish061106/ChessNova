import React from 'react';

interface ChessNovaIconProps {
  className?: string;
  size?: number;
}

export const ChessNovaIcon: React.FC<ChessNovaIconProps> = ({ className = 'w-9 h-9', size }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="ChessNova Icon"
    >
      <defs>
        <linearGradient id="cn-icon-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="cn-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <radialGradient id="cn-subtle-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Radiant ambient glow */}
      <circle cx="24" cy="24" r="22" fill="url(#cn-subtle-glow)" />

      {/* Outer modern shield base */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="10"
        className="fill-slate-900/90 stroke-indigo-500/30"
        strokeWidth="1.5"
      />

      {/* Modern Geometric Knight Silhouette */}
      <path
        d="M13 36H35V33.5C35 33.5 33.5 30.5 30.5 29.5C29.8 27.2 30.5 24.2 32.8 22C34.3 20.5 35.8 17.5 34.3 13.8C32.8 10 29 8.5 26 9.2C25.2 9.2 24.5 7.8 22.2 7.8C19.2 7.8 17 9.2 15.5 11.5C14 13.8 14 16.8 15.5 18.2L17.8 19.8C16.2 22 14.8 24.2 14.8 27.2L13 36Z"
        fill="url(#cn-icon-glow)"
      />

      {/* Radiant 4-Point Nova Star */}
      <path
        d="M28 17C28 19.2 29.5 20.8 31.8 20.8C29.5 20.8 28 22.2 28 24.5C28 22.2 26.5 20.8 24.2 20.8C26.5 20.8 28 19.2 28 17Z"
        fill="url(#cn-star-grad)"
      />

      {/* Sleek lower geometric divider */}
      <path
        d="M16 32.5H32"
        stroke="#080c16"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
