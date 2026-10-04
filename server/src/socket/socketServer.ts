import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAuthToken } from '../utils/token.js';
import { AUTH_COOKIE_NAME } from '../utils/cookie.js';
import { prisma } from '../services/database/prisma.js';
import { gameManager } from '../services/games/gameManager.js';
import { matchmakingService } from '../services/matchmaking/matchmakingService.js';
import { invitationService } from '../services/invitations/invitationService.js';
import { chatService } from '../services/chat/chatService.js';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import { PlayerInfo } from '../types/game.js';


interface AuthenticatedSocket extends Socket {
  user?: PlayerInfo;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce<Record<string, string>>((acc, item) => {
    const [key, val] = item.trim().split('=');
    if (key && val) {
      acc[decodeURIComponent(key)] = decodeURIComponent(val);
    }
    return acc;
  }, {});
}

export function initializeSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  gameManager.setSocketServer(io);

  // Authentication Middleware for incoming Socket.IO connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      let token: string | undefined;

      // 1. Try extracting token from HTTP cookie header
      const cookieHeader = socket.handshake.headers.cookie;
      if (cookieHeader) {
        const parsedCookies = parseCookies(cookieHeader);
        token = parsedCookies[AUTH_COOKIE_NAME];
      }

      // 2. Fallback to auth handshake token (Bearer or raw token)
      if (!token && socket.handshake.auth?.token) {
        const rawAuth = socket.handshake.auth.token;
        token = rawAuth.startsWith('Bearer ') ? rawAuth.substring(7) : rawAuth;
      }

      if (!token) {
        return next(new Error('Authentication required. Please sign in.'));
      }

      // 3. Verify JWT
      const payload = verifyAuthToken(token);
      if (!payload) {
        return next(new Error('Invalid or expired authentication session.'));
      }

      // 4. Load user profile
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return next(new Error('User account not found or deactivated.'));
      }

      socket.user = {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      };

      next();
    } catch (err: any) {
      logger.error('[Socket.IO] Auth verification error:', err);
      next(new Error('Authentication failed'));
    }
  });

  // Handle Authenticated Socket Connections
  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    logger.info(`[Socket.IO] Authenticated user connected: ${user.username} (${socket.id})`);

    socket.emit('connected', {
      message: 'Connected to ChessNova Real-time Gateway',
      socketId: socket.id,
      user,
    });

    socket.join(`user:${user.id}`);

    /**
     * ==========================================
     * MATCHMAKING SOCKET EVENTS
     * ==========================================
     */
    socket.on(
      'matchmaking:join',
      async (data: { timeControl?: string }, callback) => {
        try {
          const timeControl = data?.timeControl || '5+3';
          const result = await matchmakingService.joinQueue(user, socket.id, timeControl);

          if (result.matched && result.gameId && result.whitePlayer && result.blackPlayer) {
            // Match found! Emit matched payload to both players
            const whitePayload = {
              gameId: result.gameId,
              color: 'white' as const,
              opponent: result.blackPlayer,
              timeControl: result.timeControl,
            };

            const blackPayload = {
              gameId: result.gameId,
              color: 'black' as const,
              opponent: result.whitePlayer,
              timeControl: result.timeControl,
            };

            // Send to white player room/socket
            io.to(`user:${result.whitePlayer.id}`).emit('matchmaking:matched', whitePayload);
            // Send to black player room/socket
            io.to(`user:${result.blackPlayer.id}`).emit('matchmaking:matched', blackPayload);

            if (typeof callback === 'function') {
              callback({
                success: true,
                matched: true,
                gameId: result.gameId,
                color: result.whitePlayer.id === user.id ? 'white' : 'black',
              });
            }
          } else {
            // Added to waiting queue
            socket.emit('matchmaking:joined', {
              timeControl: result.queueEntry?.timeControl,
              joinedAt: result.queueEntry?.joinedAt,
            });

            if (typeof callback === 'function') {
              callback({
                success: true,
                matched: false,
                timeControl: result.queueEntry?.timeControl,
              });
            }
          }
        } catch (err: any) {
          logger.error(`[Socket.IO] Error in matchmaking:join by ${user.username}:`, err);
          socket.emit('matchmaking:error', { message: err.message || 'Matchmaking error' });
          if (typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      }
    );

    socket.on('matchmaking:cancel', (_data, callback) => {
      try {
        const cancelled = matchmakingService.cancelQueue(user.id);
        socket.emit('matchmaking:cancelled');
        if (typeof callback === 'function') {
          callback({ success: true, cancelled });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    socket.on('matchmaking:status', (_data, callback) => {
      try {
        const status = matchmakingService.getStatus(user.id);
        if (typeof callback === 'function') {
          callback({ success: true, status });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    /**
     * ==========================================
     * GAME INVITATION SOCKET EVENTS
     * ==========================================
     */
    socket.on(
      'invitation:send',
      async (data: { receiverId: string; timeControl?: string }, callback) => {
        try {
          const { receiverId, timeControl } = data;
          const invitation = await invitationService.sendInvitation(
            user,
            receiverId,
            timeControl || '5+3'
          );

          // Real-time broadcast to receiver's user room
          io.to(`user:${receiverId}`).emit('invitation:received', invitation);

          if (typeof callback === 'function') {
            callback({ success: true, invitation });
          }
        } catch (err: any) {
          logger.error(`[Socket.IO] Error in invitation:send:`, err);
          socket.emit('invitation:error', { message: err.message });
          if (typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      }
    );

    socket.on('invitation:accept', async (data: { invitationId: string }, callback) => {
      try {
        const matchData = await invitationService.acceptInvitation(data.invitationId, user);

        const whitePayload = {
          gameId: matchData.gameId,
          color: 'white' as const,
          opponent: matchData.blackPlayer,
          timeControl: matchData.timeControl,
        };

        const blackPayload = {
          gameId: matchData.gameId,
          color: 'black' as const,
          opponent: matchData.whitePlayer,
          timeControl: matchData.timeControl,
        };

        // Notify sender & receiver
        io.to(`user:${matchData.whitePlayer.id}`).emit('invitation:accepted', whitePayload);
        io.to(`user:${matchData.blackPlayer.id}`).emit('invitation:accepted', blackPayload);

        if (typeof callback === 'function') {
          callback({
            success: true,
            gameId: matchData.gameId,
            color: matchData.whitePlayer.id === user.id ? 'white' : 'black',
          });
        }
      } catch (err: any) {
        logger.error(`[Socket.IO] Error in invitation:accept:`, err);
        socket.emit('invitation:error', { message: err.message });
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    socket.on('invitation:decline', async (data: { invitationId: string }, callback) => {
      try {
        const invitation = await invitationService.declineInvitation(data.invitationId, user.id);
        io.to(`user:${invitation.senderId}`).emit('invitation:declined', {
          invitationId: invitation.id,
          declinedBy: user,
        });

        if (typeof callback === 'function') {
          callback({ success: true, invitation });
        }
      } catch (err: any) {
        socket.emit('invitation:error', { message: err.message });
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    socket.on('invitation:cancel', async (data: { invitationId: string }, callback) => {
      try {
        const invitation = await invitationService.cancelInvitation(data.invitationId, user.id);
        io.to(`user:${invitation.receiverId}`).emit('invitation:cancelled', {
          invitationId: invitation.id,
        });

        if (typeof callback === 'function') {
          callback({ success: true, invitation });
        }
      } catch (err: any) {
        socket.emit('invitation:error', { message: err.message });
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    /**
     * ==========================================
     * ONLINE GAMEPLAY SOCKET EVENTS
     * ==========================================
     */
    /**
     * Create a new online game
     */
    socket.on('game:create', async (data: { timeControl?: string }, callback) => {
      try {
        const timeControl = data?.timeControl || '5+3';
        const game = await gameManager.createGame(user, timeControl, socket.id);

        socket.join(`game:${game.gameId}`);

        const gameState = gameManager.getGameState(game.gameId, user.id);
        socket.emit('game:state', gameState);

        if (typeof callback === 'function') {
          callback({ success: true, gameId: game.gameId });
        }
      } catch (err: any) {
        logger.error(`[Socket.IO] Error in game:create by ${user.username}:`, err);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message || 'Failed to create game' });
        }
      }
    });

    /**
     * Join an existing online game
     */
    socket.on('game:join', async (data: { gameId: string }, callback) => {
      try {
        const { gameId } = data;
        if (!gameId) {
          if (typeof callback === 'function') callback({ success: false, error: 'gameId is required' });
          return;
        }

        const { game, started } = await gameManager.joinGame(gameId, user, socket.id);
        socket.join(`game:${gameId}`);

        // Broadcast updated state to both players
        const whiteState = gameManager.getGameState(gameId, game.whitePlayer.id);
        const blackState = game.blackPlayer ? gameManager.getGameState(gameId, game.blackPlayer.id) : null;

        if (game.whiteSocketId) {
          io.to(game.whiteSocketId).emit('game:state', whiteState);
        }
        if (game.blackSocketId && blackState) {
          io.to(game.blackSocketId).emit('game:state', blackState);
        }

        if (started) {
          io.to(`game:${gameId}`).emit('game:started', { gameId });
        }

        if (typeof callback === 'function') {
          callback({ success: true });
        }
      } catch (err: any) {
        logger.error(`[Socket.IO] Error in game:join for game ${data?.gameId}:`, err);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message || 'Failed to join game' });
        }
      }
    });

    /**
     * Reconnect to an existing game
     */
    socket.on('game:reconnect', async (data: { gameId: string }, callback) => {
      try {
        const { gameId } = data;
        const { game } = await gameManager.joinGame(gameId, user, socket.id);
        socket.join(`game:${gameId}`);

        const userState = gameManager.getGameState(gameId, user.id);
        socket.emit('game:state', userState);

        // Notify room opponent that player is back online
        socket.to(`game:${gameId}`).emit('game:opponent-status', { connected: true });

        if (typeof callback === 'function') {
          callback({ success: true });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message || 'Failed to reconnect' });
        }
      }
    });

    /**
     * Make a legal chess move
     */
    socket.on(
      'game:move',
      async (data: { gameId: string; from: string; to: string; promotion?: string }, callback) => {
        try {
          const { gameId, from, to, promotion } = data;
          const { move, gameEnded } = await gameManager.makeMove(
            gameId,
            user.id,
            from,
            to,
            promotion
          );

          // Broadcast authoritative move to room
          io.to(`game:${gameId}`).emit('game:move', move);

          if (gameEnded) {
            io.to(`game:${gameId}`).emit('game:ended', gameEnded);
          }

          if (typeof callback === 'function') {
            callback({ success: true });
          }
        } catch (err: any) {
          logger.warn(`[Socket.IO] Rejected move from ${user.username}: ${err.message}`);
          socket.emit('game:error', { message: err.message || 'Illegal move' });
          if (typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      }
    );

    /**
     * Resign active game
     */
    socket.on('game:resign', async (data: { gameId: string }, callback) => {
      try {
        const { gameId } = data;
        const gameEnded = await gameManager.resignGame(gameId, user.id);
        io.to(`game:${gameId}`).emit('game:ended', gameEnded);

        if (typeof callback === 'function') {
          callback({ success: true });
        }
      } catch (err: any) {
        socket.emit('game:error', { message: err.message || 'Failed to resign' });
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    /**
     * Draw Offers
     */
    socket.on('game:offer-draw', (data: { gameId: string }) => {
      try {
        const { by } = gameManager.offerDraw(data.gameId, user.id);
        socket.to(`game:${data.gameId}`).emit('game:draw-offered', { by });
      } catch (err: any) {
        socket.emit('game:error', { message: err.message });
      }
    });

    socket.on('game:accept-draw', async (data: { gameId: string }) => {
      try {
        const gameEnded = await gameManager.acceptDraw(data.gameId, user.id);
        io.to(`game:${data.gameId}`).emit('game:ended', gameEnded);
      } catch (err: any) {
        socket.emit('game:error', { message: err.message });
      }
    });

    socket.on('game:decline-draw', (data: { gameId: string }) => {
      try {
        gameManager.declineDraw(data.gameId, user.id);
        socket.to(`game:${data.gameId}`).emit('game:draw-declined');
      } catch (err: any) {
        socket.emit('game:error', { message: err.message });
      }
    });

    /**
     * ==========================================
     * REAL-TIME GAME CHAT SOCKET EVENTS
     * ==========================================
     */
    socket.on(
      'chat:send',
      async (data: { gameId: string; message: string }, callback) => {
        try {
          const { gameId, message } = data;
          if (!gameId || !message) {
            if (typeof callback === 'function') callback({ success: false, error: 'Invalid message payload' });
            return;
          }

          const savedMessage = await chatService.postMessage(gameId, user.id, message);

          // Broadcast saved message to the game room in real-time
          io.to(`game:${gameId}`).emit('chat:message', savedMessage);

          if (typeof callback === 'function') {
            callback({ success: true, message: savedMessage });
          }
        } catch (err: any) {
          logger.warn(`[Socket.IO] Chat error for ${user.username}: ${err.message}`);
          socket.emit('chat:error', { message: err.message || 'Failed to send message' });
          if (typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      }
    );

    socket.on('chat:history', async (data: { gameId: string }, callback) => {
      try {
        const { gameId } = data;
        const history = await chatService.getGameChatHistory(gameId);
        if (typeof callback === 'function') {
          callback({ success: true, history });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      logger.info(`[Socket.IO] Client disconnected: ${user.username} (${socket.id})`);

      // Clean up matchmaking queue
      matchmakingService.handleDisconnect(socket.id);

      const disconnectedInfo = gameManager.handleDisconnect(socket.id);
      if (disconnectedInfo) {
        socket.to(`game:${disconnectedInfo.gameId}`).emit('game:opponent-status', {
          connected: false,
          color: disconnectedInfo.userColor,
        });
      }
    });

  });

  return io;
}
