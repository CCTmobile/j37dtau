// Type definitions for the messaging system
// This file extends the existing database types with chat-specific interfaces

// Re-export main database type
export type { Database } from './types';

// =======================================
// CHAT SYSTEM TYPES
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
  metadata: Record<string, any>;
}

export interface ChatConversationWithRelations extends ChatConversation {
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
  metadata: Record<string, any>;
}

export interface ChatMessageWithRelations extends ChatMessage {
  sender?: {
    id: string;
    name: string;
    email: string;
  };
  reply_to_message?: {
    id: string;
    content: string;
    sender_id: string;
  };
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

export interface WhatsAppMessage {
  id: string;
  chat_message_id: string;
  whatsapp_message_id: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  webhook_data: Record<string, any> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// =======================================
// API RESPONSE TYPES
// =======================================

export interface ChatServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface ConversationListResponse {
  conversations: ChatConversationWithRelations[];
  total: number;
  hasMore: boolean;
}

export interface MessageListResponse {
  messages: ChatMessageWithRelations[];
  total: number;
  hasMore: boolean;
}

// =======================================
// INPUT TYPES
// =======================================

export interface CreateConversationInput {
  customer_id: string;
  subject?: string;
  order_id?: string;
  priority?: 1 | 2 | 3;
}

export interface SendMessageInput {
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type?: ChatMessage['message_type'];
  attachment_url?: string;
  attachment_type?: string;
  reply_to_message_id?: string;
}

export interface CreateTemplateInput {
  admin_id: string;
  title: string;
  content: string;
  category?: string;
  is_shared?: boolean;
}

export interface UpdateContactPreferencesInput {
  user_id: string;
  whatsapp_number?: string | null;
  preferred_contact_method?: CustomerContactPreferences['preferred_contact_method'];
  timezone?: string;
  business_hours_only?: boolean;
  allow_marketing_messages?: boolean;
}

// =======================================
// REAL-TIME EVENT TYPES
// =======================================

export interface RealtimeConversationEvent {
  type: 'conversation_created' | 'conversation_updated' | 'conversation_assigned';
  conversation: ChatConversationWithRelations;
  timestamp: string;
}

export interface RealtimeMessageEvent {
  type: 'message_sent' | 'message_read' | 'message_updated';
  message: ChatMessageWithRelations;
  conversation_id: string;
  timestamp: string;
}

export interface TypingEvent {
  type: 'typing_start' | 'typing_stop';
  conversation_id: string;
  user_id: string;
  user_name: string;
  timestamp: string;
}

// =======================================
// UTILITY TYPES
// =======================================

export type ConversationStatus = ChatConversation['status'];
export type MessageType = ChatMessage['message_type'];
export type ContactMethod = CustomerContactPreferences['preferred_contact_method'];
export type ConversationPriority = ChatConversation['priority'];

// =======================================
// HOOK RETURN TYPES
// =======================================

export interface UseConversationsReturn {
  conversations: ChatConversationWithRelations[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  createConversation: (input: CreateConversationInput) => Promise<ChatConversation | null>;
}

export interface UseMessagesReturn {
  messages: ChatMessageWithRelations[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sendMessage: (input: SendMessageInput) => Promise<boolean>;
  markAsRead: () => Promise<void>;
}

export interface UseChatReturn {
  // Conversations
  conversations: ChatConversationWithRelations[];
  activeConversation: ChatConversationWithRelations | null;
  
  // Messages
  messages: ChatMessageWithRelations[];
  
  // State
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  unreadCount: number;
  
  // Actions
  setActiveConversation: (conversation: ChatConversationWithRelations | null) => void;
  sendMessage: (content: string, type?: MessageType) => Promise<boolean>;
  createConversation: (subject?: string, orderContext?: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  
  // Real-time
  isTyping: boolean;
  startTyping: () => void;
  stopTyping: () => void;
}