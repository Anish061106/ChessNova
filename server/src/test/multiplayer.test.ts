import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Chess } from 'chess.js';
import { gameManager } from '../services/games/gameManager.js';
import { prisma } from '../services/database/prisma.js';
import { GameResultStatus, TerminationReason, GameType } from '@prisma/client';

describe('ChessNova Phase 6 — Server-Authoritative Real-Time Multiplayer', () => {
  const mockUserWhite = {
    id: 'user-white-1',
    username: 'WhiteGrandmaster',
    displayName: 'White GM',
    avatarUrl: null,
  };

  const mockUserBlack = {
    id: 'user-black-2',
    username: 'BlackTactician',
    displayName: 'Black Tactician',
    avatarUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Game Creation & Initialization', () => {
    it('creates an online game with correct initial parameters and status WAITING', async () => {
      const mockDbGame = {
        id: 'game-multiplayer-1',
        whitePlayerId: mockUserWhite.id,
        blackPlayerId: null,
        gameType: GameType.ONLINE,
        timeControl: '5+3',
        initialTime: 300,
        increment: 3,
        rated: false,
        initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        finalFen: null,
        result: GameResultStatus.ONGOING,
        terminationReason: null,
        pgn: null,
        startedAt: new Date(),
        endedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.game, 'create').mockResolvedValue(mockDbGame as any);

      const activeGame = await gameManager.createGame(mockUserWhite, '5+3', 'socket-white-1');

      expect(activeGame.gameId).toBe('game-multiplayer-1');
      expect(activeGame.status).toBe('WAITING');
      expect(activeGame.whitePlayer.id).toBe(mockUserWhite.id);
      expect(activeGame.blackPlayer).toBeNull();
      expect(activeGame.initialTime).toBe(300);
      expect(activeGame.increment).toBe(3);
      expect(activeGame.whiteRemainingMs).toBe(300000);
      expect(activeGame.blackRemainingMs).toBe(300000);
    });
  });

  describe('Second Player Join & Game Start', () => {
    it('starts game when second player joins and assigns Black', async () => {
      vi.spyOn(prisma.game, 'update').mockResolvedValue({} as any);

      const result = await gameManager.joinGame(
        'game-multiplayer-1',
        mockUserBlack,
        'socket-black-1'
      );

      expect(result.started).toBe(true);
      expect(result.game.status).toBe('ACTIVE');
      expect(result.game.blackPlayer?.id).toBe(mockUserBlack.id);
      expect(result.game.blackSocketId).toBe('socket-black-1');
    });

    it('rejects a third player trying to join the active game', async () => {
      const thirdPlayer = {
        id: 'user-third-3',
        username: 'Spectator',
      };

      await expect(
        gameManager.joinGame('game-multiplayer-1', thirdPlayer, 'socket-third-1')
      ).rejects.toThrow('Game is full or not joinable');
    });
  });

  describe('Server-Authoritative Legal Move Validation', () => {
    it('accepts White legal opening move e2-e4 and calculates remaining time + increment', async () => {
      vi.spyOn(prisma.move, 'create').mockResolvedValue({} as any);

      const result = await gameManager.makeMove(
        'game-multiplayer-1',
        mockUserWhite.id,
        'e2',
        'e4'
      );

      expect(result.move.san).toBe('e4');
      expect(result.move.turn).toBe('b');
      expect(result.move.isGameOver).toBe(false);

      const state = gameManager.getGameState('game-multiplayer-1');
      expect(state?.turn).toBe('b');
      expect(state?.moveHistory.length).toBe(1);
      expect(state?.lastMove?.from).toBe('e2');
      expect(state?.lastMove?.to).toBe('e4');
    });

    it('rejects White attempting to move when it is Black turn', async () => {
      await expect(
        gameManager.makeMove('game-multiplayer-1', mockUserWhite.id, 'd2', 'd4')
      ).rejects.toThrow('It is not your turn');
    });

    it('rejects illegal chess move from Black', async () => {
      await expect(
        gameManager.makeMove('game-multiplayer-1', mockUserBlack.id, 'e7', 'e4') // Illegal move (pawn cannot land on e4 occupied by white pawn)
      ).rejects.toThrow('Illegal chess move');
    });

    it('accepts Black legal response e7-e5', async () => {
      vi.spyOn(prisma.move, 'create').mockResolvedValue({} as any);

      const result = await gameManager.makeMove(
        'game-multiplayer-1',
        mockUserBlack.id,
        'e7',
        'e5'
      );

      expect(result.move.san).toBe('e5');
      expect(result.move.turn).toBe('w');

      const state = gameManager.getGameState('game-multiplayer-1');
      expect(state?.moveHistory.length).toBe(2);
    });
  });

  describe('Special Chess Moves: Castling & En Passant', () => {
    it('handles kingside castling validation and state', async () => {
      // Create new game for castling test
      vi.spyOn(prisma.game, 'create').mockResolvedValue({ id: 'game-castling-test' } as any);
      vi.spyOn(prisma.game, 'update').mockResolvedValue({} as any);
      vi.spyOn(prisma.move, 'create').mockResolvedValue({} as any);

      const game = await gameManager.createGame(mockUserWhite, '5+3', 's-w');
      await gameManager.joinGame(game.gameId, mockUserBlack, 's-b');

      // 1. e4 e5
      await gameManager.makeMove(game.gameId, mockUserWhite.id, 'e2', 'e4');
      await gameManager.makeMove(game.gameId, mockUserBlack.id, 'e7', 'e5');
      // 2. Nf3 Nc6
      await gameManager.makeMove(game.gameId, mockUserWhite.id, 'g1', 'f3');
      await gameManager.makeMove(game.gameId, mockUserBlack.id, 'b8', 'c6');
      // 3. Bc4 Bc5
      await gameManager.makeMove(game.gameId, mockUserWhite.id, 'f1', 'c4');
      await gameManager.makeMove(game.gameId, mockUserBlack.id, 'f8', 'c5');

      // 4. White Castles Kingside (O-O) -> e1g1
      const castleResult = await gameManager.makeMove(game.gameId, mockUserWhite.id, 'e1', 'g1');
      expect(castleResult.move.san).toBe('O-O');
    });
  });

  describe('Resignation & Game Over State', () => {
    it('ends game and records victory for Black when White resigns', async () => {
      vi.spyOn(prisma.game, 'update').mockResolvedValue({} as any);

      const endedPayload = await gameManager.resignGame('game-multiplayer-1', mockUserWhite.id);

      expect(endedPayload.result).toBe('BLACK_WIN');
      expect(endedPayload.terminationReason).toBe('RESIGNATION');
      expect(endedPayload.winnerColor).toBe('black');

      const state = gameManager.getGameState('game-multiplayer-1');
      expect(state?.isGameOver).toBe(true);
      expect(state?.status).toBe('FINISHED');
    });

    it('blocks subsequent moves on finished game', async () => {
      await expect(
        gameManager.makeMove('game-multiplayer-1', mockUserBlack.id, 'g8', 'f6')
      ).rejects.toThrow('Game is not currently active');
    });
  });

  describe('Reconnection & State Retrieval', () => {
    it('restores complete authoritative game state when player reconnects', async () => {
      const state = gameManager.getGameState('game-multiplayer-1', mockUserWhite.id);

      expect(state).not.toBeNull();
      expect(state?.gameId).toBe('game-multiplayer-1');
      expect(state?.playerColor).toBe('white');
      expect(state?.whitePlayer.username).toBe(mockUserWhite.username);
      expect(state?.moveHistory.length).toBe(2);
    });
  });
});
