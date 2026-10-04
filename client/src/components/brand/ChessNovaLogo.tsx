import React from 'react';
import { ChessNovaIcon } from './ChessNovaIcon';

interface ChessNovaLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ChessNovaLogo: React.FC<ChessNovaLogoProps> = ({
  className = '',
  showTagline = false,
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <ChessNovaIcon className={iconSizes[size]} />
      <div className="flex flex-col">
        <div className="flex items-center font-extrabold tracking-tight">
          <span className={`text-slate-900 dark:text-white ${textSizes[size]}`}>
            Chess
          </span>
          <span className={`bg-gradient-to-r from-brand-500 via-nova-violet to-nova-cyan bg-clip-text text-transparent ${textSizes[size]}`}>
            Nova
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-500 dark:text-slate-400 -mt-0.5">
            Play. Think. Conquer.
          </span>
        )}
      </div>
    </div>
  );
};
