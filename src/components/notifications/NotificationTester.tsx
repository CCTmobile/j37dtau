// Notification Test Component
// Quick testing interface for the notification system

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Bell, Send, TestTube, AlertCircle } from 'lucide-react';
import { useToast } from './ToastProvider';
import { useAuth } from '../../contexts/AuthContext';

export function NotificationTester() {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState({
    title: 'Test Notification',
    message: 'This is a test notification to verify the system is working.',
    type: 'system' as 'email' | 'push' | 'system' | 'order' | 'security',
    category: 'test',
    priority: 2 as 1 | 2 | 3
  });

  // Dynamic import to avoid TypeScript module resolution issues
  const [notificationService, setNotificationService] = useState<any>(null);
  const [serviceWorkerManager, setServiceWorkerManager] = useState<any>(null);

  React.useEffect(() => {
    // Dynamic imports to avoid TypeScript issues
    const loadServices = async () => {
      try {
        const { notificationService: ns } = await import('../../utils/supabase/notificationService');
        const { serviceWorkerManager: swm } = await import('../../utils/serviceWorkerManager');
        setNotificationService(ns);
        setServiceWorkerManager(swm);
      } catch (error) {
        console.error('Error loading notification services:', error);
      }
    };
    
    loadServices();
  }, []);

  const handleToastTest = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: { title: 'Success!', message: 'Operation completed successfully.' },
      error: { title: 'Error Occurred', message: 'Something went wrong. Please try again.' },
      warning: { title: 'Warning', message: 'Please review your settings before continuing.' },
      info: { title: 'Information', message: 'Here is some helpful information for you.' }
    };

    const { title, message } = messages[type];
    
    switch (type) {
      case 'success':
        showSuccess(title, message);
        break;
      case 'error':
        showError(title, message);
        break;
      case 'warning':
        showWarning(title, message);
        break;
      case 'info':
        showInfo(title, message);
        break;
    }
  };

  const handlePushTest = async () => {
    if (!serviceWorkerManager) {
      showError('Service Not Ready', 'Service worker manager not loaded yet.');
      return;
    }

    try {
      const permission = await serviceWorkerManager.requestPushPermission();
      if (permission) {
        showSuccess('Push Notifications Enabled', 'You will now receive push notifications.');
        
        // Show a test notification
        await serviceWorkerManager.showNotification('Test Notification', {
          body: 'This is a test push notification from Rosémama Clothing.',
          tag: 'test-notification',
          requireInteraction: false
        });
      } else {
        showError('Permission Denied', 'Push notifications were denied. Please enable them in your browser settings.');
      }
    } catch (error) {
      console.error('Push test error:', error);
      showError('Push Test Failed', 'Failed to test push notifications.');
    }
  };

  const handleDatabaseTest = async () => {
    if (!user?.id) {
      showError('Authentication Required', 'Please log in to test database notifications.');
      return;
    }

    if (!notificationService) {
      showError('Service Not Ready', 'Notification service not loaded yet.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await notificationService.createNotification({
        user_id: user.id,
        type: testData.type,
        category: testData.category,
        title: testData.title,
        message: testData.message,
        priority: testData.priority,
        data: { source: 'notification-tester', timestamp: Date.now() }
      });

      if (success) {
        showSuccess('Database Test Successful', 'Notification created in database.');
      } else {
        showError('Database Test Failed', 'Failed to create notification in database.');
      }
    } catch (error) {
      console.error('Database test error:', error);
      showError('Database Error', 'Database functions may not be available yet. Please apply the migration first.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkServiceWorkerStatus = () => {
    if (!serviceWorkerManager) {
      showError('Service Not Ready', 'Service worker manager not loaded yet.');
      return;
    }

    const isSupported = serviceWorkerManager.isPushSupported();
    const permission = serviceWorkerManager.getNotificationPermission();
    
    showInfo('Service Worker Status', `
      Push Support: ${isSupported ? 'Yes' : 'No'}
      Permission: ${permission}
      Service Worker: ${'serviceWorker' in navigator ? 'Supported' : 'Not Supported'}
    `);
  };

  const testBrowserNotification = () => {
    if (!('Notification' in window)) {
      showError('Not Supported', 'Browser notifications are not supported in this browser.');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('Test Browser Notification', {
        body: 'This is a direct browser notification test.',
        icon: '/images/placeholder-product.svg'
      });
      showSuccess('Browser Notification Sent', 'Check if you received the notification.');
    } else if (Notification.permission === 'denied') {
      showError('Permission Denied', 'Browser notifications are blocked. Please enable them in browser settings.');
    } else {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Test Browser Notification', {
            body: 'This is a direct browser notification test.',
            icon: '/images/placeholder-product.svg'
          });
          showSuccess('Permission Granted', 'Browser notification sent!');
        } else {
          showError('Permission Denied', 'Browser notification permission was denied.');
        }
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Notification System Tester
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant={user ? 'default' : 'secondary'}>
            {user ? 'Authenticated' : 'Not Authenticated'}
          </Badge>
          <Badge variant={'serviceWorker' in navigator ? 'default' : 'destructive'}>
            Service Worker: {'serviceWorker' in navigator ? 'Supported' : 'Not Supported'}
          </Badge>
          <Badge variant={Notification.permission === 'granted' ? 'default' : 'secondary'}>
            Push: {Notification.permission}
          </Badge>
        </div>

        {/* Toast Tests */}
        <div className="space-y-3">
          <h3 className="font-medium">Toast Notifications</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handleToastTest('success')} variant="default" size="sm">
              Test Success
            </Button>
            <Button onClick={() => handleToastTest('error')} variant="destructive" size="sm">
              Test Error
            </Button>
            <Button onClick={() => handleToastTest('warning')} variant="secondary" size="sm">
              Test Warning
            </Button>
            <Button onClick={() => handleToastTest('info')} variant="outline" size="sm">
              Test Info
            </Button>
          </div>
        </div>

        {/* Push Notification Test */}
        <div className="space-y-3">
          <h3 className="font-medium">Push Notifications</h3>
          <div className="flex gap-2">
            <Button onClick={handlePushTest} variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Test Push
            </Button>
            <Button onClick={testBrowserNotification} variant="outline" size="sm">
              Browser Direct
            </Button>
            <Button onClick={checkServiceWorkerStatus} variant="ghost" size="sm">
              Check Status
            </Button>
          </div>
        </div>

        {/* Database Notification Test */}
        <div className="space-y-3">
          <h3 className="font-medium">Database Notifications</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={testData.title}
                onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={testData.type} onValueChange={(value: any) => setTestData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                value={testData.category}
                onChange={(e) => setTestData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="test, maintenance, etc."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={testData.priority.toString()} onValueChange={(value) => setTestData(prev => ({ ...prev, priority: parseInt(value) as 1 | 2 | 3 }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low (1)</SelectItem>
                  <SelectItem value="2">Medium (2)</SelectItem>
                  <SelectItem value="3">High (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={testData.message}
              onChange={(e) => setTestData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Notification message content"
              rows={3}
            />
          </div>

          <Button 
            onClick={handleDatabaseTest} 
            disabled={isLoading || !user}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Creating...' : 'Test Database Notification'}
          </Button>

          {!user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Please log in to test database notifications
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="space-y-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium text-foreground">Setup Required:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>Apply the database migration in Supabase Dashboard</li>
            <li>Copy `supabase/migrations/20250912000004_comprehensive_notification_system.sql`</li>
            <li>Run it in SQL Editor to create notification functions</li>
            <li>Test each notification type above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

export default NotificationTester;