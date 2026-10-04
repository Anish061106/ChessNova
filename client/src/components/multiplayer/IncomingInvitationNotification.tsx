import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Check, X, Loader2 } from 'lucide-react';
import { useInvitationStore } from '../../store/invitationStore';
import { Button } from '../ui/Button';

export const IncomingInvitationNotification: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeIncomingChallenge,
    acceptedGameRedirect,
    acceptChallenge,
    declineChallenge,
    dismissIncomingChallenge,
    clearAcceptedGameRedirect,
  } = useInvitationStore();

  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-redirect if accepted
  React.useEffect(() => {
    if (acceptedGameRedirect?.gameId) {
      const gameId = acceptedGameRedirect.gameId;
      clearAcceptedGameRedirect();
      navigate(`/online/${gameId}`);
    }
  }, [acceptedGameRedirect, navigate, clearAcceptedGameRedirect]);

  if (!activeIncomingChallenge) return null;

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const { gameId } = await acceptChallenge(activeIncomingChallenge.id);
      navigate(`/online/${gameId}`);
    } catch {
      // Handled in store
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await declineChallenge(activeIncomingChallenge.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const sender = activeIncomingChallenge.sender;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full p-4 rounded-2xl bg-white dark:bg-dark-card border border-brand-500/40 shadow-2xl shadow-brand-500/10 animate-slideUp">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {sender?.username?.substring(0, 2).toUpperCase() || 'OP'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500">
                Incoming Challenge
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {sender?.displayName || sender?.username || 'An opponent'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              wants to play a <span className="font-semibold text-slate-800 dark:text-slate-200">{activeIncomingChallenge.timeControl}</span> match.
            </p>
          </div>
        </div>

        <button
          onClick={dismissIncomingChallenge}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          disabled={isProcessing}
          onClick={handleAccept}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs gap-1.5 shadow-sm"
        >
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          <span>Accept</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isProcessing}
          onClick={handleDecline}
          className="flex-1 text-xs gap-1.5 border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
        >
          <X className="w-3.5 h-3.5" />
          <span>Decline</span>
        </Button>
      </div>
    </div>
  );
};
