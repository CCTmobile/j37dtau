# Real-Time Messaging System - Component Architecture

## Overview
This document outlines the React component structure for implementing a real-time messaging system in the Rosémama e-commerce platform, with beautiful gradient-themed UI components that match the existing design system.

## Component Hierarchy

```
src/components/messaging/
├── ChatSystem.tsx              // Main chat system manager
├── ChatInterface.tsx           // Customer chat interface
├── AdminChatDashboard.tsx      // Admin messaging dashboard
├── MessageBubble.tsx           // Individual message component
├── MessageInput.tsx            // Message composition area
├── ConversationList.tsx        // List of conversations
├── ConversationItem.tsx        // Single conversation preview
├── QuickReplyTemplates.tsx     // Admin quick reply system
├── ChatNotificationBell.tsx    // Notification bell with count
├── ChatModal.tsx               // Modal chat interface
├── WhatsAppButton.tsx          // WhatsApp integration button
├── MessageAttachment.tsx       // File/image attachments
├── TypingIndicator.tsx         // Show when someone is typing
├── ChatSearchBar.tsx           // Search conversations/messages
└── ChatSettings.tsx            // Chat preferences and settings
```

## Core Components

### 1. ChatSystem.tsx
**Purpose**: Main orchestrator for the entire chat system
**Features**:
- Real-time subscription management
- State management for all chat data
- Authentication checks
- Route to appropriate interface (customer vs admin)

```typescript
interface ChatSystemProps {
  currentUser: User;
  onNotificationClick?: () => void;
}

// Features:
// - Automatic conversation creation for first-time users
// - Real-time message synchronization
// - Connection status indicators
// - Error handling and retry logic
```

### 2. ChatInterface.tsx
**Purpose**: Customer-facing chat interface
**Design**: Beautiful modal with gradient header matching brand colors
**Features**:
- Floating chat button (bottom-right corner)
- Expandable modal interface
- Message history with infinite scroll
- File upload capabilities
- Typing indicators
- Connection status

```typescript
interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  initialMessage?: string;
  orderContext?: Order; // Auto-populate if coming from order page
}

// Gradient theme: bg-gradient-to-r from-rose-500 to-pink-600
// Modal size: 400px width, 600px height on desktop
// Mobile: Full screen overlay
```

### 3. AdminChatDashboard.tsx
**Purpose**: Admin interface for managing customer conversations
**Integration**: 7th tab in existing AdminDashboard
**Features**:
- Conversation list with status indicators
- Multi-conversation management
- Quick reply templates
- Customer information sidebar
- Message search and filtering
- Performance metrics

```typescript
interface AdminChatDashboardProps {
  onConversationSelect: (conversationId: string) => void;
  selectedConversationId?: string;
}

// Layout:
// - Left sidebar: Conversation list (30%)
// - Center: Active conversation (50%)
// - Right sidebar: Customer info + templates (20%)
```

### 4. MessageBubble.tsx
**Purpose**: Individual message display component
**Design**: Modern chat bubbles with gradients
**Features**:
- Sender/receiver styling
- Timestamp display
- Read status indicators
- Attachment previews
- Reply functionality

```typescript
interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReply?: (message: ChatMessage) => void;
}

// Styling:
// Own messages: bg-gradient-to-r from-rose-500 to-pink-600
// Other messages: bg-gray-100 text-gray-900
// Rounded corners with appropriate positioning
```

### 5. MessageInput.tsx
**Purpose**: Message composition area
**Features**:
- Rich text input
- File attachment
- Emoji picker (optional)
- Send button with loading state
- Character count
- Draft auto-save

```typescript
interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  allowAttachments?: boolean;
}

// Features:
// - Auto-resize textarea
// - Keyboard shortcuts (Ctrl+Enter to send)
// - File drag & drop
// - Attachment preview before sending
```

## Integration Points

### 1. Header Component Update
Add chat notification bell to existing header:

```typescript
// src/components/Header.tsx - Add to existing component
<ChatNotificationBell
  unreadCount={unreadMessageCount}
  onClick={() => setShowChatInterface(true)}
  className="ml-2"
/>
```

