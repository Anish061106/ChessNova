import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ChessNovaLogo } from '../components/brand/ChessNovaLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { ArrowLeft } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text p-4 sm:p-6 transition-colors">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to ChessNova</span>
        </NavLink>
        <ThemeToggle compact />
      </div>

      {/* Main Form Center */}
      <div className="flex flex-col items-center justify-center my-8">
        <NavLink to="/" className="mb-8 hover:opacity-90 transition-opacity">
          <ChessNovaLogo size="lg" showTagline />
        </NavLink>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-500 py-4">
        &copy; {new Date().getFullYear()} ChessNova. All rights reserved.
      </div>
    </div>
  );
};
