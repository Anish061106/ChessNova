import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error: authError, clearError } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Where to redirect after login (e.g. /profile or previous protected route)
  const from = (location.state as any)?.from?.pathname || '/profile';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    const cleanId = identifier.trim();
    if (!cleanId) {
      setValidationError('Please enter your username or email');
      return;
    }

    if (!password) {
      setValidationError('Please enter your password');
      return;
    }

    try {
      await login({ identifier: cleanId, password });
      navigate(from, { replace: true });
    } catch {
      // Error is set in store
    }
  };

  const displayError = validationError || authError;

  return (
    <Card className="p-6 sm:p-8 w-full shadow-2xl">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Enter your credentials to access your ChessNova account
        </p>
      </div>

      {displayError && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2.5 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{displayError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="login-identifier"
          label="Email or Username"
          placeholder="e.g. tactician or grandmaster@chessnova.com"
          leftIcon={<Mail className="w-4 h-4" />}
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={isLoading}
          autoComplete="username"
          required
        />

        <div>
          <div className="flex justify-between items-center mb-1">
            <span />
          </div>
          <Input
            id="login-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationError) setValidationError(null);
            }}
            disabled={isLoading}
            autoComplete="current-password"
            required
          />
        </div>

        <Button
          type="submit"
          size="md"
          className="w-full mt-2 gap-2 shadow-lg shadow-brand-500/25"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Don't have a ChessNova account?{' '}
        <NavLink
          to="/register"
          className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
        >
          Create an account
        </NavLink>
      </div>
    </Card>
  );
};
