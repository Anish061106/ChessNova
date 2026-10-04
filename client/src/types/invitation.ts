import { PlayerInfo } from './multiplayer';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface GameInvitation {
  id: string;
  senderId: string;
  receiverId: string;
  sender: PlayerInfo;
  receiver: PlayerInfo;
  timeControl: string;
  rated: boolean;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
}

export interface InvitationAcceptedPayload {
  gameId: string;
  color: 'white' | 'black';
  opponent: PlayerInfo;
  timeControl: string;
}
