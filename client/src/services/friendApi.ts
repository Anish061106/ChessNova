import { FriendUser, FriendshipItem, PendingRequestsResponse } from '../types/friend';

const API_BASE = '/api/friends';

export const friendApi = {
  /**
   * Search users safely by username or displayName
   */
  async searchUsers(query: string): Promise<FriendUser[]> {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
      credentials: 'include',
    });
    const data = await res.json();
    return data.data || [];
  },

  /**
   * List all accepted friends
   */
  async getFriends(): Promise<FriendshipItem[]> {
    const res = await fetch(API_BASE, {
      credentials: 'include',
    });
    const data = await res.json();
    return data.data || [];
  },

  /**
   * List incoming and outgoing pending friend requests
   */
  async getRequests(): Promise<PendingRequestsResponse> {
    const res = await fetch(`${API_BASE}/requests`, {
      credentials: 'include',
    });
    const data = await res.json();
    return data.data || { incoming: [], outgoing: [] };
  },

  /**
   * Send a friend request
   */
  async sendRequest(receiverId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ receiverId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send friend request');
    }
    return data.data;
  },

  /**
   * Accept a friend request
   */
  async acceptRequest(friendshipId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/requests/${friendshipId}/accept`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to accept friend request');
    }
    return data.data;
  },

  /**
   * Decline a friend request
   */
  async declineRequest(friendshipId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/requests/${friendshipId}/decline`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to decline friend request');
    }
  },

  /**
   * Remove an existing friend
   */
  async removeFriend(friendshipId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${friendshipId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to remove friend');
    }
  },

  /**
   * Block a user
   */
  async blockUser(targetUserId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ targetUserId }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to block user');
    }
  },
};
