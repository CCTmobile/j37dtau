// ChatNotificationBell.tsx - Chat notification bell with unread count
// Beautiful gradient design for header integration

import React, { useState } from 'react';
import { MessageCircle, Bell } from 'lucide-react';
import { useUnreadCount } from '../utils/supabase/simpleChatHooks';
import { useAuth } from '../contexts/AuthContext';
import ChatInterface from './ChatInterface';

interface ChatNotificationBellProps {
  className?: string;
  showLabel?: boolean;
}

export default function ChatNotificationBell({ 
  className = '', 
  showLabel = false 
}: ChatNotificationBellProps) {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { unreadCount, loading } = useUnreadCount(user?.id || null);

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Bell Button */}
      <button
        onClick={handleOpenChat}
        className={`relative flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
        aria-label="Open chat support"
      >
        {/* Bell Icon with gradient on hover */}
        <div className="relative group">
          <MessageCircle 
            className="h-6 w-6 text-gray-600 group-hover:text-rose-500 transition-colors" 
          />
          
          {/* Unread Count Badge */}
          {!loading && unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
          
          {/* Loading indicator */}
          {loading && (
            <div className="absolute -top-1 -right-1 bg-gray-300 rounded-full h-3 w-3 animate-pulse"></div>
          )}
        </div>

        {/* Optional Label */}
        {showLabel && (
          <span className="text-sm text-gray-600 group-hover:text-rose-500 transition-colors">
            Support
          </span>
        )}
      </button>

      {/* Chat Interface Modal */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        initialSubject="Support Request"
      />
    </>
  );
}

// =======================================
// CHAT TRIGGER BUTTON (for Footer/Contact sections)
// =======================================

interface ChatTriggerButtonProps {
  text?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  subject?: string;
}

export function ChatTriggerButton({ 
  text = 'Chat with us',
  className = '',
  variant = 'primary',
  subject = 'Contact Inquiry'
}: ChatTriggerButtonProps) {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  // Base button styles
  const baseStyles = 'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105';
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg hover:from-rose-600 hover:to-pink-700 hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700 hover:shadow-xl',
    outline: 'border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white'
  };

  return (
    <>
      <button
        onClick={handleOpenChat}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        aria-label="Start chat conversation"
      >
        <MessageCircle className="h-5 w-5" />
        <span>{text}</span>
      </button>

      {/* Chat Interface Modal */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        initialSubject={subject}
      />
    </>
  );
}

// =======================================
// FLOATING CHAT BUTTON (for pages without header)
// =======================================

export function FloatingChatButton() {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { unreadCount, loading } = useUnreadCount(user?.id || null);

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-rose-500 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:from-rose-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-110 z-40"
        aria-label="Open chat support"
      >
        <div className="relative">
          <MessageCircle className="h-6 w-6" />
          
          {/* Unread Count Badge */}
          {!loading && unreadCount > 0 && (
            <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-bounce">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
      </button>

      {/* Chat Interface */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialSubject="Support Request"
      />
    </>
  );
}