import { Chess } from 'chess.js';
import { Server as SocketIOServer } from 'socket.io';
import { GameResultStatus, TerminationReason, GameType } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import { gameRepository, MoveRecordInput } from './game.repository.js';
import { ratingService } from '../ratings/ratingService.js';
import { logger } from '../../utils/logger.js';
import {
  PlayerInfo,
  OnlineGameStatus,
  GameStatePayload,
  MovePayload,
  GameEndedPayload,
  LastMoveInfo,
  PlayerColor,
} from '../../types/game.js';

export interface ActiveOnlineGame {
  gameId: string;
  timeControl: string;
  initialTime: number; // in seconds
  increment: number; // in seconds
  rated: boolean;
  status: OnlineGameStatus;
  chess: Chess;
  whitePlayer: PlayerInfo;
  blackPlayer: PlayerInfo | null;
  whiteSocketId: string | null;
  blackSocketId: string | null;
  whiteConnected: boolean;
  blackConnected: boolean;
  whiteRemainingMs: number;
  blackRemainingMs: number;
  lastClockUpdateAtMs: number | null;
  activeColor: PlayerColor;
  timeoutTimer: NodeJS.Timeout | null;
  moves: MoveRecordInput[];
  lastMove: LastMoveInfo | null;
  drawOffer: PlayerColor | null;
  createdAt: Date;
}

export class GameManager {
  private games: Map<string, ActiveOnlineGame> = new Map();
  private io: SocketIOServer | null = null;

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Clear all active games in memory (useful for testing and maintenance)
   */
  public clearAllGames() {
    for (const game of this.games.values()) {
      if (game.timeoutTimer) {
        clearTimeout(game.timeoutTimer);
      }
    }
    this.games.clear();
  }


  /**
   * Create a new online game session
   */
  async createGame(
    creator: PlayerInfo,
    timeControl = '5+3',
    socketId: string,
    rated = true
  ): Promise<ActiveOnlineGame> {
    const parts = timeControl.split('+');
    const initialMinutes = parseInt(parts[0] || '5', 10);
    const increment = parseInt(parts[1] || '3', 10);
    const initialTimeSeconds = initialMinutes * 60;

    // Create Game in PostgreSQL
    const dbGame = await gameRepository.createGame({
      whitePlayerId: creator.id,
      gameType: GameType.ONLINE,
      timeControl,
      initialTime: initialTimeSeconds,
      increment,
      rated,
    });

    const activeGame: ActiveOnlineGame = {
      gameId: dbGame.id,
      timeControl,
      initialTime: initialTimeSeconds,
      increment,
      rated,
      status: 'WAITING',
      chess: new Chess(),
      whitePlayer: creator,
      blackPlayer: null,
      whiteSocketId: socketId,
      blackSocketId: null,
      whiteConnected: true,
      blackConnected: false,
      whiteRemainingMs: initialTimeSeconds * 1000,
      blackRemainingMs: initialTimeSeconds * 1000,
      lastClockUpdateAtMs: null,
      activeColor: 'w',
      timeoutTimer: null,
      moves: [],
      lastMove: null,
      drawOffer: null,
      createdAt: new Date(),
    };

    this.games.set(dbGame.id, activeGame);
    logger.info(`[GameManager] Online game created: ${dbGame.id} by ${creator.username} (${timeControl}, rated: ${rated})`);

    return activeGame;
  }

