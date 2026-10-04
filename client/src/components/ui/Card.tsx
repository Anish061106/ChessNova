import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hover = false,
  glow = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        'bg-white dark:bg-dark-card',
        'border-slate-200/80 dark:border-slate-800/80',
        'text-slate-900 dark:text-slate-100',
        hover && 'hover:border-brand-500/50 dark:hover:border-brand-500/40 hover:shadow-lg',
        glow && 'border-brand-500/40 shadow-nova-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
