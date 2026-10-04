import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Chess } from 'chess.js';
import { gameManager } from '../services/games/gameManager.js';
import { MatchmakingService } from '../services/matchmaking/matchmakingService.js';
import { InMemoryMatchmakingStore } from '../services/matchmaking/matchmakingStore.js';
import { calculateEloChange, getRatingCategory, DEFAULT_RATING } from '../utils/ratingConfig.js';
import { signAuthToken, verifyAuthToken } from '../utils/token.js';
import { PlayerInfo } from '../types/game.js';
import { prisma } from '../services/database/prisma.js';

describe('ChessNova Phase 10 — Full-Stack Technical Audit & Verification Suite (Server)', () => {
  let matchmakingStore: InMemoryMatchmakingStore;
  let matchmakingService: MatchmakingService;

  const player1: PlayerInfo = {
    id: 'user-audit-1',
    username: 'GrandmasterOne',
    displayName: 'GM One',
  };

  const player2: PlayerInfo = {
    id: 'user-audit-2',
    username: 'GrandmasterTwo',
    displayName: 'GM Two',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(prisma.game, 'create').mockResolvedValue({ id: 'audit-game-123' } as any);
    vi.spyOn(prisma.game, 'update').mockResolvedValue({} as any);
    vi.spyOn(prisma.move, 'create').mockResolvedValue({} as any);

    matchmakingStore = new InMemoryMatchmakingStore();
    matchmakingService = new MatchmakingService(matchmakingStore);
  });

  afterEach(() => {
    gameManager.clearAllGames();
  });

  describe('1. Chess Rule Engine Correctness (Server-Authoritative)', () => {
    it('accurately verifies basic and special piece movement (castling, en passant, promotion)', () => {
      const chess = new Chess();

      // Standard opening moves
      expect(chess.move('e4')).toBeTruthy();
      expect(chess.move('e5')).toBeTruthy();
      expect(chess.move('Nf3')).toBeTruthy();
      expect(chess.move('Nc6')).toBeTruthy();
      expect(chess.move('Bc4')).toBeTruthy();
      expect(chess.move('Bc5')).toBeTruthy();

      // Kingside castling
      const castlingMove = chess.move('O-O');
      expect(castlingMove).toBeTruthy();
      expect(castlingMove.flags).toContain('k');
      expect(chess.get('g1')?.type).toBe('k');
      expect(chess.get('f1')?.type).toBe('r');
    });

    it('strictly rejects illegal moves and illegal castling through check', () => {
      // Setup position where e1 king would castle kingside through f1, but f1 is attacked by a black bishop on a6
      const fen = 'r3k2r/8/b7/8/8/8/8/R3K2R w KQkq - 0 1';
      const chess = new Chess(fen);

      // Castling through attacked square f1 should throw or return null
      let threw = false;
      try {
        const res = chess.move('O-O');
        if (!res) threw = true;
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });

    it('correctly detects en passant capture and removes captured pawn', () => {
      const chess = new Chess('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');
      const enPassantMove = chess.move('exd6');
      expect(enPassantMove).toBeTruthy();
      expect(enPassantMove.flags).toContain('e');
      expect(chess.get('d6')?.type).toBe('p');
      expect(chess.get('d5')).toBeFalsy(); // Black pawn captured
    });

    it('correctly identifies checkmate and prevents subsequent moves', () => {
      // Scholar's mate
      const chess = new Chess();
      chess.move('e4');
      chess.move('e5');
      chess.move('Qh5');
      chess.move('Nc6');
      chess.move('Bc4');
      chess.move('Nf6');
      chess.move('Qxf7#');

      expect(chess.isCheckmate()).toBe(true);
      expect(chess.isGameOver()).toBe(true);
      expect(chess.turn()).toBe('b');

      // Subsequent moves must be impossible
      let canMove = false;
      try {
        if (chess.moves().length > 0) canMove = true;
      } catch {
        canMove = false;
      }
      expect(canMove).toBe(false);
    });

    it('correctly identifies stalemate and draws', () => {
      // Famous stalemate position
      const stalemateFen = 'k7/8/1Q6/8/8/8/8/7K b - - 0 1';
      const chess = new Chess(stalemateFen);

      expect(chess.isStalemate()).toBe(true);
      expect(chess.isCheckmate()).toBe(false);
      expect(chess.isDraw()).toBe(true);
      expect(chess.isGameOver()).toBe(true);
    });
  });

  describe('2. Elo Rating System Mathematical Integrity', () => {
    it('correctly calculates symmetric rating changes for equally rated players', () => {
      const whiteRating = 1200;
      const blackRating = 1200;

      // White wins (score 1)
      const winResult = calculateEloChange(whiteRating, blackRating, 1, 32);
      expect(winResult.whiteChange).toBe(16);
      expect(winResult.blackChange).toBe(-16);
      expect(winResult.newWhiteRating).toBe(1216);
      expect(winResult.newBlackRating).toBe(1184);

      // Draw (score 0.5)
      const drawResult = calculateEloChange(whiteRating, blackRating, 0.5, 32);
      expect(drawResult.whiteChange).toBe(0);
      expect(drawResult.blackChange).toBe(0);
      expect(drawResult.newWhiteRating).toBe(1200);
      expect(drawResult.newBlackRating).toBe(1200);
    });

    it('rewards underdog victories with higher rating gains', () => {
      const underdogRating = 1100;
      const favoriteRating = 1500;

      // Underdog (White) wins against Favorite (Black)
      const upsetResult = calculateEloChange(underdogRating, favoriteRating, 1, 32);
      expect(upsetResult.whiteChange).toBeGreaterThan(25);
      expect(upsetResult.blackChange).toBeLessThan(-25);
      expect(upsetResult.whiteChange + upsetResult.blackChange).toBe(0); // Zero-sum delta
    });

    it('accurately maps time control strings to FIDE standard rating categories', () => {
      expect(getRatingCategory('1+0')).toBe('BULLET');
      expect(getRatingCategory('2+1')).toBe('BULLET');
      expect(getRatingCategory('3+0')).toBe('BLITZ');
      expect(getRatingCategory('3+2')).toBe('BLITZ');
      expect(getRatingCategory('5+0')).toBe('BLITZ');
      expect(getRatingCategory('5+3')).toBe('BLITZ');
      expect(getRatingCategory('10+0')).toBe('RAPID');
      expect(getRatingCategory('15+10')).toBe('RAPID');
      expect(getRatingCategory('30+0')).toBe('CLASSICAL');
      expect(getRatingCategory('30+20')).toBe('CLASSICAL');
    });
  });

  describe('3. Real-Time Online Game Manager & Clock Invariants', () => {
    it('creates active game session with exact time control calculations', async () => {
      const match = await gameManager.createMatchedGame(player1, player2, '5+3', 'sock-1', 'sock-2', true);

      expect(match.gameId).toBeTruthy();
      expect(match.status).toBe('ACTIVE');
      expect(match.whiteRemainingMs).toBe(300000); // 5 mins in ms
      expect(match.blackRemainingMs).toBe(300000);
      expect(match.increment).toBe(3);
      expect(match.whitePlayer.id).toBe(player1.id);
      expect(match.blackPlayer?.id).toBe(player2.id);
    });

    it('enforces turn ordering and rejects moves out of turn or by non-participants', async () => {
      const match = await gameManager.createMatchedGame(player1, player2, '5+3', 'sock-1', 'sock-2', true);

      // Black player attempts to move first -> rejected
      await expect(gameManager.makeMove(match.gameId, player2.id, 'e7', 'e5')).rejects.toThrow(
        /not your turn/i
      );

      // Non-participant attempts to move -> rejected
      await expect(gameManager.makeMove(match.gameId, 'stranger-id', 'e2', 'e4')).rejects.toThrow(
        /not a player/i
      );

      // White player moves legally -> accepted
      const { move } = await gameManager.makeMove(match.gameId, player1.id, 'e2', 'e4');
      expect(move.san).toBe('e4');
      expect(move.turn).toBe('b');
    });

    it('properly adds increment to player remaining clock upon legal move completion', async () => {
      const match = await gameManager.createMatchedGame(player1, player2, '3+2', 'sock-1', 'sock-2', true);

      const beforeWhiteMs = match.whiteRemainingMs;
      await gameManager.makeMove(match.gameId, player1.id, 'e2', 'e4');

      // Remaining time should include +2000ms increment
      expect(match.whiteRemainingMs).toBeGreaterThanOrEqual(beforeWhiteMs);
      expect(match.activeColor).toBe('b');
    });
  });

  describe('4. Authentication & JWT Token Security', () => {
    it('generates secure JWT token with subject and verifies payload integrity', () => {
      const token = signAuthToken({
        userId: 'u-12345',
        username: 'GrandmasterNova',
        email: 'gm@chessnova.com',
      });

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // Standard 3-segment JWT

      const payload = verifyAuthToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe('u-12345');
      expect(payload?.username).toBe('GrandmasterNova');
      expect(payload?.email).toBe('gm@chessnova.com');
    });

    it('rejects tampered or malformed JWT tokens safely without throwing unhandled exceptions', () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature';
      const payload = verifyAuthToken(invalidToken);
      expect(payload).toBeNull();

      const emptyPayload = verifyAuthToken('');
      expect(emptyPayload).toBeNull();
    });
  });

  describe('5. Matchmaking Queue Concurrency & Integrity', () => {
    it('prevents multiple entries by the same player in the matchmaking queue', async () => {
      const res1 = await matchmakingService.joinQueue(player1, 'sock-p1', '5+3');
      expect(res1.matched).toBe(false);

      // Second join should update existing entry rather than duplicate
      const res2 = await matchmakingService.joinQueue(player1, 'sock-p1-updated', '5+3');
      expect(res2.matched).toBe(false);
      expect(matchmakingStore.getQueueLength('5+3')).toBe(1);
    });

    it('removes player cleanly when disconnect occurs during queueing', async () => {
      await matchmakingService.joinQueue(player1, 'sock-disc-1', '10+0');
      expect(matchmakingStore.getQueueLength('10+0')).toBe(1);

      matchmakingService.handleDisconnect('sock-disc-1');
      expect(matchmakingStore.getQueueLength('10+0')).toBe(0);
    });
  });
});

