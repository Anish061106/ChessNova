import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

describe('ChessNova Phase 5 — Frontend Authentication Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
  });

  describe('Login Page Component', () => {
    it('renders login form elements and logo/title', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Email or Username$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();
      expect(screen.getByText(/Create an account/i)).toBeInTheDocument();
    });

    it('shows validation error if submitted empty', async () => {
      const { container } = render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Please enter your username or email/i)).toBeInTheDocument();
      });
    });

    it('submits valid credentials to authService and authenticates user', async () => {
      const mockUser = {
        id: 'user-frontend-1',
        username: 'chessmaster',
        email: 'master@chessnova.com',
        displayName: 'Chess Master',
        avatarUrl: null,
        country: 'US',
        bio: null,
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(authService, 'login').mockResolvedValue({
        success: true,
        user: mockUser,
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const identifierInput = screen.getByLabelText(/^Email or Username$/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });

      fireEvent.change(identifierInput, { target: { value: 'chessmaster' } });
      fireEvent.change(passwordInput, { target: { value: 'securepass123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().user?.username).toBe('chessmaster');
      });
    });
  });

  describe('Register Page Component', () => {
    it('renders all registration fields and requirements', () => {
      render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      );

      expect(screen.getByText(/Create an Account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Username$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Email address$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Confirm Password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Create Free Account$/i })).toBeInTheDocument();
    });

    it('shows error if passwords do not match', async () => {
      const { container } = render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      );

      const usernameInput = screen.getByLabelText(/^Username$/i);
      const emailInput = screen.getByLabelText(/^Email address$/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/^Confirm Password$/i);
      const form = container.querySelector('form')!;

      fireEvent.change(usernameInput, { target: { value: 'newplayer' } });
      fireEvent.change(emailInput, { target: { value: 'player@chessnova.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'mismatch456' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Passwords do not match/i);
      });
    });
  });

  describe('ProtectedRoute Route Guard', () => {
    it('redirects unauthenticated users to /login', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
      });

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div>Secret Profile Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page Target</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText(/Secret Profile Content/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Login Page Target/i)).toBeInTheDocument();
    });

    it('renders protected content when user is authenticated', () => {
      useAuthStore.setState({
        user: {
          id: 'user-1',
          username: 'authuser',
          email: 'auth@chessnova.com',
          displayName: 'Auth User',
          avatarUrl: null,
          country: null,
          bio: null,
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        isInitialized: true,
      });

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div>Secret Profile Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/Secret Profile Content/i)).toBeInTheDocument();
    });
  });

  describe('Auth Store Actions', () => {
    it('logout resets user and isAuthenticated state', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-1',
          username: 'logoutuser',
          email: 'logout@chessnova.com',
          displayName: null,
          avatarUrl: null,
          country: null,
          bio: null,
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        isInitialized: true,
      });

      vi.spyOn(authService, 'logout').mockResolvedValue({
        success: true,
        message: 'Logged out successfully',
      });

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
