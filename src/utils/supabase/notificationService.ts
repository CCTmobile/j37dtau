// Notification Service for Rosémama Clothing
// This service handles all notification operations including creating, reading, and managing notifications

import { supabase } from './client';

export interface NotificationData {
  id: string;
  user_id: string;
  type: 'email' | 'push' | 'system' | 'order' | 'security';
  category: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
  priority: 1 | 2 | 3;
  action_url?: string;
  action_text?: string;
  expires_at?: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  system_alerts: boolean;
  order_alerts: boolean;
  security_alerts: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateNotificationParams {
  user_id: string;
  type: 'email' | 'push' | 'system' | 'order' | 'security';
  category: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 1 | 2 | 3;
  action_url?: string;
  action_text?: string;
  expires_at?: string;
}

class NotificationService {
  /**
   * Create a new notification (fallback implementation until migration is applied)
   */
  async createNotification(params: CreateNotificationParams): Promise<string | null> {
    try {
      // Always use fallback until migration is applied
      return this.createNotificationFallback(params);
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Fallback method to create notification directly in table or localStorage
   */
  private async createNotificationFallback(params: CreateNotificationParams): Promise<string | null> {
    try {
      const notificationId = crypto.randomUUID();
      
      const notificationData: NotificationData = {
        id: notificationId,
        user_id: params.user_id,
        type: params.type,
        category: params.category,
        title: params.title,
        message: params.message,
        data: params.data || {},
        priority: params.priority || 1,
        action_url: params.action_url,
        action_text: params.action_text,
        expires_at: params.expires_at,
        created_at: new Date().toISOString(),
        read_at: null
      };

      // Try to insert directly into notifications table
      try {
        const { error } = await (supabase as any)
          .from('notifications')
          .insert(notificationData);

        if (error) {
          console.warn('Notifications table not available yet. Using localStorage fallback:', error.message);
          this.storeNotificationLocally(notificationData);
          return notificationId;
        }

        return notificationId;
      } catch (dbError) {
        console.warn('Database not ready, using localStorage:', dbError);
        this.storeNotificationLocally(notificationData);
        return notificationId;
      }
    } catch (error) {
      console.error('Error in fallback notification creation:', error);
      return null;
    }
  }

  /**
   * Store notification locally for development (temporary fallback)
   */
  private storeNotificationLocally(notification: NotificationData): void {
    try {
      const stored = localStorage.getItem('temp_notifications') || '[]';
      const notifications = JSON.parse(stored);
      notifications.push(notification);
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(0, notifications.length - 50);
      }
      
      localStorage.setItem('temp_notifications', JSON.stringify(notifications));
      console.log('Notification stored locally (temporary):', notification.title);
    } catch (error) {
      console.error('Error storing notification locally:', error);
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<NotificationData[]> {
    try {
      // Check if we're in development and show a one-time message
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('localhost');
      
      // Try database first
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        // Only log detailed error in development, and only once per session
        if (isDevelopment && !sessionStorage.getItem('notifications_fallback_logged')) {
          console.info('ℹ️ Notifications: Using localStorage fallback (database table not yet created)');
          sessionStorage.setItem('notifications_fallback_logged', 'true');
        }
        return this.getNotificationsFromLocalStorage(userId, limit, offset, unreadOnly);
      }

      let notifications = data || [];
      
      if (unreadOnly) {
        notifications = notifications.filter((n: NotificationData) => !n.read_at);
      }

      return notifications;
    } catch (error) {
      return this.getNotificationsFromLocalStorage(userId, limit, offset, unreadOnly);
    }
  }

  /**
   * Get notifications from localStorage (temporary fallback)
   */
  private getNotificationsFromLocalStorage(
    userId: string,
    limit: number,
    offset: number,
    unreadOnly: boolean
  ): NotificationData[] {
    try {
      const stored = localStorage.getItem('temp_notifications') || '[]';
      let notifications: NotificationData[] = JSON.parse(stored);
      
      // Filter by user
      notifications = notifications.filter(n => n.user_id === userId);
      
      // Filter by read status if needed
      if (unreadOnly) {
        notifications = notifications.filter(n => !n.read_at);
      }
      
      // Sort by created_at desc
      notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Apply pagination
      return notifications.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error getting notifications from localStorage:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('read_at', null);

      if (error) {
        // Silent fallback - don't spam console with 404 errors
        const notifications = this.getNotificationsFromLocalStorage(userId, 1000, 0, true);
        return notifications.length;
      }

      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.warn('Using localStorage for mark as read:', error.message);
        this.markAsReadInLocalStorage(notificationId);
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark notification as read in localStorage
   */
  private markAsReadInLocalStorage(notificationId: string): void {
    try {
      const stored = localStorage.getItem('temp_notifications') || '[]';
      const notifications: NotificationData[] = JSON.parse(stored);
      
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read_at = new Date().toISOString();
        localStorage.setItem('temp_notifications', JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Error marking notification as read in localStorage:', error);
    }
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Notification preferences table not available, using defaults:', error.message);
        // Return default preferences
        return {
          user_id: userId,
          email_notifications: true,
          push_notifications: false,
          system_alerts: true,
          order_alerts: true,
          security_alerts: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      if (!data) {
        // No preferences found, return defaults
        return {
          user_id: userId,
          email_notifications: true,
          push_notifications: false,
          system_alerts: true,
          order_alerts: true,
          security_alerts: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Return defaults on error
      return {
        user_id: userId,
        email_notifications: true,
        push_notifications: false,
        system_alerts: true,
        order_alerts: true,
        security_alerts: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Notification preferences table not available:', error.message);
        // Store in localStorage temporarily
        const key = `notification_preferences_${userId}`;
        localStorage.setItem(key, JSON.stringify({ user_id: userId, ...preferences }));
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Send a security alert (fallback implementation)
   */
  async sendSecurityAlert(
    userId: string,
    alertType: string,
    description: string,
    ipAddress?: string
  ): Promise<string | null> {
    try {
      // Create a security notification directly
      return this.createNotification({
        user_id: userId,
        type: 'security',
        category: alertType,
        title: 'Security Alert',
        message: description,
        priority: 3,
        data: {
          alert_type: alertType,
          ip_address: ipAddress,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending security alert:', error);
      return null;
    }
  }

  /**
   * Send system notification to all users (simplified fallback)
   */
  async sendSystemNotification(
    title: string,
    message: string,
    priority: 1 | 2 | 3 = 1,
    expiresAt?: string
  ): Promise<number> {
    try {
      console.log('System notification (development mode):', { title, message, priority });
      
      // In a real implementation, this would send to all users
      // For now, just log it as database functions aren't available
      return 1;
    } catch (error) {
      console.error('Error sending system notification:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: NotificationData) => void,
    onError?: (error: any) => void
  ) {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          onNotification(payload.new as NotificationData);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Only log in development
          const isDevelopment = window.location.hostname === 'localhost' || 
                               window.location.hostname.includes('localhost');
          if (isDevelopment && !sessionStorage.getItem('notifications_subscription_logged')) {
            console.log('📧 Notifications: Real-time subscription active for user:', userId);
            sessionStorage.setItem('notifications_subscription_logged', 'true');
          }
        } else if (status === 'CHANNEL_ERROR' && onError) {
          // Silent error handling - the fallback system handles this
          onError(status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Request browser push notification permission
   */
  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Show browser push notification
   */
  async showPushNotification(
    title: string,
    options: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
    } = {}
  ): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      const granted = await this.requestPushPermission();
      if (!granted) return false;
    }

    try {
      const notification = new Notification(title, {
        icon: options.icon || '/images/placeholder-product.svg',
        badge: options.badge || '/images/placeholder-product.svg',
        body: options.body,
        tag: options.tag,
        data: options.data,
        requireInteraction: true,
        ...options
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // If there's data with a URL, navigate to it
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing push notification:', error);
      return false;
    }
  }

  /**
   * Cleanup old notifications (development placeholder)
   */
  async cleanupOldNotifications(): Promise<number> {
    console.log('Cleanup old notifications (development mode)');
    return 0;
  }
}

export const notificationService = new NotificationService();
export default notificationService;