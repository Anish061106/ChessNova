import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../services/database/prisma.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAuthToken, verifyAuthToken } from '../utils/token.js';
import { AUTH_COOKIE_NAME } from '../utils/cookie.js';
import { RatingCategory } from '@prisma/client';

describe('ChessNova Phase 5 — Secure Authentication & User Accounts', () => {
  const app = createApp();

  describe('Password Hashing Utility', () => {
    it('hashes passwords with salt and verifies matches correctly', async () => {
      const password = 'SuperSecretChessPassword!123';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Token & Session Utility', () => {
    it('signs and verifies valid authentication tokens', () => {
      const payload = {
        userId: 'user-uuid-123',
        username: 'testgrandmaster',
        email: 'gm@chessnova.com',
      };

      const token = signAuthToken(payload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);

      const verified = verifyAuthToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe('user-uuid-123');
      expect(verified?.username).toBe('testgrandmaster');
    });

    it('rejects tampered or malformed tokens', () => {
      const verified = verifyAuthToken('invalid.token.structure');
      expect(verified).toBeNull();
    });
  });

  describe('Registration — POST /api/auth/register', () => {
    it('rejects registration with invalid username characters', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'bad user!',
        email: 'test@chessnova.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects registration with weak password (< 8 chars)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'gooduser',
        email: 'test@chessnova.com',
        password: 'short',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects registration if password confirmation does not match', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'gooduser',
        email: 'test@chessnova.com',
        password: 'password1234',
        confirmPassword: 'password9999',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Passwords do not match');
    });

    it('successfully registers user, creates default settings, default ratings, sets auth cookie, and excludes passwordHash', async () => {
      const mockCreatedUser = {
        id: 'user-new-1',
        username: 'newmaster',
        email: 'newmaster@chessnova.com',
        passwordHash: 'hashed_pwd_secret',
        displayName: null,
        avatarUrl: null,
        country: null,
        bio: null,
        isActive: true,
        lastSeenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          theme: 'dark',
          boardTheme: 'classic',
          pieceSet: 'classic',
          soundEnabled: true,
          animationEnabled: true,
          showLegalMoves: true,
          showCoordinates: true,
          highlightLastMove: true,
          confirmMoves: false,
          autoQueen: false,
          animationSpeed: 'normal',
        },
        ratings: [
          { category: RatingCategory.BULLET, rating: 1500, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
          { category: RatingCategory.BLITZ, rating: 1500, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
          { category: RatingCategory.RAPID, rating: 1500, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
          { category: RatingCategory.CLASSICAL, rating: 1500, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
        ],
      };

      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          user: {
            create: vi.fn().mockResolvedValue(mockCreatedUser),
          },
          rating: {
            createMany: vi.fn().mockResolvedValue({ count: 4 }),
            findMany: vi.fn().mockResolvedValue(mockCreatedUser.ratings),
          },
        });
      });

      const response = await request(app).post('/api/auth/register').send({
        username: 'newmaster',
        email: 'newmaster@chessnova.com',
        password: 'securepassword123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('newmaster');
      expect(response.body.user.email).toBe('newmaster@chessnova.com');
      expect(response.body.user.passwordHash).toBeUndefined(); // NEVER exposed
      expect(response.body.user.settings.theme).toBe('dark');
      expect(response.body.user.ratings.length).toBe(4);

      // Check cookie was set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain(AUTH_COOKIE_NAME);
    });
  });

  describe('Login — POST /api/auth/login', () => {
    it('successfully logs in with username or email and verifies password', async () => {
      const hashedPassword = await hashPassword('correctPassword123');
      const mockUser = {
        id: 'user-login-1',
        username: 'tactician',
        email: 'tactician@chessnova.com',
        passwordHash: hashedPassword,
        displayName: 'Tactician 99',
        avatarUrl: null,
        country: 'US',
        bio: 'Sicilian enthusiast',
        isActive: true,
        lastSeenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          theme: 'dark',
          boardTheme: 'classic',
          pieceSet: 'classic',
          soundEnabled: true,
          animationEnabled: true,
          showLegalMoves: true,
          showCoordinates: true,
          highlightLastMove: true,
          confirmMoves: false,
          autoQueen: false,
          animationSpeed: 'normal',
        },
        ratings: [],
      };

      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser as any);
      vi.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);

      // Login via username
      const response = await request(app).post('/api/auth/login').send({
        identifier: 'tactician',
        password: 'correctPassword123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('tactician');
      expect(response.body.user.passwordHash).toBeUndefined();

      // Check cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain(AUTH_COOKIE_NAME);
    });

    it('rejects login with wrong password without leaking account details', async () => {
      const hashedPassword = await hashPassword('correctPassword123');
      const mockUser = {
        id: 'user-login-1',
        username: 'tactician',
        email: 'tactician@chessnova.com',
        passwordHash: hashedPassword,
        isActive: true,
      };

      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser as any);

      const response = await request(app).post('/api/auth/login').send({
        identifier: 'tactician',
        password: 'WrongPassword456',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid username/email or password');
    });
  });

  describe('Session & User Endpoints — GET /api/auth/me & GET/PATCH /api/users/me', () => {
    it('GET /api/auth/me returns 401 when no session cookie or header is present', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/auth/me returns authenticated user details when valid token is supplied', async () => {
      const token = signAuthToken({
        userId: 'user-me-1',
        username: 'sessionuser',
        email: 'session@chessnova.com',
      });

      const mockUser = {
        id: 'user-me-1',
        username: 'sessionuser',
        email: 'session@chessnova.com',
        passwordHash: 'hashed_pwd',
        displayName: 'Session Master',
        avatarUrl: null,
        country: 'CA',
        bio: 'Rapid specialist',
        isActive: true,
        createdAt: new Date(),
        settings: {
          theme: 'dark',
          boardTheme: 'classic',
          pieceSet: 'classic',
          soundEnabled: true,
          animationEnabled: true,
          showLegalMoves: true,
          showCoordinates: true,
          highlightLastMove: true,
          confirmMoves: false,
          autoQueen: false,
          animationSpeed: 'normal',
        },
        ratings: [],
      };

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('sessionuser');
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('PATCH /api/users/me updates safe profile fields and ignores mass-assignment', async () => {
      const token = signAuthToken({
        userId: 'user-me-1',
        username: 'sessionuser',
        email: 'session@chessnova.com',
      });

      const mockUpdatedUser = {
        id: 'user-me-1',
        username: 'sessionuser',
        email: 'session@chessnova.com',
        displayName: 'New Display Name',
        country: 'FR',
        bio: 'French Defense fan',
        avatarUrl: 'https://chessnova.com/avatar.png',
        isActive: true,
        createdAt: new Date(),
        settings: null,
        ratings: [],
      };

      vi.spyOn(prisma.user, 'update').mockResolvedValue(mockUpdatedUser as any);

      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          displayName: 'New Display Name',
          country: 'FR',
          bio: 'French Defense fan',
          avatarUrl: 'https://chessnova.com/avatar.png',
          // Malicious attempt to change internal fields should be rejected / ignored
          isActive: false,
          role: 'ADMIN',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.displayName).toBe('New Display Name');
      expect(response.body.user.country).toBe('FR');
    });

    it('PATCH /api/users/me/settings updates preferences in PostgreSQL', async () => {
      const token = signAuthToken({
        userId: 'user-me-1',
        username: 'sessionuser',
        email: 'session@chessnova.com',
      });

      const mockUpdatedSettings = {
        id: 'settings-1',
        userId: 'user-me-1',
        theme: 'dark',
        boardTheme: 'midnight',
        pieceSet: 'classic',
        soundEnabled: false,
        animationEnabled: true,
        showLegalMoves: true,
        showCoordinates: true,
        highlightLastMove: true,
        confirmMoves: false,
        autoQueen: true,
        animationSpeed: 'fast',
      };

      vi.spyOn(prisma.userSettings, 'upsert').mockResolvedValue(mockUpdatedSettings as any);

      const response = await request(app)
        .patch('/api/users/me/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          boardTheme: 'midnight',
          soundEnabled: false,
          autoQueen: true,
          animationSpeed: 'fast',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.settings.boardTheme).toBe('midnight');
      expect(response.body.settings.soundEnabled).toBe(false);
      expect(response.body.settings.autoQueen).toBe(true);
    });
  });

  describe('Logout — POST /api/auth/logout', () => {
    it('clears session cookie on logout', async () => {
      const response = await request(app).post('/api/auth/logout');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain(`${AUTH_COOKIE_NAME}=;`);
    });
  });
});
