// AdminChatDashboard.tsx - Mobile-Responsive World-Class Admin interface for managing customer conversations
// Gradient-themed design matching the existing admin dashboard
//
// MOBILE RESPONSIVENESS FEATURES:
// 📱 Mobile-First Design: Single column layout on mobile, two-column on desktop
// 🔄 Navigation States: Toggle between conversation list and chat view on mobile
// 📏 Compact Header: Smaller header on mobile with essential info
// 👆 Touch-Friendly UI: Larger touch targets and better spacing for mobile
// ⬅️ Back Navigation: Back button to return to conversation list on mobile
// 🎨 Responsive Components: All UI elements adapt to screen size

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  AtSign,
  Eye,
  Send,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { useChat, useMessages, useAdminChat } from '../../utils/supabase/simpleChatHooks';
import { useAuth } from '../../contexts/AuthContext';
import { routeToWhatsApp } from '../../utils/whatsAppService';

export default function AdminChatDashboard() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  
  const { 
    conversations, 
    loading: conversationsLoading, 
    refreshConversations 
  } = useChat(user?.id || '', true); // true for admin mode
  
  const { 
    messages, 
    loading: messagesLoading, 
    sendMessage,
    refreshMessages 
  } = useMessages(selectedConversationId);

  const { assignConversation, updateStatus } = useAdminChat();
  
  // Check if mobile view and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      // On desktop, always show conversation list
      if (!isMobile) {
        setShowConversationList(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle conversation selection for mobile
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (isMobileView) {
      setShowConversationList(false);
    }
  };
  
  // Handle back to conversations on mobile
  const handleBackToConversations = () => {
    if (isMobileView) {
      setShowConversationList(true);
      setSelectedConversationId(null);
    }
  };

  // Filter conversations based on search and status
  const filteredConversations = conversations.filter((conv: any) => {
    const matchesSearch = searchTerm === '' || 
      conv.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.customer_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleAssignToSelf = async (conversationId: string) => {
    if (user?.id) {
      const success = await assignConversation(conversationId, user.id);
      if (success) {
        refreshConversations();
      }
    }
  };

  const handleRouteToWhatsApp = async (conversationId: string, customerPhone: string) => {
    if (!customerPhone) {
      alert('Customer phone number not available');
      return;
    }
    
    const success = await routeToWhatsApp(conversationId, customerPhone);
    if (success) {
      refreshConversations();
    }
  };

  const handleStatusUpdate = async (conversationId: string, newStatus: string) => {
    const success = await updateStatus(conversationId, newStatus as any);
    if (success) {
      refreshConversations();
    }
  };

  const handleSendReply = async (content: string) => {
    if (selectedConversationId && user?.id) {
      await sendMessage(user.id, content);
      refreshMessages();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnhancedStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300';
      case 'assigned': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
      case 'in_progress': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300';
      case 'waiting_customer': return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300';
      case 'escalated': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300';
      case 'follow_up': return 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300';
      case 'resolved': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
      case 'closed': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'open': return '🟡';
      case 'assigned': return '🔵';
      case 'in_progress': return '🟣';
      case 'waiting_customer': return '🟠';
      case 'escalated': return '🔴';
      case 'follow_up': return '🔄';
      case 'resolved': return '🟢';
      case 'closed': return '⚫';
      default: return '⚪';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-3 w-3" />;
      case 'assigned': return <User className="h-3 w-3" />;
      case 'resolved': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // SLA Timer calculation
  const getSLAStatus = (conversation: any) => {
    const now = new Date();
    const created = new Date(conversation.created_at);
    const elapsed = now.getTime() - created.getTime();
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    
    // Priority-based SLA thresholds
    const priority = conversation.priority || 'normal';
    const threshold = priority === 'high' ? 1 : priority === 'urgent' ? 1 : priority === 'low' ? 24 : 4; // hours
    
    const remaining = threshold - hours;
    const isOverdue = remaining < 0;
    
    return {
      isOverdue,
      timeLeft: isOverdue ? `${Math.abs(remaining)}h overdue` : `${remaining}h left`,
      color: isOverdue ? 'text-red-600' : remaining < 1 ? 'text-orange-600' : 'text-blue-600'
    };
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-neutral-50 via-white to-rose-50/30 dark:from-neutral-900 dark:via-neutral-800 dark:to-rose-900/20">
      {/* Mobile-Optimized Header */}
      <div className="relative bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white shadow-xl">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        
        <div className="relative p-3 md:p-6">
          <div className="flex items-center justify-between">
            {/* Mobile Header - Compact */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Back Button */}
              {isMobileView && !showConversationList && (
                <button
                  onClick={handleBackToConversations}
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-white/30 transition-all duration-200 mr-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              
              <div className="bg-white/20 backdrop-blur-sm rounded-lg md:rounded-2xl p-2 md:p-3 shadow-lg">
                <MessageCircle className="h-5 w-5 md:h-8 md:w-8 text-white" />
              </div>
              
              <div>
                <h2 className="text-base md:text-2xl lg:text-3xl font-bold flex items-center gap-1 md:gap-3">
                  {isMobileView && !showConversationList ? (
                    <span>Chat</span>
                  ) : (
                    <>
                      <span className="hidden sm:inline">💬</span>
                      <span className="sm:hidden">Support</span>
                      <span className="hidden sm:block">Customer Support</span>
                    </>
                  )}
                </h2>
                <p className="text-rose-100 text-xs md:text-sm lg:text-base hidden md:block">
                  ✨ Manage conversations and provide amazing support
                </p>
              </div>
            </div>
            
            {/* Stats Card - Responsive */}
            <div className="bg-white/15 backdrop-blur-md rounded-lg md:rounded-xl px-2 py-2 md:px-6 md:py-4 border border-white/20 shadow-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 md:gap-2 mb-1">
                  <span className="text-sm md:text-2xl lg:text-3xl font-bold">{conversations.length}</span>
                  <span className="text-xs md:text-xl">📨</span>
                </div>
                <span className="text-rose-100 text-xs md:text-sm font-medium">
                  <span className="hidden md:inline">Active</span>
                  <span className="md:hidden">Chats</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Status indicators - Hide on mobile when in chat view */}
          <div className={`relative mt-2 md:mt-4 flex items-center gap-2 md:gap-4 text-xs md:text-sm ${
            isMobileView && !showConversationList ? 'hidden' : 'flex'
          }`}>
            <div className="flex items-center gap-1 md:gap-2 bg-white/10 rounded-full px-2 md:px-3 py-1">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-rose-100">Online</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2 text-rose-200">
              <span>🕐</span>
              <span className="hidden sm:inline">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden shadow-inner">
        {/* Mobile-Responsive Layout */}
        {isMobileView ? (
          // Mobile: Single column with toggle
          <>
            {showConversationList ? (
              // Mobile Conversation List
              <div className="w-full bg-white/80 backdrop-blur-sm flex flex-col shadow-lg">
                {/* Mobile Search and Filter */}
                <div className="p-3 bg-gradient-to-r from-white to-rose-50/50 border-b border-rose-100 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rose-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="🔍 Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-rose-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 placeholder:text-rose-400 text-base"
                    />
                  </div>
                  
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rose-400 h-4 w-4" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-rose-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200 text-base"
                    >
                      <option value="all">📋 All Status</option>
                      <option value="open">🟡 Open</option>
                      <option value="assigned">🔵 Assigned</option>
                      <option value="in_progress">🟣 In Progress</option>
                      <option value="waiting_customer">🟠 Waiting</option>
                      <option value="escalated">🔴 Escalated</option>
                      <option value="follow_up">🔄 Follow-up</option>
                      <option value="resolved">🟢 Resolved</option>
                      <option value="closed">⚫ Closed</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Mobile Conversations List */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-rose-50/30">
                  {conversationsLoading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-3"></div>
                      <p className="text-rose-600 font-medium">✨ Loading...</p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-6 text-center text-rose-600">
                      <div className="bg-rose-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">💬</span>
                      </div>
                      <p className="font-medium">No conversations</p>
                      <p className="text-sm text-rose-500 mt-1">Try adjusting filters</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredConversations.map((conversation: any) => (
                        <div
                          key={conversation.id}
                          onClick={() => handleConversationSelect(conversation.id)}
                          className="bg-white/90 backdrop-blur-sm border border-rose-100 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95"
                        >
                          {/* Mobile Conversation Card Content */}
                          <div className="flex items-start gap-3">
                            {/* Customer Avatar */}
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                              👤
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-base truncate">
                                    Customer #{conversation.customer_id?.slice(0, 8) || 'Unknown'}
                                  </h4>
                                  <p className="text-sm text-gray-600 truncate">
                                    {conversation.subject || 'General Inquiry'}
                                  </p>
                                </div>
                                
                                {/* Status Badge */}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getEnhancedStatusColor(conversation.status || 'open')}`}>
                                  {getStatusEmoji(conversation.status || 'open')}
                                </span>
                              </div>
                              
                              {/* Last Message Preview */}
                              <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                                Last message preview...
                              </p>
                              
                              {/* Meta Info */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(conversation.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                
                                {/* SLA Timer for Mobile */}
                                {(() => {
                                  const sla = getSLAStatus(conversation);
                                  return sla.isOverdue ? (
                                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                                      🚨 {sla.timeLeft}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 text-xs">
                                      ⏱️ {sla.timeLeft}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Mobile Chat View
              <div className="w-full flex flex-col">
                {selectedConversationId ? (
                  <AdminChatView
                    conversationId={selectedConversationId}
                    messages={messages}
                    loading={messagesLoading}
                    onSendMessage={handleSendReply}
                    onAssignToSelf={() => handleAssignToSelf(selectedConversationId)}
                    onStatusUpdate={(status) => handleStatusUpdate(selectedConversationId, status)}
                    isMobile={true}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-rose-50/30 via-white to-pink-50/30 p-6">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-10 w-10 text-rose-400" />
                      </div>
                      <p className="text-rose-600 font-medium mb-2">Select a conversation</p>
                      <p className="text-rose-500 text-sm">Choose a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // Desktop: Two column layout
          <>
            {/* Desktop Conversations List */}
            <div className="w-1/3 bg-white/80 backdrop-blur-sm border-r border-rose-100 dark:border-rose-800/30 flex flex-col shadow-lg">
              {/* Desktop Search and Filter */}
              <div className="p-4 bg-gradient-to-r from-white to-rose-50/50 border-b border-rose-100 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rose-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="🔍 Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-rose-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 placeholder:text-rose-400"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rose-400 h-4 w-4" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-rose-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
                  >
                    <option value="all">📋 All Status</option>
                    <option value="open">🟡 Open</option>
                    <option value="assigned">🔵 Assigned</option>
                    <option value="in_progress">🟣 In Progress</option>
                    <option value="waiting_customer">🟠 Waiting for Customer</option>
                    <option value="escalated">🔴 Escalated</option>
                    <option value="follow_up">🔄 Follow-up Required</option>
                    <option value="resolved">🟢 Resolved</option>
                    <option value="closed">⚫ Closed</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Desktop Conversations List */}
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-rose-50/30">
                {conversationsLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-3"></div>
                    <p className="text-rose-600 font-medium">✨ Loading conversations...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-rose-600">
                    <div className="bg-rose-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">💬</span>
                    </div>
                    <p className="font-medium">No conversations found</p>
                    <p className="text-sm text-rose-500 mt-1">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredConversations.map((conversation: any) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={`p-4 border-b border-rose-100/50 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 hover:shadow-md group relative ${
                          selectedConversationId === conversation.id ? 'bg-gradient-to-r from-rose-100 to-pink-100 border-rose-300 shadow-lg' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Desktop Customer Avatar */}
                          <div className="flex-shrink-0 relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              👤
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Status and Source Info */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all duration-200 ${getEnhancedStatusColor(conversation.status || 'open')}`}>
                                {getStatusIcon(conversation.status || 'open')}
                                {getStatusEmoji(conversation.status || 'open')} {(conversation.status || 'open').toUpperCase()}
                              </span>
                            </div>
                            
                            {/* Customer Name and Subject */}
                            <div className="mb-2">
                              <h4 className="font-bold text-gray-900 truncate group-hover:text-rose-700 transition-colors text-sm">
                                👤 Customer #{conversation.customer_id?.slice(0, 8) || 'Unknown'}
                              </h4>
                              <p className="text-xs text-gray-600 truncate mt-1">
                                📋 {conversation.subject || 'General Support Inquiry'}
                              </p>
                            </div>
                            
                            {/* Enhanced Action Buttons */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(conversation.created_at).toLocaleDateString()}</span>
                              </div>
                              
                              {/* SLA Timer */}
                              {(() => {
                                const sla = getSLAStatus(conversation);
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      sla.isOverdue 
                                        ? 'bg-red-100 text-red-600' 
                                        : 'bg-blue-100 text-blue-600'
                                    }`}>
                                      ⏱️ {sla.timeLeft}
                                    </span>
                                    
                                    {/* Quick Actions */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAssignToSelf(conversation.id);
                                        }}
                                        className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded text-xs"
                                        title="Assign to me"
                                      >
                                        👤
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusUpdate(conversation.id, 'escalated');
                                        }}
                                        className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs"
                                        title="Escalate"
                                      >
                                        🚨
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusUpdate(conversation.id, 'resolved');
                                        }}
                                        className="p-1 bg-green-100 hover:bg-green-200 text-green-600 rounded text-xs"
                                        title="Mark Resolved"
                                      >
                                        ✅
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversationId ? (
                <AdminChatView
                  conversationId={selectedConversationId}
                  messages={messages}
                  loading={messagesLoading}
                  onSendMessage={handleSendReply}
                  onAssignToSelf={() => handleAssignToSelf(selectedConversationId)}
                  onStatusUpdate={(status) => handleStatusUpdate(selectedConversationId, status)}
                  isMobile={false}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-rose-50/30 via-white to-pink-50/30">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-10 w-10 text-rose-400" />
                    </div>
                    <p className="text-rose-600 font-medium mb-2">💬 Select a conversation</p>
                    <p className="text-rose-500 text-sm">Choose a conversation from the list to start providing amazing support!</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =======================================
// ADMIN CHAT VIEW COMPONENT
// =======================================

interface AdminChatViewProps {
  conversationId: string;
  messages: any[];
  loading: boolean;
  onSendMessage: (content: string) => void;
  onAssignToSelf: () => void;
  onStatusUpdate: (status: string) => void;
  isMobile?: boolean;
}

function AdminChatView({
  conversationId,
  messages,
  loading,
  onSendMessage,
  onAssignToSelf,
  onStatusUpdate,
  isMobile = false
}: AdminChatViewProps) {
  const [replyText, setReplyText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Quick reply templates
  const quickTemplates = [
    { id: 1, title: '👋 Welcome', content: 'Hello! Thank you for contacting us. How can I help you today?' },
    { id: 2, title: '🔍 Investigating', content: 'Thank you for bringing this to our attention. I\'m looking into this right away and will get back to you shortly.' },
    { id: 3, title: '✅ Resolved', content: 'Great news! I\'ve resolved your issue. Please let me know if you need any further assistance.' },
    { id: 4, title: '📞 Follow-up', content: 'I\'ll follow up with you within 24 hours to ensure everything is working perfectly.' },
    { id: 5, title: '🙏 Thank You', content: 'Thank you for your patience and for choosing our service. Is there anything else I can help you with?' },
    { id: 6, title: '📋 More Info', content: 'To better assist you, could you please provide more details about the issue you\'re experiencing?' }
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate typing indicator
  useEffect(() => {
    if (replyText.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [replyText]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      onSendMessage(replyText.trim());
      setReplyText('');
    }
  };

  return (
    <>
      {/* Mobile-Responsive Chat Header */}
      <div className="relative bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 text-white shadow-lg">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        
        <div className={`relative ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-lg">💬 Conversation</h3>
                <p className="text-rose-100 text-xs md:text-sm">#{conversationId.slice(0, 8)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={onAssignToSelf}
                className={`flex items-center gap-1 md:gap-2 ${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'} bg-white/20 backdrop-blur-sm text-white rounded-lg md:rounded-xl hover:bg-white/30 transition-all duration-200 font-medium shadow-lg border border-white/20`}
              >
                <AtSign className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">👤 Assign</span>
                <span className="sm:hidden">👤</span>
              </button>
              
              <select
                onChange={(e) => onStatusUpdate(e.target.value)}
                className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'} bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg md:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 hover:bg-white/30 transition-all duration-200 font-medium`}
                style={{ backgroundImage: 'none' }}
              >
                <option value="" className="text-gray-800">🔄 Status</option>
                <option value="assigned" className="text-gray-800">🔵 Assigned</option>
                <option value="in_progress" className="text-gray-800">🟣 In Progress</option>
                <option value="waiting_customer" className="text-gray-800">🟠 Waiting</option>
                <option value="escalated" className="text-gray-800">🔴 Escalated</option>
                <option value="follow_up" className="text-gray-800">🔄 Follow-up</option>
                <option value="resolved" className="text-gray-800">🟢 Resolved</option>
                <option value="closed" className="text-gray-800">⚫ Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Responsive Messages Area */}
      <div className={`flex-1 overflow-y-auto space-y-4 bg-gradient-to-b from-rose-50/50 via-white to-pink-50/30 ${isMobile ? 'px-3 py-3' : 'px-6 py-6'}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-4 border-rose-200 border-t-rose-500 mb-4"></div>
            <p className="text-rose-600 font-medium text-sm md:text-base">✨ Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 md:h-8 md:w-8 text-rose-400" />
            </div>
            <p className="text-rose-600 font-medium mb-2 text-sm md:text-base">💬 No messages yet</p>
            <p className="text-rose-500 text-xs md:text-sm">Start the conversation below!</p>
          </div>
        ) : (
          <>
            {messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === conversationId ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`${isMobile ? 'max-w-[85%]' : 'max-w-[70%]'} group ${
                  message.sender_id === conversationId ? 'flex items-start gap-2 md:gap-3' : 'flex items-start gap-2 md:gap-3 flex-row-reverse'
                }`}>
                  {/* Avatar */}
                  <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-lg flex-shrink-0 ${
                    message.sender_id === conversationId 
                      ? 'bg-gradient-to-br from-blue-400 to-purple-500' 
                      : 'bg-gradient-to-br from-rose-400 to-pink-500'
                  }`}>
                    {message.sender_id === conversationId ? '👤' : '👨‍💼'}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`${isMobile ? 'px-3 py-2' : 'px-4 py-3'} rounded-2xl shadow-lg border transition-all duration-200 group-hover:shadow-xl ${
                    message.sender_id === conversationId
                      ? 'bg-white border-gray-200 text-gray-900 rounded-tl-sm'
                      : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-rose-400 rounded-tr-sm'
                  }`}>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium leading-relaxed`}>{message.content}</p>
                    <div className={`flex items-center justify-between mt-2 text-xs ${
                      message.sender_id === conversationId ? 'text-gray-500' : 'text-rose-100'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Clock className="h-2 w-2 md:h-3 md:w-3" />
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                      
                      {/* Read Receipt for Admin Messages */}
                      {message.sender_id !== conversationId && (
                        <div className="flex items-center gap-1">
                          <span className="text-rose-200">✓✓</span>
                          <span className="text-rose-200 hidden sm:inline">Read</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mobile-Responsive Reply Input */}
      <div className={`relative bg-gradient-to-r from-rose-50 to-pink-50 border-t border-rose-200 space-y-3 md:space-y-4 ${isMobile ? 'px-3 py-3' : 'px-6 py-4'}`}>
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-50/70 to-pink-50/70 backdrop-blur-sm"></div>
        
        {/* Quick Actions Bar - Responsive */}
        <div className="relative flex items-center gap-1 md:gap-2 flex-wrap">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`flex items-center gap-1 md:gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg md:rounded-xl font-medium transition-colors ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}
          >
            📝 <span className="hidden sm:inline">Templates</span>
          </button>
          <button
            onClick={() => setShowInternalNotes(!showInternalNotes)}
            className={`flex items-center gap-1 md:gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg md:rounded-xl font-medium transition-colors ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}
          >
            📋 <span className="hidden sm:inline">Notes</span>
          </button>
          <button
            onClick={() => {/* TODO: File upload */}}
            className={`flex items-center gap-1 md:gap-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg md:rounded-xl font-medium transition-colors ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}
          >
            📎 <span className="hidden sm:inline">Attach</span>
          </button>
        </div>

        {/* Templates Panel - Mobile Responsive */}
        {showTemplates && (
          <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-rose-200 shadow-lg">
            <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-3">🚀 Quick Reply Templates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {quickTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setReplyText(template.content);
                    setShowTemplates(false);
                  }}
                  className="text-left p-2 md:p-3 bg-gray-50 hover:bg-rose-50 rounded-lg text-xs transition-colors border border-gray-200 hover:border-rose-300"
                >
                  <div className="font-medium text-gray-800">{template.title}</div>
                  <div className="text-gray-500 mt-1 truncate">{template.content.slice(0, isMobile ? 30 : 40)}...</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Internal Notes Panel - Mobile Responsive */}
        {showInternalNotes && (
          <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-purple-200 shadow-lg">
            <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-3">📋 Internal Team Notes</h4>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Add internal notes for your team..."
              rows={isMobile ? 2 : 3}
              className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs md:text-sm text-gray-800"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-purple-600">💡 Team only</span>
              <button
                onClick={() => {
                  // TODO: Save internal note
                  setInternalNote('');
                  setShowInternalNotes(false);
                }}
                className="px-3 py-1 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}
        
        {/* Main Reply Input - Mobile Responsive */}
        <form onSubmit={handleSendReply} className="relative flex gap-2 md:gap-4">
          <div className="flex-1 relative">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="💬 Type your reply..."
              rows={isMobile ? 1 : 2}
              className={`w-full border-2 border-rose-300 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-400 resize-none bg-white shadow-md font-medium transition-all duration-200 hover:border-rose-400 hover:shadow-lg text-gray-900 placeholder:text-rose-500 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base'}`}
              style={{ color: '#111827' }}
            />
            {!isMobile && (
              <div className="absolute bottom-2 right-2 text-xs text-rose-600 font-medium bg-white/80 px-2 py-1 rounded-lg">
                ✨ Shift + Enter for new line
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1 md:gap-2">
            <button
              type="submit"
              disabled={!replyText.trim()}
              className={`bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl md:rounded-2xl hover:from-rose-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-1 md:gap-2 ${isMobile ? 'px-3 py-2 text-xs' : 'px-6 py-3 text-sm'}`}
            >
              <Send className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Send</span>
              <span className="sm:hidden">Send</span>
            </button>
            
            {!isMobile && (
              <div className="text-xs text-gray-500 text-center">
                📖 Read receipts: ON
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}