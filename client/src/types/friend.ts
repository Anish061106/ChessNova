export interface FriendUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  lastSeenAt?: string | null;
}

export interface FriendshipItem {
  friendshipId: string;
  friend: FriendUser;
  friendsSince: string;
}

export interface FriendRequestItem {
  id: string;
  requesterId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
  createdAt: string;
  requester?: FriendUser;
  receiver?: FriendUser;
}

export interface PendingRequestsResponse {
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
}
