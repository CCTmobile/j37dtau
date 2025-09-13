// Simple Chat Hooks - React hooks for messaging functionality
// This provides a clean interface for React components to use the chat system

import { useState, useEffect, useCallback } from 'react';
import RealTimeChatService from './realTimeChatService';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =======================================
// BASIC CHAT HOOK
// =======================================

export function useChat(userId: string, isAdmin: boolean = false) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await RealTimeChatService.getConversations(userId, isAdmin);
      setConversations(data);
      setError(null);
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin]);

  // Start a new conversation
  const startConversation = useCallback(async (subject?: string) => {
    try {
      const conversation = await RealTimeChatService.createConversation(userId, subject);
      if (conversation) {
        await loadConversations(); // Refresh list
        return conversation;
      }
      return null;
    } catch (err) {
      console.error('Error starting conversation:', err);
      return null;
    }
  }, [userId, loadConversations]);

  // Get or create conversation
  const getOrCreateConversation = useCallback(async (subject?: string) => {
    try {
      const conversation = await RealTimeChatService.getOrCreateConversation(userId, subject);
      if (conversation) {
        await loadConversations(); // Refresh list
        return conversation;
      }
      return null;
    } catch (err) {
      console.error('Error getting/creating conversation:', err);
      return null;
    }
  }, [userId, loadConversations]);

  // Initial load
  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [loadConversations, userId]);

  return {
    conversations,
    loading,
    error,
    refreshConversations: loadConversations,
    startConversation,
    getOrCreateConversation
  };
}

// =======================================
// MESSAGE HOOK FOR SPECIFIC CONVERSATION
// =======================================

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  // Load messages for conversation
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await RealTimeChatService.getMessages(conversationId);
      setMessages(data);
      setError(null);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Send a message
  const sendMessage = useCallback(async (
    senderId: string,
    content: string,
    messageType: string = 'text'
  ) => {
    if (!conversationId) return null;

    try {
      const message = await RealTimeChatService.sendMessage(
        conversationId,
        senderId,
        content,
        messageType
      );
      
      if (message) {
        // Add message to local state immediately for better UX
        setMessages(prev => [...prev, message]);
        return message;
      }
      return null;
    } catch (err) {
      console.error('Error sending message:', err);
      return null;
    }
  }, [conversationId]);

  // Mark messages as read
  const markAsRead = useCallback(async (userId: string) => {
    if (!conversationId) return false;

    try {
      return await RealTimeChatService.markMessagesAsRead(conversationId, userId);
    } catch (err) {
      console.error('Error marking messages as read:', err);
      return false;
    }
  }, [conversationId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Load initial messages
    loadMessages();

    // Set up real-time subscription
    const channel = RealTimeChatService.subscribeToMessages(
      conversationId,
      (payload) => {
        // New message received
        if (payload.eventType === 'INSERT' && payload.new) {
          setMessages(prev => {
            // Avoid duplicates
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (!exists) {
              return [...prev, payload.new];
            }
            return prev;
          });
        }
      },
      (payload) => {
        // Message updated (read status, etc.)
        if (payload.eventType === 'UPDATE' && payload.new) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? payload.new : msg
            )
          );
        }
      }
    );

    setSubscription(channel);

    // Cleanup
    return () => {
      if (channel) {
        RealTimeChatService.unsubscribe(`messages:${conversationId}`);
      }
    };
  }, [conversationId, loadMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    refreshMessages: loadMessages
  };
}

// =======================================
// UNREAD MESSAGES HOOK
// =======================================

export function useUnreadCount(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const count = await RealTimeChatService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error getting unread count:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refreshUnreadCount();

      // Refresh every 30 seconds
      const interval = setInterval(refreshUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, refreshUnreadCount]);

  return {
    unreadCount,
    loading,
    refreshUnreadCount
  };
}

// =======================================
// ADMIN HELPER HOOKS
// =======================================

export function useAdminChat() {
  const assignConversation = useCallback(async (conversationId: string, adminId: string) => {
    try {
      return await RealTimeChatService.assignConversation(conversationId, adminId);
    } catch (err) {
      console.error('Error assigning conversation:', err);
      return false;
    }
  }, []);

  const updateStatus = useCallback(async (
    conversationId: string, 
    status: 'open' | 'assigned' | 'resolved' | 'closed'
  ) => {
    try {
      return await RealTimeChatService.updateConversationStatus(conversationId, status);
    } catch (err) {
      console.error('Error updating conversation status:', err);
      return false;
    }
  }, []);

  const searchMessages = useCallback(async (query: string, conversationId?: string) => {
    try {
      return await RealTimeChatService.searchMessages(query, conversationId);
    } catch (err) {
      console.error('Error searching messages:', err);
      return [];
    }
  }, []);

  return {
    assignConversation,
    updateStatus,
    searchMessages
  };
}

export default {
  useChat,
  useMessages,
  useUnreadCount,
  useAdminChat
};