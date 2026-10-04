export interface ChatSender {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ChatMessage {
  id: string;
  gameId: string;
  sender: ChatSender;
  message: string;
  createdAt: string | Date;
}
