-- Comprehensive Notification System for Rosémama Clothing
-- This migration creates the complete notification infrastructure including:
-- 1. Notifications table for storing all notifications
-- 2. Notification delivery tracking
-- 3. Functions for creating and managing notifications
-- 4. Triggers for automatic notifications on key events

-- Create notifications table for storing all notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'push', 'system', 'order', 'security')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('order_created', 'order_shipped', 'order_delivered', 'order_cancelled', 'security_alert', 'system_maintenance', 'new_product', 'price_change')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional data for the notification
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- For temporary notifications
  priority INTEGER DEFAULT 1 CHECK (priority IN (1, 2, 3)), -- 1 = low, 2 = medium, 3 = high
  action_url TEXT, -- Optional URL for action buttons
  action_text VARCHAR(100) -- Optional text for action buttons
);

-- Create delivery tracking table
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('email', 'push', 'in_app')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  external_id VARCHAR(255), -- For tracking with external services
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries(status);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications" ON notifications
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications

CREATE POLICY "Users can update their own notifications (read status)" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for notification deliveries (admin only for delivery tracking)
CREATE POLICY "Admins can view delivery tracking" ON notification_deliveries
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "System can manage delivery tracking" ON notification_deliveries
  FOR ALL USING (true); -- Allow system to manage delivery tracking

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_category VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_priority INTEGER DEFAULT 1,
  p_action_url TEXT DEFAULT NULL,
  p_action_text VARCHAR(100) DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  user_prefs RECORD;
BEGIN
  -- Get user notification preferences
  SELECT * INTO user_prefs 
  FROM notification_preferences 
  WHERE user_id = p_user_id;
  
  -- Create the notification
  INSERT INTO notifications (
    user_id, type, category, title, message, data, 
    priority, action_url, action_text, expires_at
  ) VALUES (
    p_user_id, p_type, p_category, p_title, p_message, p_data,
    p_priority, p_action_url, p_action_text, p_expires_at
  ) RETURNING id INTO notification_id;
  
  -- Schedule delivery based on user preferences
  IF user_prefs IS NOT NULL THEN
    -- Email delivery
    IF (p_type = 'email' AND user_prefs.email_notifications) OR
       (p_type = 'system' AND user_prefs.system_alerts) OR
       (p_type = 'order' AND user_prefs.order_alerts) OR
       (p_type = 'security' AND user_prefs.security_alerts) THEN
      INSERT INTO notification_deliveries (notification_id, delivery_method, status)
      VALUES (notification_id, 'email', 'pending');
    END IF;
    
    -- Push notification delivery
    IF (p_type = 'push' AND user_prefs.push_notifications) OR
       (p_type = 'system' AND user_prefs.system_alerts) OR
       (p_type = 'order' AND user_prefs.order_alerts) OR
       (p_type = 'security' AND user_prefs.security_alerts) THEN
      INSERT INTO notification_deliveries (notification_id, delivery_method, status)
      VALUES (notification_id, 'push', 'pending');
    END IF;
    
    -- In-app notification (always created)
    INSERT INTO notification_deliveries (notification_id, delivery_method, status)
    VALUES (notification_id, 'in_app', 'delivered');
  END IF;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET read_at = NOW()
  WHERE id = p_notification_id 
    AND user_id = p_user_id 
    AND read_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = p_user_id
      AND read_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user notifications with pagination
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  id UUID,
  type VARCHAR(50),
  category VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  data JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER,
  action_url TEXT,
  action_text VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id, n.type, n.category, n.title, n.message, n.data,
    n.read_at, n.created_at, n.priority, n.action_url, n.action_text
  FROM notifications n
  WHERE n.user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (NOT p_unread_only OR read_at IS NULL)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete notifications older than 90 days or expired
  DELETE FROM notifications
  WHERE (created_at < NOW() - INTERVAL '90 days')
     OR (expires_at IS NOT NULL AND expires_at < NOW());
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for order notifications
CREATE OR REPLACE FUNCTION trigger_order_notification()
RETURNS TRIGGER AS $$
DECLARE
  order_user_id UUID;
  notification_title VARCHAR(255);
  notification_message TEXT;
BEGIN
  -- Get the user_id for the order
  order_user_id := NEW.user_id;
  
  -- Create notification based on order status
  CASE NEW.status
    WHEN 'confirmed' THEN
      notification_title := 'Order Confirmed';
      notification_message := 'Your order #' || NEW.id || ' has been confirmed and is being processed.';
    WHEN 'shipped' THEN
      notification_title := 'Order Shipped';
      notification_message := 'Your order #' || NEW.id || ' has been shipped and is on its way to you.';
    WHEN 'delivered' THEN
      notification_title := 'Order Delivered';
      notification_message := 'Your order #' || NEW.id || ' has been delivered. Thank you for shopping with us!';
    WHEN 'cancelled' THEN
      notification_title := 'Order Cancelled';
      notification_message := 'Your order #' || NEW.id || ' has been cancelled. If you have any questions, please contact support.';
    ELSE
      RETURN NEW; -- No notification for other statuses
  END CASE;
  
  -- Create the notification
  PERFORM create_notification(
    order_user_id,
    'order',
    'order_' || NEW.status,
    notification_title,
    notification_message,
    jsonb_build_object('order_id', NEW.id, 'total_amount', NEW.total_amount),
    2, -- Medium priority
    '/orders/' || NEW.id,
    'View Order'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status changes
CREATE TRIGGER order_status_notification_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_order_notification();

-- Function to send security alert
CREATE OR REPLACE FUNCTION send_security_alert(
  p_user_id UUID,
  p_alert_type VARCHAR(100),
  p_description TEXT,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  notification_id := create_notification(
    p_user_id,
    'security',
    'security_alert',
    'Security Alert: ' || p_alert_type,
    p_description,
    jsonb_build_object('alert_type', p_alert_type, 'ip_address', p_ip_address, 'timestamp', NOW()),
    3, -- High priority
    '/profile/security',
    'Review Security'
  );
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send system maintenance notifications
CREATE OR REPLACE FUNCTION send_system_notification(
  p_title VARCHAR(255),
  p_message TEXT,
  p_priority INTEGER DEFAULT 1,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Send to all users with system alerts enabled
  FOR user_record IN 
    SELECT u.id 
    FROM users u
    JOIN notification_preferences np ON u.id = np.user_id
    WHERE np.system_alerts = true
  LOOP
    PERFORM create_notification(
      user_record.id,
      'system',
      'system_maintenance',
      p_title,
      p_message,
      '{}',
      p_priority,
      NULL,
      NULL,
      p_expires_at
    );
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION send_security_alert TO authenticated;
GRANT EXECUTE ON FUNCTION send_system_notification TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO authenticated;