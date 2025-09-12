# Notification System Setup Guide

## Overview
This guide will help you implement the comprehensive notification system with database backend, real-time updates, and cross-platform delivery.

## Database Setup

### 1. Apply the Notification Migration
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/20250912000004_comprehensive_notification_system.sql`
4. Execute the migration

This migration creates:
- `notifications` table for storing all notifications
- `notification_deliveries` table for tracking delivery status
- PostgreSQL functions for notification management
- Triggers for automatic order status notifications
- RLS policies for security

### 2. Verify Database Setup
Run this query in your Supabase SQL Editor to verify the setup:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'notification_deliveries');

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_name LIKE '%notification%';
```

## Frontend Integration

### 3. Service Worker Registration
The service worker (`public/sw.js`) is automatically registered when the app loads. It handles:
- Push notifications in the background
- Offline notification caching
- Notification click handling

### 4. Notification Components
The system includes several UI components:

- **NotificationCenter**: Main notification management interface in the header
- **ToastProvider**: Immediate visual feedback for notifications  
- **ServiceWorkerManager**: Handles push notification registration

### 5. Real-time Features
The notification service automatically:
- Subscribes to real-time database changes
- Shows browser push notifications
- Updates unread counts instantly
- Syncs notification preferences

## Usage Examples

### Creating Notifications (Backend)
```sql
-- Create a system notification
SELECT create_notification(
  p_user_id => 'user-uuid',
  p_type => 'system',
  p_category => 'maintenance',
  p_title => 'System Maintenance',
  p_message => 'Scheduled maintenance will occur tonight',
  p_priority => 2
);

-- Send security alert
SELECT send_security_alert(
  p_user_id => 'user-uuid',
  p_alert_type => 'login_attempt',
  p_description => 'New login from unknown device',
  p_ip_address => '192.168.1.1'
);
```

### Using Notification Service (Frontend)
```typescript
import { notificationService } from '../utils/supabase/notificationService';

// Get user notifications
const notifications = await notificationService.getUserNotifications(userId);

// Mark as read
await notificationService.markAsRead(notificationId, userId);

// Update preferences
await notificationService.updateNotificationPreferences(userId, {
  email_notifications: true,
  push_notifications: true
});

// Subscribe to real-time updates
const unsubscribe = notificationService.subscribeToNotifications(
  userId,
  (newNotification) => {
    console.log('New notification:', newNotification);
  }
);
```

### Using Toast Notifications
```typescript
import { useToast } from '../components/notifications/ToastProvider';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  const handleSuccess = () => {
    showSuccess('Order Placed', 'Your order has been successfully placed!');
  };
  
  const handleError = () => {
    showError('Payment Failed', 'There was an issue processing your payment.');
  };
}
```

## Browser Push Notifications

### 6. Push Notification Setup
1. The service worker handles push notifications automatically
2. Users can enable/disable in the notification settings
3. Permission is requested when first accessing notification preferences

### 7. Testing Push Notifications
To test push notifications:
1. Open the app in a browser
2. Click the notification bell icon in the header
3. Go to Settings tab
4. Enable push notifications
5. Create a test notification in your Supabase database

## Admin Features

### 8. Admin Notification Management
Admins can:
- View all notifications in the admin dashboard
- Send system-wide notifications
- Monitor notification delivery status
- Manage user notification preferences

### 9. Integration with Existing Admin Settings
The notification preferences are integrated into the existing `AdminAccountSettings` component and sync with the database.

## Responsive Design

### 10. Mobile Support
The notification system is fully responsive:
- Notification center works on mobile devices
- Toast notifications adapt to screen size
- Push notifications work on mobile browsers
- Service worker provides offline support

## Security Features

### 11. Row Level Security (RLS)
All notification tables have RLS policies:
- Users can only see their own notifications
- Admins have broader access for management
- Delivery tracking is secure and private

### 12. Data Privacy
- Notifications expire automatically based on settings
- Personal data is protected with RLS
- Push subscriptions are managed securely

## Troubleshooting

### Common Issues
1. **TypeScript Errors**: Expected until database migration is applied
2. **Push Permission Denied**: Guide users to enable in browser settings
3. **Service Worker Issues**: Check browser developer tools for registration errors
4. **Real-time Not Working**: Verify Supabase RLS policies and authentication

### Debug Tools
- Browser DevTools → Application → Service Workers
- Browser DevTools → Application → Notifications
- Supabase Dashboard → Logs for backend errors
- Console logs for real-time subscription status

## Next Steps

1. Apply the database migration
2. Test notification creation and delivery
3. Customize notification styles and branding
4. Set up email notification backend (optional)
5. Configure push notification server keys for production

The notification system is now ready for comprehensive testing and deployment!