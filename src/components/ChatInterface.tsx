// ChatInterface.tsx - improved responsive + color fixes
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { useChat, useMessages } from '../utils/supabase/simpleChatHooks';
import { useAuth } from '../contexts/AuthContext';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
}

export default function ChatInterface({ isOpen, onClose, initialSubject }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { conversations, loading: conversationsLoading, getOrCreateConversation } = useChat(user?.id || '', false);
  const { messages, loading: messagesLoading, sendMessage, markAsRead } = useMessages(currentConversationId);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentConversationId && user?.id && messages.length > 0) {
      markAsRead(user.id);
    }
  }, [currentConversationId, user?.id, messages.length, markAsRead]);

  useEffect(() => {
    if (isOpen && user?.id && !currentConversationId) {
      handleInitializeChat();
    }
  }, [isOpen, user?.id, currentConversationId]);

  const handleInitializeChat = async () => {
    if (!user?.id) return;
    setIsConnecting(true);
    try {
      const conversation = await getOrCreateConversation(initialSubject || 'General Inquiry');
      if (conversation) {
        setCurrentConversationId(conversation.id);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentConversationId || !user?.id) return;
    const message = messageText.trim();
    setMessageText('');
    try {
      await sendMessage(user.id, message);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageText(message);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile-only backdrop - hide on medium screens and up */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container - uses CSS classes instead of inline positioning */}
      <div
        ref={containerRef}
        className="modal-floating"
        role="dialog"
        aria-label="Customer support chat"
        aria-modal="true"
        aria-labelledby="chat-support-title"
      >
        {/* Card using component class */}
        <div className="card-base text-neutral-900 dark:text-neutral-100">
          {/* Header */}
          <div
            id="chat-support-title"
            className="flex items-center justify-between px-4 py-3 bg-neutral-900 text-white sm:rounded-t-2xl border-b border-neutral-800 flex-shrink-0"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-neutral-800">
                <MessageCircle className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-semibold text-sm">Chat Support</h3>
                <div className="flex items-center gap-1" aria-live="polite">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden />
                  <p className="text-[11px] text-neutral-300">Online</p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-neutral-800/60 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4 text-neutral-200" />
            </button>
          </div>
          {/* Connection Status */}
          {isConnecting && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0">
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                <span className="text-xs">Connecting...</span>
              </div>
            </div>
          )}

          {/* Messages - flex-1 to take remaining space */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 bg-gradient-to-br from-neutral-100 via-neutral-50 to-purple-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
            {(conversationsLoading || messagesLoading) ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-900 dark:border-neutral-100 mx-auto mb-2" />
                  <p className="text-neutral-600 dark:text-neutral-300 text-sm">Loading chat...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center mt-6">
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-6 w-6 text-neutral-600 dark:text-neutral-300" />
                </div>
                <h4 className="font-medium text-neutral-800 dark:text-neutral-100 mb-1">Welcome to Rosémama!</h4>
                <p className="text-neutral-600 dark:text-neutral-300 text-sm">How can we help you today?</p>
              </div>
            ) : (
              messages.map((message: any) => (
                <MessageBubble
                  key={message.id}
                  content={message.content}
                  isOwnMessage={message.sender_id === user?.id}
                  timestamp={message.created_at}
                  isRead={message.is_read}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area - flex-shrink-0 to maintain size */}
          <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                disabled={!currentConversationId || isConnecting}
                aria-label="Type your message"
              />
              <button
                type="submit"
                disabled={!messageText.trim() || !currentConversationId || isConnecting}
                className="p-2 rounded-full bg-neutral-900 text-white hover:opacity-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Message Bubble (kept local) ---------- */

interface MessageBubbleProps {
  content: string;
  isOwnMessage: boolean;
  timestamp: string;
  isRead?: boolean;
}

function MessageBubble({ content, isOwnMessage, timestamp, isRead }: MessageBubbleProps) {
  // explicit pairs to avoid accidental white-on-white
  const ownBubbleClasses =
    'px-3 py-2 rounded-2xl shadow-sm bg-neutral-900 text-white border border-neutral-800 rounded-br-md';
  const otherBubbleClasses =
    'px-3 py-2 rounded-2xl shadow-sm bg-white/70 backdrop-blur-sm text-neutral-900 dark:bg-neutral-800/90 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-bl-md';

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[85%] ${isOwnMessage ? 'order-last' : 'order-first'}`}>
        <div className={isOwnMessage ? ownBubbleClasses : otherBubbleClasses}>
          <p className="text-sm leading-relaxed whitespace-pre-line break-words">{content}</p>
        </div>

        <div className={`flex items-center gap-1 mt-1 text-[11px] ${isOwnMessage ? 'justify-end text-neutral-500 dark:text-neutral-400' : 'justify-start text-neutral-500 dark:text-neutral-400'}`}>
          <span>{new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          {isOwnMessage && (
            <span className={`${isRead ? 'text-green-500' : 'text-neutral-400 dark:text-neutral-600'} ml-1`}>
              {isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
