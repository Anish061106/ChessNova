import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  Swords,
  Puzzle,
  GraduationCap,
  Tv,
  Trophy,
  Users,
  History,
  User,
  Settings,
  LogIn,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { ChessNovaLogo } from '../components/brand/ChessNovaLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const desktopMainNavItems: NavItem[] = [
  { name: 'Play', path: '/play', icon: Swords },
  { name: 'Puzzles', path: '/puzzles', icon: Puzzle },
  { name: 'Learn', path: '/learn', icon: GraduationCap },
  { name: 'Watch', path: '/watch', icon: Tv },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'Friends', path: '/friends', icon: Users },
  { name: 'Games', path: '/games', icon: History },
];

const mobileBottomNavItems: NavItem[] = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Play', path: '/play', icon: Swords },
  { name: 'Games', path: '/games', icon: History },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'Profile', path: '/profile', icon: User },
];

const secondaryNavItems: NavItem[] = [
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderNavLink = (item: NavItem, isMobile = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    if (isMobile) {
      return (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            'flex flex-col items-center justify-center py-2 px-1 text-[11px] font-medium transition-colors flex-1 touch-manipulation',
            isActive
              ? 'text-brand-500 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'text-brand-500 scale-105 transition-transform')} />
          <span className="truncate max-w-[58px] text-[10px] sm:text-[11px]">{item.name}</span>
        </NavLink>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={cn(
          'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
          isActive
            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-semibold shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
        )}
      >
        <Icon
          className={cn(
            'w-5 h-5 transition-colors',
            isActive
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
          )}
        />
        <span>{item.name}</span>
        {isActive && (
          <span className="absolute left-0 w-1 h-5 bg-brand-500 rounded-r-full" />
        )}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-dark-card/90 backdrop-blur-md p-4 justify-between z-30">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <NavLink to="/" className="px-2 py-1.5 focus:outline-none rounded-lg">
            <ChessNovaLogo size="md" showTagline />
          </NavLink>

          {/* Primary Nav Items */}
          <nav className="flex flex-col gap-1" aria-label="Main Navigation">
            {desktopMainNavItems.map((item) => renderNavLink(item))}
          </nav>

          <hr className="border-slate-200 dark:border-slate-800 my-1" />

          {/* Secondary Nav Items */}
          <nav className="flex flex-col gap-1" aria-label="Account Navigation">
            {secondaryNavItems.map((item) => renderNavLink(item))}
          </nav>
        </div>

        {/* Footer info & Controls */}
        <div className="flex flex-col gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Theme
            </span>
            <ThemeToggle />
          </div>

          {/* Auth Button or User Profile Badge */}
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <NavLink to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 group">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-brand-500/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    @{user.username}
                  </p>
                </div>
              </NavLink>
              <button
                type="button"
                onClick={() => logout()}
                className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Join</span>
            </NavLink>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <NavLink to="/" className="flex items-center">
          <ChessNovaLogo size="sm" />
        </NavLink>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Full Navigation Drawer / Modal */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-white dark:bg-dark-card rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <ChessNovaLogo size="sm" showTagline />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Destinations Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { name: 'Play Online / Local', path: '/play', icon: Swords },
                { name: 'Game History', path: '/games', icon: History },
                { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
                { name: 'Puzzles', path: '/puzzles', icon: Puzzle },
                { name: 'Learn & Openings', path: '/learn', icon: GraduationCap },
                { name: 'Watch Games', path: '/watch', icon: Tv },
                { name: 'Friends & Chat', path: '/friends', icon: Users },
                { name: 'Settings & Theme', path: '/settings', icon: Settings },
              ].map(({ name, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold transition-all',
                    location.pathname === path
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}
                >
                  <Icon className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="truncate">{name}</span>
                </NavLink>
              ))}
            </div>

            {/* Account info or Sign In */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              {isAuthenticated && user ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                  <NavLink
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-brand-500/40"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <NavLink
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </NavLink>
                  <NavLink
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20"
                  >
                    <span>Join Free</span>
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area with Safe-Area insets */}
      <main className="flex-1 min-w-0 flex flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-dark-card/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-1 py-1.5 pb-[calc(0.35rem+env(safe-area-inset-bottom))] shadow-lg"
      >
        {mobileBottomNavItems.map((item) => renderNavLink(item, true))}
      </nav>
    </div>
  );
};

