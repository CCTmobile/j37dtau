// Real-time messaging service using Supabase
// Simplified version that works with existing TypeScript setup

import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =======================================
// TYPE DEFINITIONS
// =======================================

export interface ChatConversation {
  id: string;
  customer_id: string;
  admin_id: string | null;
  subject: string | null;
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  priority: 1 | 2 | 3;
  order_id: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  metadata: any;
  
  // Joined data
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
  };
  unread_count?: number;
  last_message?: ChatMessage;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'order_link' | 'system';
  attachment_url: string | null;
  attachment_type: string | null;
  is_read: boolean;
  read_at: string | null;
  whatsapp_message_id: string | null;
  reply_to_message_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
  
  // Joined data
  sender?: {
    id: string;
    name: string;
    email: string;
  };
  reply_to_message?: ChatMessage;
}

export interface ChatTemplate {
  id: string;
  admin_id: string;
  title: string;
  content: string;
  category: string;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerContactPreferences {
  id: string;
  user_id: string;
  whatsapp_number: string | null;
  preferred_contact_method: 'chat' | 'email' | 'whatsapp' | 'phone';
  timezone: string;
  business_hours_only: boolean;
  allow_marketing_messages: boolean;
  created_at: string;
  updated_at: string;
}

// =======================================
// CONVERSATION MANAGEMENT
// =======================================

export class RealTimeChatService {
  private static subscriptions: Map<string, RealtimeChannel> = new Map();

