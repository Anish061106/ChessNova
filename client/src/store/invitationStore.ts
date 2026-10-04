import { create } from 'zustand';
import { socketService } from '../services/socketService';
import { GameInvitation, InvitationAcceptedPayload } from '../types/invitation';
import { api } from '../services/api';

interface InvitationState {
  incomingInvitations: GameInvitation[];
  outgoingInvitations: GameInvitation[];
  activeIncomingChallenge: GameInvitation | null;
  acceptedGameRedirect: InvitationAcceptedPayload | null;
  isLoading: boolean;
  error: string | null;
}

interface InvitationActions {
  initInvitationListeners: () => Promise<void>;
  fetchInvitations: () => Promise<void>;
  sendChallenge: (receiverId: string, timeControl?: string) => Promise<GameInvitation>;
  acceptChallenge: (invitationId: string) => Promise<{ gameId: string; color: string }>;
  declineChallenge: (invitationId: string) => Promise<void>;
  cancelChallenge: (invitationId: string) => Promise<void>;
  dismissIncomingChallenge: () => void;
  clearAcceptedGameRedirect: () => void;
}

export const useInvitationStore = create<InvitationState & InvitationActions>((set, get) => ({
  incomingInvitations: [],
  outgoingInvitations: [],
  activeIncomingChallenge: null,
  acceptedGameRedirect: null,
  isLoading: false,
  error: null,

  initInvitationListeners: async () => {
    try {
      const socket = await socketService.connect();

      socket.off('invitation:received');
      socket.off('invitation:accepted');
      socket.off('invitation:declined');
      socket.off('invitation:cancelled');

      socket.on('invitation:received', (invitation: GameInvitation) => {
        set((state) => ({
          incomingInvitations: [invitation, ...state.incomingInvitations.filter((i) => i.id !== invitation.id)],
          activeIncomingChallenge: invitation,
        }));
      });

      socket.on('invitation:accepted', (payload: InvitationAcceptedPayload) => {
        set({
          acceptedGameRedirect: payload,
          activeIncomingChallenge: null,
        });
      });

      socket.on('invitation:declined', (data: { invitationId: string }) => {
        set((state) => ({
          outgoingInvitations: state.outgoingInvitations.map((i) =>
            i.id === data.invitationId ? { ...i, status: 'DECLINED' } : i
          ),
        }));
      });

      socket.on('invitation:cancelled', (data: { invitationId: string }) => {
        set((state) => ({
          incomingInvitations: state.incomingInvitations.map((i) =>
            i.id === data.invitationId ? { ...i, status: 'CANCELLED' } : i
          ),
          activeIncomingChallenge:
            state.activeIncomingChallenge?.id === data.invitationId ? null : state.activeIncomingChallenge,
        }));
      });
    } catch {
      // Ignore
    }
  },

  fetchInvitations: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/game-invitations');
      if (res.data?.success) {
        set({
          incomingInvitations: res.data.incoming || [],
          outgoingInvitations: res.data.outgoing || [],
        });
      }
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message || 'Failed to load challenges' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendChallenge: async (receiverId: string, timeControl = '5+3') => {
    set({ isLoading: true, error: null });
    try {
      await get().initInvitationListeners();
      const invitation = await socketService.sendInvitation(receiverId, timeControl);

      set((state) => ({
        outgoingInvitations: [invitation, ...state.outgoingInvitations.filter((i) => i.id !== invitation.id)],
      }));

      return invitation;
    } catch (err: any) {
      set({ error: err.message || 'Failed to send challenge' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  acceptChallenge: async (invitationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await socketService.acceptInvitation(invitationId);
      set({ activeIncomingChallenge: null });
      return result;
    } catch (err: any) {
      set({ error: err.message || 'Failed to accept challenge' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  declineChallenge: async (invitationId: string) => {
    try {
      await socketService.declineInvitation(invitationId);
      set((state) => ({
        incomingInvitations: state.incomingInvitations.map((i) =>
          i.id === invitationId ? { ...i, status: 'DECLINED' } : i
        ),
        activeIncomingChallenge:
          state.activeIncomingChallenge?.id === invitationId ? null : state.activeIncomingChallenge,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to decline challenge' });
    }
  },

  cancelChallenge: async (invitationId: string) => {
    try {
      await socketService.cancelInvitation(invitationId);
      set((state) => ({
        outgoingInvitations: state.outgoingInvitations.map((i) =>
          i.id === invitationId ? { ...i, status: 'CANCELLED' } : i
        ),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to cancel challenge' });
    }
  },

  dismissIncomingChallenge: () => set({ activeIncomingChallenge: null }),
  clearAcceptedGameRedirect: () => set({ acceptedGameRedirect: null }),
}));