### 2. Footer Component Update
Replace "Contact Us" button with chat trigger:

```typescript
// src/components/Footer.tsx - Update existing button
<button 
  onClick={() => openChatInterface('general')}
  className="hover:text-white transition-colors flex items-center gap-2"
>
  <MessageCircle className="h-3 w-3" />
  Live Chat
</button>
```

### 3. BottomNav Component Update
Add chat icon to bottom navigation:

```typescript
// src/components/BottomNav.tsx - Add new nav item
{ id: 'chat', label: 'Support', icon: MessageCircle, badge: unreadCount }
```

### 4. AdminDashboard Integration
Add new tab to existing dashboard:

```typescript
// src/components/AdminDashboard.tsx - Add 7th tab
<TabsTrigger value="messages" className="data-[state=active]:bg-background">
  Messages {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
</TabsTrigger>

<TabsContent value="messages">
  <AdminChatDashboard />
</TabsContent>
```

## Context and State Management

### 1. ChatContext.tsx
**Purpose**: Manage global chat state
**Features**:
- Real-time subscriptions
- Message caching
- Conversation management
- Notification handling

```typescript
interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  unreadCount: number;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  createConversation: (subject?: string, orderContext?: string) => Promise<string>;
  isOnline: boolean;
  isTyping: boolean;
  setTyping: (typing: boolean) => void;
}
```

### 2. Real-time Hooks
**Purpose**: Custom hooks for Supabase real-time integration

```typescript
// useRealTimeMessages.ts
export const useRealTimeMessages = (conversationId: string) => {
  // Subscribe to new messages
  // Handle message updates
  // Manage typing indicators
};

// useRealTimeConversations.ts
export const useRealTimeConversations = (userId: string, isAdmin: boolean) => {
  // Subscribe to conversation updates
  // Handle new conversations
  // Manage conversation status changes
};
```

## Styling and Theme Integration

### 1. Gradient Theme Consistency
All chat components will use the existing gradient system:

```css
/* Primary gradients */
.chat-header: bg-gradient-to-r from-rose-500 to-pink-600
.admin-header: bg-gradient-to-r from-blue-500 to-purple-600
.message-sent: bg-gradient-to-r from-rose-500 to-pink-600
.message-received: bg-gray-100

/* Status indicators */
.status-online: bg-gradient-to-r from-green-400 to-green-600
.status-typing: bg-gradient-to-r from-yellow-400 to-orange-500
.status-offline: bg-gray-400
```

### 2. Responsive Design
- **Desktop**: Modal overlay (400x600px)
- **Tablet**: Slide-in panel (350px width)
- **Mobile**: Full-screen overlay
- **Admin Dashboard**: Full tab content area

### 3. Accessibility Features
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management for modals

## Performance Optimization

### 1. Message Virtualization
For long conversation histories:
- Implement virtual scrolling
- Lazy load messages on scroll
- Cache frequently accessed conversations

### 2. Real-time Optimization
- Debounced typing indicators
- Message batching for high-volume conversations
- Connection retry logic with exponential backoff

### 3. Caching Strategy
- Local storage for draft messages
- IndexedDB for offline message storage
- Memory cache for active conversations

## Security Considerations

### 1. Content Sanitization
- HTML sanitization for message content
- File type validation for attachments
- Image compression for uploads

### 2. Authentication Checks
- Verify user permissions before showing chat
- Validate conversation access rights
- Rate limiting for message sending

### 3. Privacy Features
- Message encryption in transit
- Automatic message deletion options
- GDPR compliance for data handling

## Implementation Phases

### Phase 1: Core Infrastructure
1. ChatContext and real-time hooks
2. Basic ChatInterface and MessageBubble
3. Database integration

### Phase 2: Admin Features
4. AdminChatDashboard
5. QuickReplyTemplates
6. Conversation management

### Phase 3: Enhanced Features
7. File attachments
8. WhatsApp integration
9. Advanced notifications

### Phase 4: Optimization
10. Performance improvements
11. Advanced search
12. Analytics and reporting

This architecture provides a scalable, maintainable foundation for the real-time messaging system while maintaining consistency with the existing Rosémama design system.