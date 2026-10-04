import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  Swords,
  Trash2,
  Check,
  Clock,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { friendApi } from '../services/friendApi';
import { FriendUser, FriendshipItem, FriendRequestItem } from '../types/friend';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ChallengePlayerModal } from '../components/multiplayer/ChallengePlayerModal';

export const Friends: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'find'>('friends');

  // Friends & Requests data
  const [friends, setFriends] = useState<FriendshipItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Challenge modal
  const [challengeTargetId, setChallengeTargetId] = useState<string | null>(null);

  // Action feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSocialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [friendsList, requestsData] = await Promise.all([
        friendApi.getFriends(),
        friendApi.getRequests(),
      ]);
      setFriends(friendsList);
      setIncomingRequests(requestsData.incoming);
      setOutgoingRequests(requestsData.outgoing);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSocialData();
  }, [loadSocialData]);

  // Handle live search
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchFeedback(null);

    try {
      const results = await friendApi.searchUsers(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchFeedback('No users found matching your search.');
      }
    } catch {
      setSearchFeedback('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    try {
      await friendApi.sendRequest(targetUserId);
      setActionSuccess('Friend request sent!');
      setTimeout(() => setActionSuccess(null), 3000);
      loadSocialData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to send request');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await friendApi.acceptRequest(friendshipId);
      setActionSuccess('Friend request accepted!');
      setTimeout(() => setActionSuccess(null), 3000);
      loadSocialData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to accept request');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      await friendApi.declineRequest(friendshipId);
      loadSocialData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to decline request');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      await friendApi.removeFriend(friendshipId);
      loadSocialData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove friend');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Friends & Community
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your chess network, accept challenges, and track companions.
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'friends'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Friends ({friends.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Requests ({incomingRequests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('find')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'find'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find Players</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{actionError}</span>
        </div>
      )}

      {/* TAB 1: FRIENDS LIST */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : friends.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Friends Added Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Search for other ChessNova players to add them as friends and send direct game challenges!
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setActiveTab('find')}
                className="gap-2 text-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Players</span>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {friends.map((item) => (
                <Card
                  key={item.friendshipId}
                  className="p-4 flex items-center justify-between gap-3 border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-500 text-white font-black flex items-center justify-center text-sm shadow-sm">
                      {item.friend.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        {item.friend.displayName || item.friend.username}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        @{item.friend.username}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setChallengeTargetId(item.friend.id)}
                      className="gap-1.5 text-xs shadow-nova"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Challenge</span>
                    </Button>
                    <button
                      onClick={() => handleRemoveFriend(item.friendshipId)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Remove friend"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Incoming Requests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Incoming Friend Requests ({incomingRequests.length})
            </h3>
            {incomingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No pending incoming requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incomingRequests.map((req) => (
                  <Card key={req.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-sm">
                        {req.requester?.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">
                          {req.requester?.displayName || req.requester?.username}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          wants to connect
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleAcceptRequest(req.id)}
                        className="px-2.5 py-1 text-xs gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineRequest(req.id)}
                        className="px-2.5 py-1 text-xs"
                      >
                        Decline
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sent Requests ({outgoingRequests.length})
            </h3>
            {outgoingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No outgoing requests waiting.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {outgoingRequests.map((req) => (
                  <Card key={req.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                        {req.receiver?.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">
                          {req.receiver?.displayName || req.receiver?.username}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Pending confirmation
                        </span>
                      </div>
                    </div>
                    <Badge variant="warning" size="sm">
                      Pending
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FIND PLAYERS */}
      {activeTab === 'find' && (
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players by username..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button size="sm" variant="primary" type="submit" disabled={isSearching} className="gap-2">
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search</span>
            </Button>
          </form>

          {searchFeedback && (
            <p className="text-xs text-slate-400 italic text-center py-4">{searchFeedback}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {searchResults.map((searchUser) => {
              const isAlreadyFriend = friends.some((f) => f.friend.id === searchUser.id);
              const hasSentRequest = outgoingRequests.some((r) => r.receiverId === searchUser.id);

              return (
                <Card
                  key={searchUser.id}
                  className="p-4 flex items-center justify-between gap-3 border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-brand-400 font-black flex items-center justify-center text-sm">
                      {searchUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        {searchUser.displayName || searchUser.username}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        @{searchUser.username}
                      </span>
                    </div>
                  </div>

                  {isAlreadyFriend ? (
                    <Badge variant="success" size="sm">
                      Friends
                    </Badge>
                  ) : hasSentRequest ? (
                    <Badge variant="warning" size="sm">
                      Requested
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSendRequest(searchUser.id)}
                      className="gap-1.5 text-xs shadow-nova"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Friend</span>
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenge Player Modal */}
      <ChallengePlayerModal
        isOpen={Boolean(challengeTargetId)}
        onClose={() => setChallengeTargetId(null)}
      />
    </div>
  );
};
