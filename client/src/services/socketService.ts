import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;

  /**
   * Get or initialize Socket.IO instance
   */
  public getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_SERVER_URL, {
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });
    }
    return this.socket;
  }

  /**
   * Connect to Socket.IO gateway
   */
  public connect(): Promise<Socket> {
    const socket = this.getSocket();
    if (socket.connected) {
      return Promise.resolve(socket);
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        socket.once('connect', () => resolve(socket));
      });
    }

    this.isConnecting = true;
    socket.connect();

    return new Promise((resolve, reject) => {
      const onConnect = () => {
        this.isConnecting = false;
        socket.off('connect_error', onError);
        resolve(socket);
      };

      const onError = (err: Error) => {
        this.isConnecting = false;
        socket.off('connect', onConnect);
        reject(err);
      };

      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
    });
  }

  /**
   * Disconnect socket cleanly
   */
  public disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  /**
   * Create online game
   */
  public createGame(timeControl = '5+3'): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit('game:create', { timeControl }, (res: { success: boolean; gameId?: string; error?: string }) => {
        if (res.success && res.gameId) {
          resolve(res.gameId);
        } else {
          reject(new Error(res.error || 'Failed to create game'));
        }
      });
    });
  }

  /**
   * Join an online game
   */
  public joinGame(gameId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit('game:join', { gameId }, (res: { success: boolean; error?: string }) => {
        if (res.success) {
          resolve();
        } else {
          reject(new Error(res.error || 'Failed to join game'));
        }
      });
    });
  }

  /**
   * Reconnect to an online game
   */
  public reconnectGame(gameId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit('game:reconnect', { gameId }, (res: { success: boolean; error?: string }) => {
        if (res.success) {
          resolve();
        } else {
          reject(new Error(res.error || 'Failed to reconnect'));
        }
      });
    });
  }

  /**
   * Submit a move to the server
   */
  public makeMove(gameId: string, from: string, to: string, promotion = 'q'): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit(
        'game:move',
        { gameId, from, to, promotion },
        (res: { success: boolean; error?: string }) => {
          if (res?.success) {
            resolve();
          } else {
            reject(new Error(res?.error || 'Illegal move'));
          }
        }
      );
    });
  }

  /**
   * Resign active game
   */
  public resign(gameId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit('game:resign', { gameId }, (res: { success: boolean; error?: string }) => {
        if (res?.success) {
          resolve();
        } else {
          reject(new Error(res?.error || 'Failed to resign'));
        }
      });
    });
  }

  /**
   * Offer Draw
   */
  public offerDraw(gameId: string) {
    this.getSocket().emit('game:offer-draw', { gameId });
  }

  /**
   * Accept Draw
   */
  public acceptDraw(gameId: string) {
    this.getSocket().emit('game:accept-draw', { gameId });
  }

  /**
   * Decline Draw
   */
  public declineDraw(gameId: string) {
    this.getSocket().emit('game:decline-draw', { gameId });
  }

  /**
   * ==========================================
   * MATCHMAKING METHODS
   * ==========================================
   */
  public joinMatchmaking(timeControl = '5+3'): Promise<{ matched: boolean; gameId?: string; color?: string }> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit(
        'matchmaking:join',
        { timeControl },
        (res: { success: boolean; matched?: boolean; gameId?: string; color?: string; error?: string }) => {
          if (res?.success) {
            resolve({ matched: Boolean(res.matched), gameId: res.gameId, color: res.color });
          } else {
            reject(new Error(res?.error || 'Failed to enter matchmaking'));
          }
        }
      );
    });
  }

  public cancelMatchmaking(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit('matchmaking:cancel', {}, (res: { success: boolean; error?: string }) => {
        if (res?.success) {
          resolve();
        } else {
          reject(new Error(res?.error || 'Failed to cancel matchmaking'));
        }
      });
    });
  }

  /**
   * ==========================================
   * GAME INVITATION METHODS
   * ==========================================
   */
  public sendInvitation(receiverId: string, timeControl = '5+3'): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit(
        'invitation:send',
        { receiverId, timeControl },
        (res: { success: boolean; invitation?: any; error?: string }) => {
          if (res?.success && res.invitation) {
            resolve(res.invitation);
          } else {
            reject(new Error(res?.error || 'Failed to send challenge'));
          }
        }
      );
    });
  }

  public acceptInvitation(invitationId: string): Promise<{ gameId: string; color: string }> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit(
        'invitation:accept',
        { invitationId },
        (res: { success: boolean; gameId?: string; color?: string; error?: string }) => {
          if (res?.success && res.gameId) {
            resolve({ gameId: res.gameId, color: res.color || 'white' });
          } else {
            reject(new Error(res?.error || 'Failed to accept challenge'));
          }
        }
      );
    });
  }

  public declineInvitation(invitationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit(
        'invitation:decline',
        { invitationId },
        (res: { success: boolean; error?: string }) => {
          if (res?.success) {
            resolve();
          } else {
            reject(new Error(res?.error || 'Failed to decline challenge'));
          }
        }
      );
    });
  }

  public cancelInvitation(invitationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit(
        'invitation:cancel',
        { invitationId },
        (res: { success: boolean; error?: string }) => {
          if (res?.success) {
            resolve();
          } else {
            reject(new Error(res?.error || 'Failed to cancel challenge'));
          }
        }
      );
    });
  }
}

export const socketService = new SocketService();