  // Create a new conversation
  static async createConversation(
    customerId: string,
    subject?: string,
    orderContext?: string
  ): Promise<ChatConversation | null> {
    try {
      const conversationData = {
        customer_id: customerId,
        subject: subject || 'General Inquiry',
        status: 'open' as const,
        priority: 2 as const,
        order_id: orderContext || null,
        last_message_at: new Date().toISOString(),
        metadata: orderContext ? { order_id: orderContext } : {}
      };

      const { data, error } = await (supabase as any)
        .from('chat_conversations')
        .insert(conversationData)
        .select(`
          *,
          customer:users!customer_id(id, name, email),
          admin:users!admin_id(id, name, email)
        `)
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      // Send welcome message
      if (data?.id) {
        await this.sendMessage(data.id, customerId, 
          'Hello! Thank you for contacting Rosémama support. How can we help you today?', 
          'system'
        );
      }

      return data as ChatConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  // Get conversations for a user (customer or admin)
  static async getConversations(
    userId: string, 
    isAdmin: boolean = false,
    limit: number = 20,
    offset: number = 0
  ): Promise<ChatConversation[]> {
    try {
      let query = (supabase as any)
        .from('chat_conversations')
        .select(`
          *,
          customer:users!customer_id(id, name, email),
          admin:users!admin_id(id, name, email)
        `)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (isAdmin) {
        // Admins can see all conversations or assigned ones
        query = query.or(`admin_id.eq.${userId},admin_id.is.null`);
      } else {
        // Customers only see their own conversations
        query = query.eq('customer_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      // Get unread count for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conversation: any) => {
          const unreadCount = await this.getUnreadMessageCount(conversation.id, userId);
          const lastMessage = await this.getLastMessage(conversation.id);
          
          return {
            ...conversation,
            unread_count: unreadCount,
            last_message: lastMessage
          } as ChatConversation;
        })
      );

      return conversationsWithUnread;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Get a specific conversation
  static async getConversation(conversationId: string): Promise<ChatConversation | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_conversations')
        .select(`
          *,
          customer:users!customer_id(id, name, email),
          admin:users!admin_id(id, name, email)
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return null;
      }

      return data as ChatConversation;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  }

  // Assign conversation to admin
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
      console.error('Error assigning conversation:', error);
      return false;
    }
  }

  // Update conversation status
  static async updateConversationStatus(
    conversationId: string, 
    status: ChatConversation['status']
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('chat_conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating conversation status:', error);
      return false;
    }
  }

  // =======================================
  // MESSAGE MANAGEMENT
  // =======================================

  // Send a message
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: ChatMessage['message_type'] = 'text',
    attachmentUrl?: string,
    replyToMessageId?: string
  ): Promise<ChatMessage | null> {
    try {
      const messageData = {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        attachment_url: attachmentUrl || null,
        reply_to_message_id: replyToMessageId || null,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {}
      };

      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .insert(messageData)
        .select(`
          *,
          sender:users!sender_id(id, name, email),
          reply_to_message:chat_messages!reply_to_message_id(id, content, sender_id)
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      // Update conversation last_message_at
      await (supabase as any)
        .from('chat_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data as ChatMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Get messages for a conversation
  static async getMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .select(`
          *,
          sender:users!sender_id(id, name, email),
          reply_to_message:chat_messages!reply_to_message_id(id, content, sender_id)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return (data || []) as ChatMessage[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Mark messages as read
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
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Get unread message count for a conversation
  static async getUnreadMessageCount(conversationId: string, userId: string): Promise<number> {
    try {
      const { count, error } = await (supabase as any)
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Get total unread message count for user
  static async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      // Get all user's conversations
      const { data: conversations } = await (supabase as any)
        .from('chat_conversations')
        .select('id')
        .eq('customer_id', userId);

      if (!conversations) return 0;

      let totalUnread = 0;
      for (const conv of conversations) {
        const count = await this.getUnreadMessageCount(conv.id, userId);
        totalUnread += count;
      }

      return totalUnread;
    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0;
    }
  }

  // Get last message for a conversation
  static async getLastMessage(conversationId: string): Promise<ChatMessage | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .select(`
          *,
          sender:users!sender_id(id, name, email)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching last message:', error);
        return null;
      }

      return (data || null) as ChatMessage | null;
    } catch (error) {
      console.error('Error fetching last message:', error);
      return null;
    }
  }

  // =======================================
  // REAL-TIME SUBSCRIPTIONS
  // =======================================

  // Subscribe to conversation updates
  static subscribeToConversations(
    userId: string,
    isAdmin: boolean,
    onUpdate: (conversation: any) => void
  ): RealtimeChannel {
    const channelName = `conversations:${userId}`;
    
    // Remove existing subscription if any
    this.unsubscribeFromConversations(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
          filter: isAdmin ? undefined : `customer_id=eq.${userId}`
        },
        (payload) => {
          console.log('Conversation update:', payload);
          onUpdate(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Subscribe to messages in a conversation
  static subscribeToMessages(
    conversationId: string,
    onNewMessage: (message: any) => void,
    onMessageUpdate: (message: any) => void
  ): RealtimeChannel {
    const channelName = `messages:${conversationId}`;
    
    // Remove existing subscription if any
    this.unsubscribeFromMessages(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('New message:', payload);
          // Fetch complete message data with joins
          const { data } = await (supabase as any)
            .from('chat_messages')
            .select(`
              *,
              sender:users!sender_id(id, name, email),
              reply_to_message:chat_messages!reply_to_message_id(id, content, sender_id)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            onNewMessage(data);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          onMessageUpdate(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Unsubscribe from conversations
  static unsubscribeFromConversations(channelName: string): void {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  // Unsubscribe from messages
  static unsubscribeFromMessages(channelName: string): void {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  // Unsubscribe from all
  static unsubscribeFromAll(): void {
    this.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }

  // =======================================
  // TEMPLATE MANAGEMENT
  // =======================================

  // Get chat templates for admin
  static async getChatTemplates(adminId: string): Promise<ChatTemplate[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_templates')
        .select('*')
        .or(`admin_id.eq.${adminId},is_shared.eq.true`)
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }

      return (data || []) as ChatTemplate[];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  // Create chat template
  static async createChatTemplate(
    adminId: string,
    title: string,
    content: string,
    category: string = 'general',
    isShared: boolean = false
  ): Promise<ChatTemplate | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_templates')
        .insert({
          admin_id: adminId,
          title,
          content,
          category,
          is_shared: isShared,
          usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        return null;
      }

      return data as ChatTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      return null;
    }
  }

  // Update template usage count
  static async incrementTemplateUsage(templateId: string): Promise<void> {
    try {
      // Get current usage count
      const { data: template } = await (supabase as any)
        .from('chat_templates')
        .select('usage_count')
        .eq('id', templateId)
        .single();

      if (template) {
        await (supabase as any)
          .from('chat_templates')
          .update({ usage_count: template.usage_count + 1 })
          .eq('id', templateId);
      }
    } catch (error) {
      console.error('Error updating template usage:', error);
    }
  }

  // =======================================
  // CONTACT PREFERENCES
  // =======================================

  // Get customer contact preferences
  static async getContactPreferences(userId: string): Promise<CustomerContactPreferences | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('customer_contact_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching contact preferences:', error);
        return null;
      }

      return (data || null) as CustomerContactPreferences | null;
    } catch (error) {
      console.error('Error fetching contact preferences:', error);
      return null;
    }
  }

  // Update contact preferences
  static async updateContactPreferences(
    userId: string,
    preferences: Partial<CustomerContactPreferences>
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('customer_contact_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating contact preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating contact preferences:', error);
      return false;
    }
  }

  // =======================================
  // ADMIN UTILITIES
  // =======================================

  // Get admin conversation statistics
  static async getAdminStats(adminId?: string): Promise<{
    total_conversations: number;
    open_conversations: number;
    assigned_conversations: number;
    resolved_today: number;
    avg_response_time: number;
  }> {
    try {
      const stats = {
        total_conversations: 0,
        open_conversations: 0,
        assigned_conversations: 0,
        resolved_today: 0,
        avg_response_time: 0
      };

      // Get total conversations
      const { count: total } = await (supabase as any)
        .from('chat_conversations')
        .select('*', { count: 'exact', head: true });
      
      stats.total_conversations = total || 0;

      // Get open conversations
      const { count: open } = await (supabase as any)
        .from('chat_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      
      stats.open_conversations = open || 0;

      // Get assigned conversations
      const { count: assigned } = await (supabase as any)
        .from('chat_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'assigned');
      
      stats.assigned_conversations = assigned || 0;

      // Get resolved today
      const today = new Date().toISOString().split('T')[0];
      const { count: resolved } = await (supabase as any)
        .from('chat_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('updated_at', `${today}T00:00:00.000Z`);
      
      stats.resolved_today = resolved || 0;

      return stats;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        total_conversations: 0,
        open_conversations: 0,
        assigned_conversations: 0,
        resolved_today: 0,
        avg_response_time: 0
      };
    }
  }
}

export default RealTimeChatService;