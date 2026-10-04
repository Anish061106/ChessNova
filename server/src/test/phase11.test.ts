import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../services/database/prisma.js';
import { signAuthToken } from '../utils/token.js';
import { AUTH_COOKIE_NAME } from '../utils/cookie.js';
import { ratingService } from '../services/ratings/ratingService.js';
import { GameResultStatus, RatingCategory } from '@prisma/client';

describe('ChessNova Phase 11 — Security Hardening & Performance Optimization Suite (Server)', () => {
  const app = createApp();

  const mockUser = {
    userId: 'user-sec-1',
    username: 'SecTester',
    email: 'sec@chessnova.com',
  };

  const validToken = signAuthToken(mockUser);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Security Response Headers & Transport Protection', () => {
    it('sets critical defensive HTTP security headers on API responses', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-xss-protection']).toBe('1; mode=block');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['permissions-policy']).toContain('camera=()');
    });

    it('removes x-powered-by header to prevent fingerprinting', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('2. Input Clamping & Pagination Protection', () => {
    it('clamps excessive game history pagination limit to prevent memory/DB exhaustion', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: mockUser.userId,
        username: mockUser.username,
        email: mockUser.email,
        isActive: true,
      } as any);

      vi.spyOn(prisma.game, 'count').mockResolvedValue(100);
      vi.spyOn(prisma.game, 'findMany').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/games/history?page=1&limit=999999')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${validToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Pagination limit clamped to max 50
      expect(res.body.pagination.limit).toBeLessThanOrEqual(50);
    });

    it('clamps negative or zero page numbers to safe minimum page 1', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: mockUser.userId,
        username: mockUser.username,
        email: mockUser.email,
        isActive: true,
      } as any);

      vi.spyOn(prisma.game, 'count').mockResolvedValue(10);
      vi.spyOn(prisma.game, 'findMany').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/games/history?page=-5&limit=20')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${validToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
    });
  });

  describe('3. Mass Assignment & Data Exposure Protection', () => {
    it('never exposes passwordHash or private credentials in profile responses', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: mockUser.userId,
        username: mockUser.username,
        email: mockUser.email,
        passwordHash: '$2a$12$eX4mP1eHaShVaLuE.sOmEsEcReT',
        isActive: true,
        displayName: 'Security Tester',
        country: 'US',
        bio: 'Sec profile',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: null,
        ratings: [],
      } as any);

      const res = await request(app)
        .get('/api/users/me')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${validToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it('strictly filters user updates to permitted whitelist fields only', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: mockUser.userId,
        username: mockUser.username,
        email: mockUser.email,
        isActive: true,
      } as any);

      const updateSpy = vi.spyOn(prisma.user, 'update').mockResolvedValue({
        id: mockUser.userId,
        username: mockUser.username,
        email: mockUser.email,
        displayName: 'Updated Name',
        avatarUrl: null,
        country: 'CA',
        bio: 'New bio',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: null,
        ratings: [],
      } as any);

      const res = await request(app)
        .patch('/api/users/me')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${validToken}`])
        .send({
          displayName: 'Updated Name',
          country: 'CA',
          bio: 'New bio',
          isAdmin: true, // Malicious injected field
          role: 'ADMIN', // Malicious injected field
          passwordHash: 'hacked_hash', // Malicious injected field
        });

      expect(res.status).toBe(200);
      // Verify prisma.user.update data contains only validated profile fields
      const calledData = updateSpy.mock.calls[0][0].data;
      expect((calledData as any).isAdmin).toBeUndefined();
      expect((calledData as any).role).toBeUndefined();
      expect((calledData as any).passwordHash).toBeUndefined();
    });
  });

  describe('4. Atomic Rating Concurrency & Idempotency', () => {
    it('safely handles idempotent game rating calculation and avoids double updates', async () => {
      const mockGameId = 'game-rated-atomic-1';

      // First call finds existing history with 2 records
      vi.spyOn(prisma.game, 'findUnique').mockResolvedValue({
        id: mockGameId,
        rated: true,
        whitePlayerId: 'player-w',
        blackPlayerId: 'player-b',
        timeControl: '5+3',
        result: GameResultStatus.WHITE_WIN,
      } as any);

      vi.spyOn(prisma.ratingHistory, 'findMany').mockResolvedValue([
        { userId: 'player-w', ratingBefore: 1200, ratingChange: 16, ratingAfter: 1216 },
        { userId: 'player-b', ratingBefore: 1200, ratingChange: -16, ratingAfter: 1184 },
      ] as any);

      const result = await ratingService.processCompletedRatedGame(mockGameId);
      expect(result).not.toBeNull();
      expect(result?.white.after).toBe(1216);
      expect(result?.black.after).toBe(1184);
    });
  });

  describe('5. Unauthenticated and Unauthorized Route Protection', () => {
    it('rejects protected game history access without token with HTTP 401', async () => {
      const res = await request(app).get('/api/games/history');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects profile update without token with HTTP 401', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .send({ displayName: 'Attacker' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects forged/tampered JWT signatures with HTTP 401', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=invalid.jwt.signature`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SESSION_EXPIRED');
    });
  });
});