  /**
   * Create an online match between two matched players (from Matchmaking or Invitation)
   */
  async createMatchedGame(
    whitePlayer: PlayerInfo,
    blackPlayer: PlayerInfo,
    timeControl = '5+3',
    rated = true
  ): Promise<ActiveOnlineGame> {
    const parts = timeControl.split('+');
    const initialMinutes = parseInt(parts[0] || '5', 10);
    const increment = parseInt(parts[1] || '3', 10);
    const initialTimeSeconds = initialMinutes * 60;

    // Create Game in PostgreSQL with both players assigned
    const dbGame = await gameRepository.createGame({
      whitePlayerId: whitePlayer.id,
      blackPlayerId: blackPlayer.id,
      gameType: GameType.ONLINE,
      timeControl,
      initialTime: initialTimeSeconds,
      increment,
      rated,
    });

    const activeGame: ActiveOnlineGame = {
      gameId: dbGame.id,
      timeControl,
      initialTime: initialTimeSeconds,
      increment,
      rated,
      status: 'ACTIVE',
      chess: new Chess(),
      whitePlayer,
      blackPlayer,
      whiteSocketId: null,
      blackSocketId: null,
      whiteConnected: false,
      blackConnected: false,
      whiteRemainingMs: initialTimeSeconds * 1000,
      blackRemainingMs: initialTimeSeconds * 1000,
      lastClockUpdateAtMs: Date.now(),
      activeColor: 'w',
      timeoutTimer: null,
      moves: [],
      lastMove: null,
      drawOffer: null,
      createdAt: new Date(),
    };

    this.games.set(dbGame.id, activeGame);

    // Start clock timer for White
    this.startClockTimer(activeGame);

    logger.info(
      `[GameManager] Matched game created: ${dbGame.id} (${whitePlayer.username} [W] vs ${blackPlayer.username} [B] - ${timeControl}, rated: ${rated})`
    );

    return activeGame;
  }

