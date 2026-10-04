import React, { useState, useEffect } from 'react';
import { Search, Send, Loader2, Zap, Flame, Clock, Award } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { PlayerInfo } from '../../types/multiplayer';
import { useInvitationStore } from '../../store/invitationStore';

interface ChallengePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeSent?: (invitation: any) => void;
}

export const ChallengePlayerModal: React.FC<ChallengePlayerModalProps> = ({
  isOpen,
  onClose,
  onChallengeSent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlayerInfo | null>(null);
  const [selectedTimeControl, setSelectedTimeControl] = useState('5+3');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sendChallenge } = useInvitationStore();

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.data?.success) {
          setSearchResults(res.data.users || []);
        }
      } catch {
        // Ignore
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSend = async () => {
    if (!selectedUser) return;

    setIsSending(true);
    setError(null);

    try {
      const invitation = await sendChallenge(selectedUser.id, selectedTimeControl);
      onChallengeSent?.(invitation);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send challenge');
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Challenge a Player"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
            {error}
          </div>
        )}

        {/* 1. Opponent Selection */}
        {!selectedUser ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username or name..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-brand-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Results list */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {searchResults.length === 0 && searchQuery.trim().length >= 2 && !isSearching && (
                <p className="text-xs text-slate-400 text-center py-4 italic">
                  No players found matching "{searchQuery}"
                </p>
              )}

              {searchResults.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/60 flex items-center justify-between transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {u.displayName || u.username}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">@{u.username}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full">
                    Select
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {selectedUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {selectedUser.displayName || selectedUser.username}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">@{selectedUser.username}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-xs font-bold text-brand-500 hover:underline"
            >
              Change
            </button>
          </div>
        )}

        {/* 2. Time Control Selection */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Select Time Control
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '1+0', name: '1+0', cat: 'Bullet', icon: Zap },
              { id: '3+0', name: '3+0', cat: 'Blitz', icon: Flame },
              { id: '5+3', name: '5+3', cat: 'Blitz', icon: Flame },
              { id: '10+0', name: '10+0', cat: 'Rapid', icon: Clock },
              { id: '15+10', name: '15+10', cat: 'Rapid', icon: Clock },
              { id: '30+0', name: '30+0', cat: 'Classical', icon: Award },
            ].map(({ id, name, cat, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedTimeControl(id)}
                className={`p-2 rounded-xl border text-center transition-all ${
                  selectedTimeControl === id
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold ring-2 ring-brand-500/30'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                  <Icon className="w-3.5 h-3.5 text-brand-500" />
                  <span>{name}</span>
                </div>
                <span className="text-[9px] text-slate-400 uppercase">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedUser || isSending}
            onClick={handleSend}
            className="gap-2 shadow-nova"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Challenge</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
