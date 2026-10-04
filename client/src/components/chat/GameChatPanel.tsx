import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../../types/chat';
import { socketService } from '../../services/socketService';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../ui/Card';

interface GameChatPanelProps {
  gameId: string;
  isGameOver?: boolean;
}

export const GameChatPanel: React.FC<GameChatPanelProps> = ({ gameId }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect socket listeners and load history
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !gameId) return;

    // 1. Fetch chat history
    socket.emit('chat:history', { gameId }, (response: any) => {
      if (response?.success && Array.isArray(response.history)) {
        setMessages(response.history);
      }
    });

    // 2. Real-time message listener
    const handleIncomingMessage = (msg: ChatMessage) => {
      if (msg && msg.gameId === gameId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleChatError = (err: { message: string }) => {
      setError(err?.message || 'Failed to send message');
      setTimeout(() => setError(null), 4000);
    };

    socket.on('chat:message', handleIncomingMessage);
    socket.on('chat:error', handleChatError);

    return () => {
      socket.off('chat:message', handleIncomingMessage);
      socket.off('chat:error', handleChatError);
    };
  }, [gameId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || text.length > 500) return;

    const socket = socketService.getSocket();
    if (!socket) {
      setError('Not connected to game server');
      return;
    }

    socket.emit('chat:send', { gameId, message: text }, (response: any) => {
      if (!response?.success) {
        setError(response?.error || 'Message could not be delivered');
      }
    });

    setInputText('');
  };

  return (
    <Card className="p-4 border border-slate-200 dark:border-slate-800 flex flex-col h-80">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Game Chat
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {messages.length} {messages.length === 1 ? 'msg' : 'msgs'}
        </span>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 italic py-6">
            <p>No messages yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Say hello and wish good luck!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = user?.id === m.sender.id;
            const timeFormatted = new Date(m.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 mb-0.5 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {isMe ? 'You' : m.sender.displayName || m.sender.username}
                  </span>
                  <span>•</span>
                  <span>{timeFormatted}</span>
                </div>
                <div
                  className={`p-2.5 rounded-2xl max-w-[85%] break-words text-xs ${
                    isMe
                      ? 'bg-brand-500 text-white rounded-tr-none shadow-sm shadow-brand-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  {m.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 mt-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message..."
          maxLength={500}
          className="flex-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 transition-colors shrink-0"
          title="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </Card>
  );
};
