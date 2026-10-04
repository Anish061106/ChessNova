import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ChessNovaLogo } from '../brand/ChessNovaLogo';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  // Show sleek loading state while checking session on startup
  if (!isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <ChessNovaLogo size="lg" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to /login and preserve destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : null;
};
