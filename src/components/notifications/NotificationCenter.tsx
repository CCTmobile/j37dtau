// Notification Center Component
// This component provides a comprehensive notification management interface

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, X, Settings, Filter, Archive, Trash2, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService, NotificationData, NotificationPreferences } from '../../utils/supabase/notificationService';

interface NotificationCenterProps {
  className?: string;
}

const NotificationTypeIcons = {
  email: Info,
  push: Bell,
  system: Settings,
  order: CheckCircle,
  security: AlertTriangle
};

const NotificationPriorityColors = {
  1: 'bg-blue-500',
  2: 'bg-yellow-500', 
  3: 'bg-red-500'
};

export function NotificationCenter({ className }: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'order' | 'security'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async (reset = false) => {
    if (!user?.id || isLoading) return;

    setIsLoading(true);
    try {
      const newPage = reset ? 0 : page;
      const unreadOnly = filter === 'unread';
      
      const newNotifications = await notificationService.getUserNotifications(
        user.id,
        20,
        newPage * 20,
        unreadOnly
      );

      if (reset) {
        setNotifications(newNotifications);
        setPage(0);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }

      setHasMore(newNotifications.length === 20);
      setPage(newPage + 1);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, page, filter, isLoading]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [user?.id]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      const prefs = await notificationService.getNotificationPreferences(user.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, [user?.id]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const success = await notificationService.markAsRead(notificationId, user.id);
      if (success) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read_at);
      const promises = unreadNotifications.map(n => notificationService.markAsRead(n.id, user.id));
      
      await Promise.all(promises);
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Update preferences
  const updatePreferences = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user?.id || !preferences) return;

    try {
      const newPreferences = { ...preferences, [key]: value };
      const success = await notificationService.updateNotificationPreferences(user.id, { [key]: value });
      
      if (success) {
        setPreferences(newPreferences);
        toast.success('Notification preferences updated');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  // Request push permission
  const requestPushPermission = async () => {
    try {
      const granted = await notificationService.requestPushPermission();
      if (granted) {
        toast.success('Push notifications enabled');
        updatePreferences('push_notifications', true);
      } else {
        toast.error('Push notifications denied');
        updatePreferences('push_notifications', false);
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      toast.error('Failed to request push permission');
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read_at;
      case 'system':
        return notification.type === 'system';
      case 'order':
        return notification.type === 'order';
      case 'security':
        return notification.type === 'security';
      default:
        return true;
    }
  });

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadNotifications(true);
      loadUnreadCount();
      loadPreferences();
    }
  }, [user?.id, filter]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if enabled
        if (preferences?.push_notifications) {
          notificationService.showPushNotification(newNotification.title, {
            body: newNotification.message,
            tag: newNotification.id,
            data: { 
              notificationId: newNotification.id,
              url: newNotification.action_url 
            }
          });
        }
        
        toast.info(`New notification: ${newNotification.title}`);
      }
    );

    return unsubscribe;
  }, [user?.id, preferences?.push_notifications]);

  // Format notification time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            {/* Filter Controls */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const IconComponent = NotificationTypeIcons[notification.type] || Bell;
                  const isUnread = !notification.read_at;
                  
                  return (
                    <Card 
                      key={notification.id}
                      className={`${isUnread ? 'border-blue-200 bg-blue-50/50' : ''} cursor-pointer hover:shadow-md transition-shadow`}
                      onClick={() => isUnread && markAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className={`p-2 rounded-full ${NotificationPriorityColors[notification.priority]} text-white`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`font-medium ${isUnread ? 'text-blue-900' : 'text-gray-900'}`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {formatTime(notification.created_at)}
                                </span>
                                {isUnread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {notification.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {notification.category}
                              </Badge>
                            </div>
                            
                            {notification.action_url && notification.action_text && (
                              <Button 
                                size="sm" 
                                variant="link" 
                                className="p-0 h-auto mt-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(notification.action_url, '_blank');
                                }}
                              >
                                {notification.action_text}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {filteredNotifications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications found</p>
                  </div>
                )}
                
                {hasMore && (
                  <Button 
                    variant="outline" 
                    onClick={() => loadNotifications(false)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Load More
                  </Button>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {preferences && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email Notifications</h4>
                        <p className="text-sm text-gray-600">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={preferences.email_notifications}
                        onCheckedChange={(checked) => updatePreferences('email_notifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Push Notifications</h4>
                        <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={preferences.push_notifications}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              requestPushPermission();
                            } else {
                              updatePreferences('push_notifications', false);
                            }
                          }}
                        />
                        {!preferences.push_notifications && (
                          <Button size="sm" variant="outline" onClick={requestPushPermission}>
                            Enable
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">System Alerts</h4>
                        <p className="text-sm text-gray-600">Important system notifications</p>
                      </div>
                      <Switch
                        checked={preferences.system_alerts}
                        onCheckedChange={(checked) => updatePreferences('system_alerts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Order Alerts</h4>
                        <p className="text-sm text-gray-600">Notifications for order updates</p>
                      </div>
                      <Switch
                        checked={preferences.order_alerts}
                        onCheckedChange={(checked) => updatePreferences('order_alerts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Security Alerts</h4>
                        <p className="text-sm text-gray-600">Security-related notifications</p>
                      </div>
                      <Switch
                        checked={preferences.security_alerts}
                        onCheckedChange={(checked) => updatePreferences('security_alerts', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Browser Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Push Notification Status</h4>
                        <p className="text-sm text-gray-600">
                          Current permission: {
                            typeof window !== 'undefined' && 'Notification' in window
                              ? Notification.permission
                              : 'Not supported'
                          }
                        </p>
                      </div>
                      
                      <Button onClick={requestPushPermission} variant="outline">
                        Request Push Permission
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default NotificationCenter;