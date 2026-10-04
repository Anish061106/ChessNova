import { create } from 'zustand';
import { socketService } from '../services/socketService';
import { MatchmakingState, MatchmakingMatchedPayload } from '../types/matchmaking';

interface MatchmakingActions {
  startSearch: (timeControl: string) => Promise<void>;
  cancelSearch: () => Promise<void>;
  resetMatchmaking: () => void;
  initMatchmakingListeners: () => Promise<void>;
}

const initialState: MatchmakingState = {
  status: 'idle',
  timeControl: null,
  startedAt: null,
  gameId: null,
  matchedData: null,
  error: null,
};

export const useMatchmakingStore = create<MatchmakingState & MatchmakingActions>((set, get) => ({
  ...initialState,

  initMatchmakingListeners: async () => {
    try {
      const socket = await socketService.connect();

      // Remove existing listeners to avoid duplicate events
      socket.off('matchmaking:joined');
      socket.off('matchmaking:matched');
      socket.off('matchmaking:cancelled');
      socket.off('matchmaking:error');

      socket.on('matchmaking:joined', (data: { timeControl?: string; joinedAt?: number }) => {
        set({
          status: 'searching',
          timeControl: data.timeControl || get().timeControl,
          startedAt: data.joinedAt || Date.now(),
          error: null,
        });
      });

      socket.on('matchmaking:matched', (data: MatchmakingMatchedPayload) => {
        set({
          status: 'matched',
          gameId: data.gameId,
          matchedData: data,
          error: null,
        });
      });

      socket.on('matchmaking:cancelled', () => {
        set({ ...initialState });
      });

      socket.on('matchmaking:error', (err: { message: string }) => {
        set({ status: 'error', error: err.message || 'Matchmaking error' });
      });
    } catch (err: any) {
      set({ status: 'error', error: err.message || 'Failed to connect for matchmaking' });
    }
  },

  startSearch: async (timeControl: string) => {
    set({ status: 'searching', timeControl, startedAt: Date.now(), error: null });

    try {
      await get().initMatchmakingListeners();
      const res = await socketService.joinMatchmaking(timeControl);

      if (res.matched && res.gameId) {
        set({
          status: 'matched',
          gameId: res.gameId,
        });
      }
    } catch (err: any) {
      set({
        status: 'error',
        error: err.message || 'Failed to join matchmaking queue',
      });
    }
  },

  cancelSearch: async () => {
    try {
      await socketService.cancelMatchmaking();
    } catch {
      // Ignore
    } finally {
      set({ ...initialState });
    }
  },

  resetMatchmaking: () => {
    set({ ...initialState });
  },
}));