  /**
   * Check if a player is currently in an active game
   */
  isPlayerInActiveGame(userId: string): boolean {
    for (const game of this.games.values()) {
      if (game.status === 'ACTIVE' && (game.whitePlayer.id === userId || game.blackPlayer?.id === userId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get active game for a player if one exists
   */
  getActiveGameForPlayer(userId: string): ActiveOnlineGame | null {
    for (const game of this.games.values()) {
      if (game.status === 'ACTIVE' && (game.whitePlayer.id === userId || game.blackPlayer?.id === userId)) {
        return game;
      }
    }
    return null;
  }

  /**
   * Join an existing game as opponent (Black)
   */
  async joinGame(
    gameId: string,
    player: PlayerInfo,
    socketId: string
  ): Promise<{ game: ActiveOnlineGame; started: boolean }> {
    let activeGame: ActiveOnlineGame | null | undefined = this.games.get(gameId);

    // If game is in DB but not in memory yet, load it
    if (!activeGame) {
      activeGame = await this.loadGameFromDb(gameId);
      if (!activeGame) {
        throw new Error('Game not found or expired');
      }
    }

    if (activeGame.status === 'FINISHED') {
      throw new Error('This game has already finished');
    }

    // Check if player is returning / reconnecting
    if (activeGame.whitePlayer.id === player.id) {
      activeGame.whiteSocketId = socketId;
      activeGame.whiteConnected = true;
      return { game: activeGame, started: activeGame.status === 'ACTIVE' };
    }

    if (activeGame.blackPlayer && activeGame.blackPlayer.id === player.id) {
      activeGame.blackSocketId = socketId;
      activeGame.blackConnected = true;
      return { game: activeGame, started: activeGame.status === 'ACTIVE' };
    }

    // Joining as second player (Black)
    if (activeGame.status === 'WAITING' && !activeGame.blackPlayer) {
      if (activeGame.whitePlayer.id === player.id) {
        throw new Error('Cannot join your own game as opponent');
      }

      activeGame.blackPlayer = player;
      activeGame.blackSocketId = socketId;
      activeGame.blackConnected = true;
      activeGame.status = 'ACTIVE';
      activeGame.lastClockUpdateAtMs = Date.now();

      // Update blackPlayer in DB
      await prisma.game.update({
        where: { id: gameId },
        data: {
          blackPlayerId: player.id,
          startedAt: new Date(),
        },
      });

      // Start authoritative clock timer for White
      this.startClockTimer(activeGame);

      logger.info(
        `[GameManager] Game ${gameId} started: ${activeGame.whitePlayer.username} (W) vs ${player.username} (B)`
      );

      return { game: activeGame, started: true };
    }

    throw new Error('Game is full or not joinable');
  }

  /**
   * Make a move on the authoritative board
   */
  async makeMove(
    gameId: string,
    userId: string,
    from: string,
    to: string,
    promotion = 'q'
  ): Promise<{ move: MovePayload; gameEnded?: GameEndedPayload }> {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'ACTIVE') {
      throw new Error('Game is not currently active');
    }

    // Verify player is authorized and it is their turn
    const isWhite = game.whitePlayer.id === userId;
    const isBlack = game.blackPlayer?.id === userId;

    if (!isWhite && !isBlack) {
      throw new Error('You are not a player in this game');
    }

    const playerColor: PlayerColor = isWhite ? 'w' : 'b';
    if (game.chess.turn() !== playerColor) {
      throw new Error('It is not your turn');
    }

    // 1. Authoritative Clock calculation
    const now = Date.now();
    if (game.lastClockUpdateAtMs !== null) {
      const elapsed = now - game.lastClockUpdateAtMs;
      if (playerColor === 'w') {
        game.whiteRemainingMs = Math.max(0, game.whiteRemainingMs - elapsed);
      } else {
        game.blackRemainingMs = Math.max(0, game.blackRemainingMs - elapsed);
      }
    }

    // Check timeout
    if (
      (playerColor === 'w' && game.whiteRemainingMs <= 0) ||
      (playerColor === 'b' && game.blackRemainingMs <= 0)
    ) {
      return this.handleTimeout(gameId, playerColor);
    }

    // 2. Validate and apply move with chess.js
    let moveResult: any;
    try {
      moveResult = game.chess.move({
        from,
        to,
        promotion: promotion || 'q',
      });
    } catch {
      throw new Error('Illegal chess move');
    }

    if (!moveResult) {
      throw new Error('Illegal chess move');
    }

    // 3. Add increment to player who just moved
    if (playerColor === 'w') {
      game.whiteRemainingMs += game.increment * 1000;
    } else {
      game.blackRemainingMs += game.increment * 1000;
    }

    // Reset draw offer if any move is played
    game.drawOffer = null;

    // Record move
    const ply = game.moves.length + 1;
    const moveNumber = Math.ceil(ply / 2);
    const moveRecord: MoveRecordInput = {
      moveNumber,
      ply,
      color: moveResult.color,
      from: moveResult.from,
      to: moveResult.to,
      san: moveResult.san,
      uci: `${moveResult.from}${moveResult.to}${moveResult.promotion || ''}`,
      fen: game.chess.fen(),
    };

    game.moves.push(moveRecord);
    game.lastMove = {
      from: moveResult.from,
      to: moveResult.to,
      san: moveResult.san,
      color: playerColor,
      piece: moveResult.piece,
    };

    // Update active clock turn
    game.activeColor = game.chess.turn() as PlayerColor;
    game.lastClockUpdateAtMs = now;

    // Persist move to PostgreSQL asynchronously
    gameRepository.addMove(gameId, moveRecord).catch((err) => {
      logger.error(`[GameManager] Failed to persist move for game ${gameId}:`, err);
    });

    // 4. Check Game Over conditions
    const isCheck = game.chess.inCheck();
    const isCheckmate = game.chess.isCheckmate();
    const isDraw = game.chess.isDraw();
    const isStalemate = game.chess.isStalemate();
    const isThreefold = game.chess.isThreefoldRepetition();
    const isInsufficient = game.chess.isInsufficientMaterial();

    let gameEndedPayload: GameEndedPayload | undefined;

    if (isCheckmate) {
      const winnerColor = playerColor === 'w' ? 'white' : 'black';
      const winnerResult = playerColor === 'w' ? GameResultStatus.WHITE_WIN : GameResultStatus.BLACK_WIN;
      const winnerName = playerColor === 'w' ? game.whitePlayer.username : game.blackPlayer?.username;

      game.status = 'FINISHED';
      this.clearClockTimer(game);

      gameEndedPayload = {
        gameId,
        result: winnerResult as any,
        terminationReason: 'CHECKMATE',
        winnerColor,
        winnerName,
        finalFen: game.chess.fen(),
        pgn: game.chess.pgn(),
      };

      await gameRepository.updateGameResult(
        gameId,
        winnerResult,
        TerminationReason.CHECKMATE,
        game.chess.fen(),
        game.chess.pgn()
      );

      gameEndedPayload = await this.finalizeGameAndCalculateRatings(gameId, gameEndedPayload);
    } else if (isDraw || isStalemate || isThreefold || isInsufficient) {
      let reason: TerminationReason = TerminationReason.FIFTY_MOVE_RULE;
      if (isStalemate) reason = TerminationReason.STALEMATE;
      else if (isThreefold) reason = TerminationReason.THREEFOLD_REPETITION;
      else if (isInsufficient) reason = TerminationReason.INSUFFICIENT_MATERIAL;

      game.status = 'FINISHED';
      this.clearClockTimer(game);

      gameEndedPayload = {
        gameId,
        result: 'DRAW',
        terminationReason: reason,
        winnerColor: null,
        winnerName: null,
        finalFen: game.chess.fen(),
        pgn: game.chess.pgn(),
      };

      await gameRepository.updateGameResult(
        gameId,
        GameResultStatus.DRAW,
        reason,
        game.chess.fen(),
        game.chess.pgn()
      );

      gameEndedPayload = await this.finalizeGameAndCalculateRatings(gameId, gameEndedPayload);
    } else {
      // Continue game: schedule clock countdown for the other player
      this.startClockTimer(game);
    }

    const movePayload: MovePayload = {
      gameId,
      from: moveResult.from,
      to: moveResult.to,
      san: moveResult.san,
      fen: game.chess.fen(),
      turn: game.chess.turn() as PlayerColor,
      whiteTime: Math.ceil(game.whiteRemainingMs / 1000),
      blackTime: Math.ceil(game.blackRemainingMs / 1000),
      ply,
      moveNumber,
      isCheck,
      isGameOver: game.status === 'FINISHED',
      result: gameEndedPayload?.result as any,
      terminationReason: gameEndedPayload?.terminationReason,
    };

    return { move: movePayload, gameEnded: gameEndedPayload };
  }

  /**
   * Resign game
   */
  async resignGame(
    gameId: string,
    userId: string
  ): Promise<GameEndedPayload> {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'ACTIVE') throw new Error('Game is not active');

    const isWhite = game.whitePlayer.id === userId;
    const isBlack = game.blackPlayer?.id === userId;
    if (!isWhite && !isBlack) throw new Error('You are not a player in this game');

    const winnerColor = isWhite ? 'black' : 'white';
    const winnerResult = isWhite ? GameResultStatus.BLACK_WIN : GameResultStatus.WHITE_WIN;
    const winnerName = isWhite ? game.blackPlayer?.username : game.whitePlayer.username;

    game.status = 'FINISHED';
    this.clearClockTimer(game);

    let endedPayload: GameEndedPayload = {
      gameId,
      result: winnerResult as any,
      terminationReason: 'RESIGNATION',
      winnerColor,
      winnerName,
      finalFen: game.chess.fen(),
      pgn: game.chess.pgn(),
    };

    await gameRepository.updateGameResult(
      gameId,
      winnerResult,
      TerminationReason.RESIGNATION,
      game.chess.fen(),
      game.chess.pgn()
    );

    endedPayload = await this.finalizeGameAndCalculateRatings(gameId, endedPayload);
    return endedPayload;
  }

  /**
   * Handle Draw Offer
   */
  offerDraw(gameId: string, userId: string): { by: PlayerColor } {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'ACTIVE') throw new Error('Game is not active');

    const isWhite = game.whitePlayer.id === userId;
    const isBlack = game.blackPlayer?.id === userId;
    if (!isWhite && !isBlack) throw new Error('Not a player in this game');

    const playerColor: PlayerColor = isWhite ? 'w' : 'b';
    game.drawOffer = playerColor;
    return { by: playerColor };
  }

  /**
   * Accept Draw Offer
   */
  async acceptDraw(gameId: string, userId: string): Promise<GameEndedPayload> {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'ACTIVE') throw new Error('Game is not active');

    const isWhite = game.whitePlayer.id === userId;
    const isBlack = game.blackPlayer?.id === userId;
    if (!isWhite && !isBlack) throw new Error('Not a player in this game');

    const playerColor: PlayerColor = isWhite ? 'w' : 'b';
    const opponentColor = playerColor === 'w' ? 'b' : 'w';

    if (game.drawOffer !== opponentColor) {
      throw new Error('No active draw offer from opponent');
    }

    game.status = 'FINISHED';
    this.clearClockTimer(game);

    let endedPayload: GameEndedPayload = {
      gameId,
      result: 'DRAW',
      terminationReason: 'AGREEMENT',
      winnerColor: null,
      winnerName: null,
      finalFen: game.chess.fen(),
      pgn: game.chess.pgn(),
    };

    await gameRepository.updateGameResult(
      gameId,
      GameResultStatus.DRAW,
      TerminationReason.AGREEMENT,
      game.chess.fen(),
      game.chess.pgn()
    );

    endedPayload = await this.finalizeGameAndCalculateRatings(gameId, endedPayload);
    return endedPayload;
  }

