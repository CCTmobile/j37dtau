// React hooks for the messaging system
// Provides easy-to-use hooks for components to interact with the chat system

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RealTimeChatService from './chatService';
import type {
  ChatConversationWithRelations,
  ChatMessageWithRelations,
  UseChatReturn,
  UseConversationsReturn,
  UseMessagesReturn,
  CreateConversationInput,
  SendMessageInput,
  MessageType
} from './chatTypes';

// =======================================
// MAIN CHAT HOOK
// =======================================

export const useChat = (): UseChatReturn => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversationWithRelations[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversationWithRelations | null>(null);
  const [messages, setMessages] = useState<ChatMessageWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAdmin = (user as any)?.role === 'admin';

  // Load conversations on mount
  useEffect(() => {
    if (user?.id) {
      loadConversations();
      loadUnreadCount();
    }
  }, [user?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to conversations
    const conversationChannel = RealTimeChatService.subscribeToConversations(
      user.id,
      isAdmin,
      (updatedConversation) => {
        setConversations(prev => {
          const index = prev.findIndex(c => c.id === updatedConversation.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...updatedConversation };
            return updated;
          } else {
            return [updatedConversation as ChatConversationWithRelations, ...prev];
          }
        });
      }
    );

    // Subscribe to messages if there's an active conversation
    let messageChannel: any = null;
    if (activeConversation?.id) {
      messageChannel = RealTimeChatService.subscribeToMessages(
        activeConversation.id,
        (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
          // Update unread count if message is not from current user
          if (newMessage.sender_id !== user.id) {
            setUnreadCount(prev => prev + 1);
          }
        },
        (updatedMessage) => {
          setMessages(prev => prev.map(m => 
            m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
          ));
        }
      );
    }

    // Cleanup subscriptions
    return () => {
      RealTimeChatService.unsubscribeFromConversations(`conversations:${user.id}`);
      if (activeConversation?.id) {
        RealTimeChatService.unsubscribeFromMessages(`messages:${activeConversation.id}`);
      }
    };
  }, [user?.id, activeConversation?.id, isAdmin]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await RealTimeChatService.getConversations(user.id, isAdmin);
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await RealTimeChatService.getMessages(conversationId);
      setMessages(data);
      
      // Mark messages as read
      if (user?.id) {
        await RealTimeChatService.markMessagesAsRead(conversationId, user.id);
        await loadUnreadCount(); // Refresh unread count
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load total unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const count = await RealTimeChatService.getTotalUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, [user?.id]);

  // Set active conversation and load its messages
  const handleSetActiveConversation = useCallback((conversation: ChatConversationWithRelations | null) => {
    setActiveConversation(conversation);
    if (conversation?.id) {
      loadMessages(conversation.id);
    } else {
      setMessages([]);
    }
  }, [loadMessages]);

  // Send a message
  const sendMessage = useCallback(async (content: string, type: MessageType = 'text'): Promise<boolean> => {
    if (!user?.id || !activeConversation?.id || !content.trim()) {
      return false;
    }

    try {
      const message = await RealTimeChatService.sendMessage(
        activeConversation.id,
        user.id,
        content.trim(),
        type
      );

      if (message) {
        // Message will be added via real-time subscription
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [user?.id, activeConversation?.id]);

  // Create a new conversation
  const createConversation = useCallback(async (subject?: string, orderContext?: string) => {
    if (!user?.id) return;

    try {
      const conversation = await RealTimeChatService.createConversation(user.id, subject, orderContext);
      if (conversation) {
        // Refresh conversations list
        await loadConversations();
        // Set as active conversation
        setActiveConversation(conversation as ChatConversationWithRelations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    }
  }, [user?.id, loadConversations]);

  // Mark current conversation as read
  const markAsRead = useCallback(async () => {
    if (!user?.id || !activeConversation?.id) return;

    try {
      await RealTimeChatService.markMessagesAsRead(activeConversation.id, user.id);
      await loadUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [user?.id, activeConversation?.id, loadUnreadCount]);

  // Typing indicators
  const startTyping = useCallback(() => {
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  }, []);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    isOnline,
    unreadCount,
    setActiveConversation: handleSetActiveConversation,
    sendMessage,
    createConversation,
    markAsRead,
    isTyping,
    startTyping,
    stopTyping
  };
};

// =======================================
// CONVERSATIONS HOOK
// =======================================

export const useConversations = (limit: number = 20): UseConversationsReturn => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversationWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const isAdmin = (user as any)?.role === 'admin';

  const loadConversations = useCallback(async (reset: boolean = false) => {
    if (!user?.id || loading) return;

    setLoading(true);
    setError(null);

    try {
      const currentOffset = reset ? 0 : offset;
      const data = await RealTimeChatService.getConversations(user.id, isAdmin, limit, currentOffset);
      
      if (reset) {
        setConversations(data);
        setOffset(limit);
      } else {
        setConversations(prev => [...prev, ...data]);
        setOffset(prev => prev + limit);
      }
      
      setHasMore(data.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin, loading, offset, limit]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await loadConversations(false);
    }
  }, [hasMore, loading, loadConversations]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await loadConversations(true);
  }, [loadConversations]);

  const createConversation = useCallback(async (input: CreateConversationInput): Promise<ChatConversationWithRelations | null> => {
    try {
      const conversation = await RealTimeChatService.createConversation(
        input.customer_id,
        input.subject,
        input.order_id
      );
      
      if (conversation) {
        await refresh();
        return conversation as ChatConversationWithRelations;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      return null;
    }
  }, [refresh]);

  // Load conversations on mount
  useEffect(() => {
    if (user?.id) {
      loadConversations(true);
    }
  }, [user?.id]);

  return {
    conversations,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    createConversation
  };
};

// =======================================
// MESSAGES HOOK
// =======================================

export const useMessages = (conversationId: string | null, limit: number = 50): UseMessagesReturn => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadMessages = useCallback(async (reset: boolean = false) => {
    if (!conversationId || loading) return;

    setLoading(true);
    setError(null);

    try {
      const currentOffset = reset ? 0 : offset;
      const data = await RealTimeChatService.getMessages(conversationId, limit, currentOffset);
      
      if (reset) {
        setMessages(data);
        setOffset(limit);
      } else {
        // For messages, we want to prepend older messages
        setMessages(prev => [...data, ...prev]);
        setOffset(prev => prev + limit);
      }
      
      setHasMore(data.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, loading, offset, limit]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await loadMessages(false);
    }
  }, [hasMore, loading, loadMessages]);

  const sendMessage = useCallback(async (input: SendMessageInput): Promise<boolean> => {
    try {
      const message = await RealTimeChatService.sendMessage(
        input.conversation_id,
        input.sender_id,
        input.content,
        input.message_type,
        input.attachment_url,
        input.reply_to_message_id
      );
      
      return !!message;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, []);

  const markAsRead = useCallback(async () => {
    if (!conversationId || !user?.id) return;

    try {
      await RealTimeChatService.markMessagesAsRead(conversationId, user.id);
      // Update read status in local state
      setMessages(prev => prev.map(msg => 
        msg.sender_id !== user.id ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
      ));
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [conversationId, user?.id]);

  // Reset when conversation changes
  useEffect(() => {
    if (conversationId) {
      setOffset(0);
      setMessages([]);
      loadMessages(true);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = RealTimeChatService.subscribeToMessages(
      conversationId,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      },
      (updatedMessage) => {
        setMessages(prev => prev.map(m => 
          m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
        ));
      }
    );

    return () => {
      RealTimeChatService.unsubscribeFromMessages(`messages:${conversationId}`);
    };
  }, [conversationId]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMore,
    sendMessage,
    markAsRead
  };
};

// =======================================
// UNREAD COUNT HOOK
// =======================================

export const useUnreadCount = (): { count: number; refresh: () => Promise<void> } => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user?.id) return;

    try {
      const unreadCount = await RealTimeChatService.getTotalUnreadCount(user.id);
      setCount(unreadCount);
    } catch (err) {
      console.error('Failed to get unread count:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      refresh();
    }
  }, [user?.id, refresh]);

  return { count, refresh };
};
