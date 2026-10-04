import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, Eye, EyeOff, AlertCircle, Loader2, Check, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error: authError, clearError } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasUsernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      setValidationError('Username must be at least 3 characters long');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setValidationError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setValidationError('Please provide a valid email address');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please verify.');
      return;
    }

    try {
      await register({
        username: cleanUsername,
        email: cleanEmail,
        password,
        confirmPassword,
      });
      navigate('/profile', { replace: true });
    } catch {
      // Error is set in store
    }
  };

  const displayError = validationError || authError;

  return (
    <Card className="p-6 sm:p-8 w-full shadow-2xl">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create an Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Join the ChessNova universe and begin your competitive journey
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
        <div>
          <Input
            id="register-username"
            label="Username"
            placeholder="e.g. TacticianNova"
            leftIcon={<User className="w-4 h-4" />}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (validationError) setValidationError(null);
            }}
            helperText="3–20 characters (letters, numbers, underscore)"
            disabled={isLoading}
            autoComplete="username"
            required
          />

          {username.length > 0 && (
            <div className="mt-1.5 text-xs flex items-center gap-1.5">
              {hasUsernameValid ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Valid username format</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-500 font-medium">3-20 letters, numbers, or _</span>
                </>
              )}
            </div>
          )}
        </div>

        <Input
          id="register-email"
          label="Email address"
          type="email"
          placeholder="e.g. player@chessnova.com"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={isLoading}
          autoComplete="email"
          required
        />

        <div>
          <Input
            id="register-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
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
            autoComplete="new-password"
            required
          />

          {/* Real-time validation cues */}
          {password.length > 0 && (
            <div className="mt-2 text-xs space-y-1 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className={hasMinLength ? 'text-emerald-500 font-medium' : ''}>
                  At least 8 characters
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <Input
            id="register-confirm-password"
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Repeat password"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (validationError) setValidationError(null);
            }}
            disabled={isLoading}
            autoComplete="new-password"
            required
          />

          {confirmPassword.length > 0 && (
            <div className="mt-2 text-xs flex items-center gap-1.5">
              {passwordsMatch ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Passwords match</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-500 font-medium">Passwords do not match</span>
                </>
              )}
            </div>
          )}
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
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Free Account</span>
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Already have a ChessNova account?{' '}
        <NavLink
          to="/login"
          className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
        >
          Sign In
        </NavLink>
      </div>
    </Card>
  );
};
