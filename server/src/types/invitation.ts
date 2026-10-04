import { InvitationStatus } from '@prisma/client';
import { PlayerInfo } from './game.js';

export interface GameInvitationDto {
  id: string;
  senderId: string;
  receiverId: string;
  sender: PlayerInfo;
  receiver: PlayerInfo;
  timeControl: string;
  rated: boolean;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateInvitationInput {
  receiverId: string;
  timeControl?: string;
  rated?: boolean;
}