  /**
   * Decline Draw Offer
   */
  declineDraw(gameId: string, _userId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;
    game.drawOffer = null;
  }

  /**
   * Authoritative Timeout Handler
   */
  private async handleTimeout(
    gameId: string,
    timedOutColor?: PlayerColor
  ): Promise<{ move: MovePayload; gameEnded: GameEndedPayload }> {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'ACTIVE') {
      throw new Error('Game is not active');
    }

    const activeColor = timedOutColor || game.activeColor;
    const winnerColor = activeColor === 'w' ? 'black' : 'white';
    const winnerResult = activeColor === 'w' ? GameResultStatus.BLACK_WIN : GameResultStatus.WHITE_WIN;
    const winnerName = activeColor === 'w' ? game.blackPlayer?.username : game.whitePlayer.username;

    if (activeColor === 'w') game.whiteRemainingMs = 0;
    else game.blackRemainingMs = 0;

    game.status = 'FINISHED';
    this.clearClockTimer(game);

    let gameEndedPayload: GameEndedPayload = {
      gameId,
      result: winnerResult as any,
      terminationReason: 'TIMEOUT',
      winnerColor,
      winnerName,
      finalFen: game.chess.fen(),
      pgn: game.chess.pgn(),
    };

    await gameRepository.updateGameResult(
      gameId,
      winnerResult,
      TerminationReason.TIMEOUT,
      game.chess.fen(),
      game.chess.pgn()
    );

