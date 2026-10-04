import { create } from 'zustand';
import { Chess } from 'chess.js';
import { socketService } from '../services/socketService';
import {
  OnlineGameState,
  PlayerColor,
  LastMove,
} from '../types/multiplayer';

interface OnlineGameActions {
  initGame: (gameId: string) => Promise<void>;
  makeMove: (from: string, to: string, promotion?: string) => Promise<void>;
  resign: () => Promise<void>;
  offerDraw: () => void;
  acceptDraw: () => void;
  declineDraw: () => void;
  leaveGame: () => void;
  clearError: () => void;
}

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState: OnlineGameState = {
  gameId: null,
  status: 'WAITING',
  timeControl: '5+3',
  initialTime: 300,
  increment: 3,
  whitePlayer: null,
  blackPlayer: null,
  playerColor: null,
  fen: initialFen,
  turn: 'w',
  moveHistory: [],
  lastMove: null,
  whiteTime: 300,
  blackTime: 300,
  activeColor: 'w',
  isCheck: false,
  isGameOver: false,
  result: null,
  terminationReason: null,
  whiteConnected: true,
  blackConnected: false,
  drawOfferedBy: null,
  connectionStatus: 'connecting',
  error: null,
};

let clockInterval: any = null;

export const useOnlineGameStore = create<OnlineGameState & OnlineGameActions>((set, get) => ({
  ...initialState,

  /**
   * Initialize online game listeners and join room
   */
  initGame: async (gameId: string) => {
    // Reset previous game state
    set({ ...initialState, gameId, connectionStatus: 'connecting' });

    try {
      const socket = await socketService.connect();
      set({ connectionStatus: 'connected' });

      // Clean existing listeners to prevent duplicates
      socket.off('game:state');
      socket.off('game:started');
      socket.off('game:move');
      socket.off('game:ended');
      socket.off('game:opponent-status');
      socket.off('game:draw-offered');
      socket.off('game:draw-declined');
      socket.off('game:error');
      socket.off('disconnect');
      socket.off('connect');

      // 1. Full Game State Sync
      socket.on('game:state', (data: any) => {
        if (!data) return;

        set({
          status: data.status,
          timeControl: data.timeControl,
          initialTime: data.initialTime,
          increment: data.increment,
          whitePlayer: data.whitePlayer,
          blackPlayer: data.blackPlayer,
          playerColor: data.playerColor,
          fen: data.fen,
          turn: data.turn,
          moveHistory: data.moveHistory || [],
          lastMove: data.lastMove,
          whiteTime: data.whiteTime,
          blackTime: data.blackTime,
          activeColor: data.activeColor,
          isCheck: data.isCheck,
          isGameOver: data.isGameOver,
          result: data.result,
          terminationReason: data.terminationReason,
          whiteConnected: data.whiteConnected ?? true,
          blackConnected: data.blackConnected ?? false,
        });

        if (data.status === 'ACTIVE' && !data.isGameOver) {
          startClientClock();
        } else if (data.isGameOver) {
          stopClientClock();
        }
      });

      // 2. Game Started Event
      socket.on('game:started', () => {
        set({ status: 'ACTIVE' });
        startClientClock();
      });

      // 3. Move Event
      socket.on('game:move', (data: any) => {
        const lastMove: LastMove = {
          from: data.from,
          to: data.to,
          san: data.san,
          color: (data.turn === 'w' ? 'b' : 'w') as PlayerColor,
        };

        const currentHistory = get().moveHistory;
        const newRecord = {
          moveNumber: data.moveNumber,
          ply: data.ply,
          color: (data.turn === 'w' ? 'b' : 'w'),
          from: data.from,
          to: data.to,
          san: data.san,
          fen: data.fen,
        };

        set({
          fen: data.fen,
          turn: data.turn,
          activeColor: data.turn,
          whiteTime: data.whiteTime,
          blackTime: data.blackTime,
          lastMove,
          moveHistory: [...currentHistory, newRecord],
          isCheck: data.isCheck,
          isGameOver: data.isGameOver,
          result: data.result,
          terminationReason: data.terminationReason,
        });

        if (data.isGameOver) {
          stopClientClock();
        }
      });

      // 4. Game Ended Event
      socket.on('game:ended', (data: any) => {
        stopClientClock();
        set({
          status: 'FINISHED',
          isGameOver: true,
          result: data.result,
          terminationReason: data.terminationReason,
          fen: data.finalFen || get().fen,
        });
      });

      // 5. Opponent Connection Status
      socket.on('game:opponent-status', (data: { connected: boolean; color?: string }) => {
        const isWhiteOpponent = get().playerColor === 'black';
        if (isWhiteOpponent) {
          set({ whiteConnected: data.connected });
        } else {
          set({ blackConnected: data.connected });
        }
      });

      // 6. Draw Offers
      socket.on('game:draw-offered', (data: { by: PlayerColor }) => {
        set({ drawOfferedBy: data.by });
      });

      socket.on('game:draw-declined', () => {
        set({ drawOfferedBy: null, error: 'Draw offer was declined.' });
      });

      // 7. Error & Disconnect
      socket.on('game:error', (err: { message: string }) => {
        set({ error: err.message });
      });

      socket.on('disconnect', () => {
        set({ connectionStatus: 'disconnected' });
      });

      socket.on('connect', () => {
        set({ connectionStatus: 'connected' });
        socketService.reconnectGame(gameId).catch(() => {});
      });

      // Join the game room
      await socketService.joinGame(gameId);
    } catch (err: any) {
      set({
        connectionStatus: 'disconnected',
        error: err.message || 'Failed to connect to online game.',
      });
    }
  },

  /**
   * Submit legal move to server
   */
  makeMove: async (from: string, to: string, promotion = 'q') => {
    const { gameId, fen, turn, playerColor } = get();
    if (!gameId) return;

    if (playerColor && ((playerColor === 'white' && turn !== 'w') || (playerColor === 'black' && turn !== 'b'))) {
      set({ error: 'It is not your turn' });
      return;
    }

    // Local client validation before emitting
    const localChess = new Chess(fen);
    try {
      const move = localChess.move({ from, to, promotion });
      if (!move) throw new Error('Illegal move');
    } catch {
      set({ error: 'Illegal chess move' });
      return;
    }

    try {
      await socketService.makeMove(gameId, from, to, promotion);
    } catch (err: any) {
      set({ error: err.message || 'Move was rejected by the server' });
    }
  },

  /**
   * Resign active game
   */
  resign: async () => {
    const { gameId } = get();
    if (!gameId) return;
    try {
      await socketService.resign(gameId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to resign' });
    }
  },

  /**
   * Draw actions
   */
  offerDraw: () => {
    const { gameId } = get();
    if (gameId) socketService.offerDraw(gameId);
  },

  acceptDraw: () => {
    const { gameId } = get();
    if (gameId) {
      socketService.acceptDraw(gameId);
      set({ drawOfferedBy: null });
    }
  },

  declineDraw: () => {
    const { gameId } = get();
    if (gameId) {
      socketService.declineDraw(gameId);
      set({ drawOfferedBy: null });
    }
  },

  /**
   * Leave game and cleanup
   */
  leaveGame: () => {
    stopClientClock();
    socketService.disconnect();
    set({ ...initialState });
  },

  clearError: () => set({ error: null }),
}));

function startClientClock() {
  stopClientClock();
  clockInterval = setInterval(() => {
    const { activeColor, whiteTime, blackTime, status, isGameOver } = useOnlineGameStore.getState();
    if (status !== 'ACTIVE' || isGameOver) {
      stopClientClock();
      return;
    }

    if (activeColor === 'w') {
      useOnlineGameStore.setState({
        whiteTime: Math.max(0, whiteTime - 1),
      });
    } else {
      useOnlineGameStore.setState({
        blackTime: Math.max(0, blackTime - 1),
      });
    }
  }, 1000);
}

function stopClientClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}
