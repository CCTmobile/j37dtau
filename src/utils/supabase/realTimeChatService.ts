// Simplified Chat Service - Real-time messaging infrastructure
// This version focuses on core functionality with proper TypeScript support

import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =======================================
// SIMPLIFIED TYPE DEFINITIONS
// =======================================

export interface SimpleChatConversation {
  id: string;
  customer_id: string;
  admin_id: string | null;
  subject: string | null;
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  priority: number;
  order_id: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface SimpleChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  attachment_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// =======================================
// REAL-TIME MESSAGING SERVICE
// =======================================

export class RealTimeChatService {
  private static subscriptions = new Map<string, RealtimeChannel>();

  // =======================================
  // CONVERSATION MANAGEMENT
  // =======================================

  static async createConversation(customerId: string, subject?: string): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_conversations')
        .insert({
          customer_id: customerId,
          subject: subject || 'General Inquiry',
          status: 'open',
          priority: 2
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createConversation:', error);
      return null;
    }
  }

  static async getConversations(userId: string, isAdmin: boolean = false): Promise<any[]> {
    try {
      let query = (supabase as any)
        .from('chat_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('customer_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConversations:', error);
      return [];
    }
  }

  // =======================================
  // MESSAGE MANAGEMENT
  // =======================================

  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: string = 'text'
  ): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }

  static async getMessages(conversationId: string): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  }

  static async markMessagesAsRead(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('chat_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      return false;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      // Get all conversations for the user
      const conversations = await this.getConversations(userId, false);
      
      if (conversations.length === 0) return 0;

      const conversationIds = conversations.map(c => c.id);

      const { count, error } = await (supabase as any)
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  // =======================================
  // REAL-TIME SUBSCRIPTIONS
  // =======================================

  static subscribeToConversations(
    userId: string,
    onUpdate: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `conversations:${userId}`;
    
    // Remove existing subscription
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations'
        },
        (payload) => {
          console.log('Conversation update:', payload);
          onUpdate(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  static subscribeToMessages(
    conversationId: string,
    onNewMessage: (payload: any) => void,
    onMessageUpdate?: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `messages:${conversationId}`;
    
    // Remove existing subscription
    this.unsubscribe(channelName);

    let channelBuilder = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('New message:', payload);
          onNewMessage(payload);
        }
      );

    if (onMessageUpdate) {
      channelBuilder = channelBuilder.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          onMessageUpdate(payload);
        }
      );
    }

    const channel = channelBuilder.subscribe();

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  static unsubscribe(channelName: string): void {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  static unsubscribeAll(): void {
    this.subscriptions.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }

  // =======================================
  // ADMIN HELPERS
  // =======================================

  static async assignConversation(conversationId: string, adminId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('chat_conversations')
        .update({
          admin_id: adminId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error assigning conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in assignConversation:', error);
      return false;
    }
  }

  static async updateConversationStatus(
    conversationId: string,
    status: 'open' | 'assigned' | 'resolved' | 'closed'
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('chat_conversations')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateConversationStatus:', error);
      return false;
    }
  }

  // =======================================
  // UTILITY FUNCTIONS
  // =======================================

  static async getOrCreateConversation(customerId: string, subject?: string): Promise<any> {
    try {
      // First, try to find an existing open conversation
      const { data: existingConversations, error: fetchError } = await (supabase as any)
        .from('chat_conversations')
        .select('*')
        .eq('customer_id', customerId)
        .in('status', ['open', 'assigned'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching existing conversations:', fetchError);
        return null;
      }

      if (existingConversations && existingConversations.length > 0) {
        return existingConversations[0];
      }

      // Create new conversation if none exists
      return await this.createConversation(customerId, subject);
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return null;
    }
  }

  static async searchMessages(query: string, conversationId?: string): Promise<any[]> {
    try {
      let searchQuery = (supabase as any)
        .from('chat_messages')
        .select('*')
        .textSearch('content', query);

      if (conversationId) {
        searchQuery = searchQuery.eq('conversation_id', conversationId);
      }

      const { data, error } = await searchQuery
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error searching messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchMessages:', error);
      return [];
    }
  }
}

export default RealTimeChatService;