    gameEndedPayload = await this.finalizeGameAndCalculateRatings(gameId, gameEndedPayload);

    if (this.io) {
      this.io.to(`game:${gameId}`).emit('game:ended', gameEndedPayload);
    }

    const movePayload: MovePayload = {
      gameId,
      from: '',
      to: '',
      san: '',
      fen: game.chess.fen(),
      turn: game.chess.turn() as PlayerColor,
      whiteTime: 0,
      blackTime: 0,
      ply: game.moves.length,
      moveNumber: Math.ceil(game.moves.length / 2),
      isCheck: false,
      isGameOver: true,
      result: winnerResult as any,
      terminationReason: 'TIMEOUT',
    };

    return { move: movePayload, gameEnded: gameEndedPayload };
  }

  /**
   * Finalize ratings for rated games
   */
  private async finalizeGameAndCalculateRatings(
    gameId: string,
    payload: GameEndedPayload
  ): Promise<GameEndedPayload> {
    const game = this.games.get(gameId);
    if (game && game.rated) {
      try {
        const ratingResult = await ratingService.processCompletedRatedGame(gameId);
        if (ratingResult) {
          payload.ratingChanges = {
            category: ratingResult.category,
            white: ratingResult.white,
            black: ratingResult.black,
          };
        }
      } catch (err) {
        logger.error(`[GameManager] Rating update error for game ${gameId}:`, err);
      }
    }
    return payload;
  }

  /**
   * Schedule countdown timer for active player's clock
   */
  private startClockTimer(game: ActiveOnlineGame) {
    this.clearClockTimer(game);

    const remaining = game.activeColor === 'w' ? game.whiteRemainingMs : game.blackRemainingMs;

    game.timeoutTimer = setTimeout(() => {
      this.handleTimeout(game.gameId, game.activeColor).catch((err) => {
        logger.error(`[GameManager] Error on timeout for game ${game.gameId}:`, err);
      });
    }, remaining);
  }

  private clearClockTimer(game: ActiveOnlineGame) {
    if (game.timeoutTimer) {
      clearTimeout(game.timeoutTimer);
      game.timeoutTimer = null;
    }
  }

  /**
   * Get safe game state payload for a specific viewing user
   */
  getGameState(gameId: string, userId?: string): GameStatePayload | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    let playerColor: 'white' | 'black' | undefined;
    if (userId) {
      if (game.whitePlayer.id === userId) playerColor = 'white';
      else if (game.blackPlayer?.id === userId) playerColor = 'black';
    }

    return {
      gameId: game.gameId,
      status: game.status,
      timeControl: game.timeControl,
      initialTime: game.initialTime,
      increment: game.increment,
      whitePlayer: game.whitePlayer,
      blackPlayer: game.blackPlayer,
      playerColor,
      fen: game.chess.fen(),
      turn: game.chess.turn() as PlayerColor,
      moveHistory: game.moves.map((m) => ({
        moveNumber: m.moveNumber,
        ply: m.ply,
        color: m.color,
        from: m.from,
        to: m.to,
        san: m.san,
        fen: m.fen,
      })),
      lastMove: game.lastMove,
      whiteTime: Math.max(0, Math.ceil(game.whiteRemainingMs / 1000)),
      blackTime: Math.max(0, Math.ceil(game.blackRemainingMs / 1000)),
      activeColor: game.activeColor,
      isCheck: game.chess.inCheck(),
      isGameOver: game.status === 'FINISHED',
      whiteConnected: game.whiteConnected,
      blackConnected: game.blackConnected,
    };
  }

  /**
   * Handle user socket disconnect
   */
  handleDisconnect(socketId: string): { gameId: string; userColor: 'white' | 'black' } | null {
    for (const [gameId, game] of this.games.entries()) {
      if (game.whiteSocketId === socketId) {
        game.whiteConnected = false;
        game.whiteSocketId = null;
        return { gameId, userColor: 'white' };
      }
      if (game.blackSocketId === socketId) {
        game.blackConnected = false;
        game.blackSocketId = null;
        return { gameId, userColor: 'black' };
      }
    }
    return null;
  }

  /**
   * Load completed or ongoing game from PostgreSQL DB
   */
  private async loadGameFromDb(gameId: string): Promise<ActiveOnlineGame | null> {
    const dbGame = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        moves: { orderBy: { ply: 'asc' } },
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    if (!dbGame || !dbGame.whitePlayer) return null;

    const parts = dbGame.timeControl.split('+');
    const initialMinutes = parseInt(parts[0] || '5', 10);
    const increment = parseInt(parts[1] || '3', 10);

    const chess = new Chess(dbGame.finalFen || dbGame.initialFen);

    const activeGame: ActiveOnlineGame = {
      gameId: dbGame.id,
      timeControl: dbGame.timeControl,
      initialTime: dbGame.initialTime,
      increment,
      rated: dbGame.rated,
      status: dbGame.result === GameResultStatus.ONGOING ? (dbGame.blackPlayer ? 'ACTIVE' : 'WAITING') : 'FINISHED',
      chess,
      whitePlayer: {
        id: dbGame.whitePlayer.id,
        username: dbGame.whitePlayer.username,
        displayName: dbGame.whitePlayer.displayName,
        avatarUrl: dbGame.whitePlayer.avatarUrl,
      },
      blackPlayer: dbGame.blackPlayer
        ? {
            id: dbGame.blackPlayer.id,
            username: dbGame.blackPlayer.username,
            displayName: dbGame.blackPlayer.displayName,
            avatarUrl: dbGame.blackPlayer.avatarUrl,
          }
        : null,
      whiteSocketId: null,
      blackSocketId: null,
      whiteConnected: false,
      blackConnected: false,
      whiteRemainingMs: dbGame.initialTime * 1000,
      blackRemainingMs: dbGame.initialTime * 1000,
      lastClockUpdateAtMs: null,
      activeColor: chess.turn() as PlayerColor,
      timeoutTimer: null,
      moves: dbGame.moves.map((m) => ({
        moveNumber: m.moveNumber,
        ply: m.ply,
        color: m.color,
        from: m.from,
        to: m.to,
        san: m.san,
        uci: m.uci,
        fen: m.fen,
      })),
      lastMove: null,
      drawOffer: null,
      createdAt: dbGame.createdAt,
    };

    this.games.set(gameId, activeGame);
    return activeGame;
  }
}

export const gameManager = new GameManager();
