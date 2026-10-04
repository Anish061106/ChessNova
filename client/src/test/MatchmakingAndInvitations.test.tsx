import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MatchmakingQueueModal } from '../components/multiplayer/MatchmakingQueueModal';
import { ChallengePlayerModal } from '../components/multiplayer/ChallengePlayerModal';
import { IncomingInvitationNotification } from '../components/multiplayer/IncomingInvitationNotification';
import { useMatchmakingStore } from '../store/matchmakingStore';
import { useInvitationStore } from '../store/invitationStore';
import { socketService } from '../services/socketService';

describe('ChessNova Phase 7 — Matchmaking & Invitations Frontend Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Matchmaking Queue Modal', () => {
    it('renders searching indicator, time control, and cancel button', () => {
      useMatchmakingStore.setState({
        status: 'searching',
        timeControl: '5+3',
        startedAt: Date.now() - 5000,
        gameId: null,
      });

      const onCancel = vi.fn();

      render(
        <MatchmakingQueueModal
          isOpen={true}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText(/Finding Opponent\.\.\./i)).toBeInTheDocument();
      expect(screen.getAllByText(/5\+3/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /Cancel Search/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Cancel Search/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Challenge Player Modal', () => {
    it('renders player search input and time controls', () => {
      const onClose = vi.fn();

      render(
        <ChallengePlayerModal
          isOpen={true}
          onClose={onClose}
        />
      );

      expect(screen.getByPlaceholderText(/Search username or name\.\.\./i)).toBeInTheDocument();
      expect(screen.getByText(/Select Time Control/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Challenge/i })).toBeDisabled();
    });
  });

  describe('Incoming Challenge Notification', () => {
    it('renders incoming challenge popup with Accept and Decline actions', async () => {
      const mockInvitation = {
        id: 'inv-realtime-1',
        senderId: 'user-sender',
        receiverId: 'user-me',
        sender: {
          id: 'user-sender',
          username: 'HikaruNakamura',
          displayName: 'Hikaru Nakamura',
          avatarUrl: null,
        },
        receiver: {
          id: 'user-me',
          username: 'ChessMaster',
          displayName: 'Chess Master',
          avatarUrl: null,
        },
        timeControl: '5+3',
        rated: false,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 300000).toISOString(),
      };

      useInvitationStore.setState({
        activeIncomingChallenge: mockInvitation,
      });

      vi.spyOn(socketService, 'acceptInvitation').mockResolvedValue({
        gameId: 'matched-game-789',
        color: 'white',
      });

      render(
        <BrowserRouter>
          <IncomingInvitationNotification />
        </BrowserRouter>
      );

      expect(screen.getByText(/Incoming Challenge/i)).toBeInTheDocument();
      expect(screen.getByText(/Hikaru Nakamura/i)).toBeInTheDocument();
      expect(screen.getByText(/5\+3/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
    });
  });
});
