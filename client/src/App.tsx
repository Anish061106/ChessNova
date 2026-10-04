import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { Home } from './pages/Home';
import { Play } from './pages/Play';
import { OnlineGame } from './pages/OnlineGame';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { NotFound } from './pages/NotFound';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useInvitationStore } from './store/invitationStore';
import { IncomingInvitationNotification } from './components/multiplayer/IncomingInvitationNotification';
import { Loader2 } from 'lucide-react';

// Lazy-loaded routes for code-splitting and rapid initial load performance
const Puzzles = lazy(() => import('./pages/Puzzles').then((m) => ({ default: m.Puzzles })));
const Learn = lazy(() => import('./pages/Learn').then((m) => ({ default: m.Learn })));
const Watch = lazy(() => import('./pages/Watch').then((m) => ({ default: m.Watch })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then((m) => ({ default: m.Leaderboard })));
const Friends = lazy(() => import('./pages/Friends').then((m) => ({ default: m.Friends })));
const Games = lazy(() => import('./pages/Games').then((m) => ({ default: m.Games })));
const GameDetail = lazy(() => import('./pages/GameDetail').then((m) => ({ default: m.GameDetail })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading ChessNova view...</span>
  </div>
);

export const App: React.FC = () => {
  const initTheme = useThemeStore((state) => state.initTheme);
  const initSettings = useSettingsStore((state) => state.initSettings);
  const { initAuth, isAuthenticated } = useAuthStore();
  const initInvitationListeners = useInvitationStore((state) => state.initInvitationListeners);

  useEffect(() => {
    initTheme();
    initSettings();
    initAuth();
  }, [initTheme, initSettings, initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      initInvitationListeners();
    }
  }, [isAuthenticated, initInvitationListeners]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <IncomingInvitationNotification />
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Main Application Layout */}
              <Route path="/" element={<MainLayout />}>
                {/* Public Pages */}
                <Route index element={<Home />} />
                <Route path="play" element={<Play />} />
                <Route path="puzzles" element={<Puzzles />} />
                <Route path="learn" element={<Learn />} />
                <Route path="watch" element={<Watch />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="settings" element={<Settings />} />

                {/* Protected Online Matchmaking & Game Room */}
                <Route
                  path="online/:gameId"
                  element={
                    <ProtectedRoute>
                      <OnlineGame />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Account Pages */}
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="friends"
                  element={
                    <ProtectedRoute>
                      <Friends />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="games"
                  element={
                    <ProtectedRoute>
                      <Games />
                    </ProtectedRoute>
                  }
                />
                <Route path="games/:gameId" element={<GameDetail />} />

                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Auth Layout for Login / Register */}
              <Route element={<AuthLayout />}>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
};

