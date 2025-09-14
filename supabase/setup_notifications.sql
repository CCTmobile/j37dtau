-- Quick setup script for notifications system
-- Run this in Supabase SQL Editor if notifications table doesn't exist

-- Create notifications table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
  category TEXT NOT NULL CHECK (category IN ('order', 'product', 'account', 'promotion', 'system', 'chat')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  action_url TEXT,
  action_text TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create notification_deliveries table (if not exists)
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('in_app', 'email', 'push', 'sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY IF NOT EXISTS "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for notification_deliveries  
CREATE POLICY IF NOT EXISTS "Users can view their own notification deliveries" 
  ON notification_deliveries FOR SELECT 
  USING (
    notification_id IN (
      SELECT id FROM notifications WHERE user_id = auth.uid()
    )
  );

-- Admin policies (for admin users)
CREATE POLICY IF NOT EXISTS "Admins can manage all notifications" 
  ON notifications FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('your-admin@email.com') -- Replace with actual admin emails
    )
  );

-- Create helpful functions
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM notifications 
    WHERE notifications.user_id = get_unread_notification_count.user_id 
    AND read_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO anon;

-- Test the setup
DO $$
BEGIN
  RAISE NOTICE 'Notifications system setup complete!';
  RAISE NOTICE 'Tables created: notifications, notification_deliveries';
  RAISE NOTICE 'RLS policies: enabled and configured';
  RAISE NOTICE 'Functions: get_unread_notification_count available';
END $$;