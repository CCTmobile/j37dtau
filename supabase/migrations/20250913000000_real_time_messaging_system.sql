-- Real-Time Messaging System Database Schema
-- This creates a comprehensive messaging system with admin chat capabilities
-- Includes WhatsApp integration support and notification triggers

-- =======================================
-- MAIN MESSAGING TABLES
-- =======================================

-- Chat conversations between users and admins
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject VARCHAR(255), -- Optional subject for the conversation
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed')),
  priority INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3)), -- 1=high, 2=medium, 3=low
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- Optional: link to specific order
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}' -- For additional conversation data
);

-- Individual messages within conversations
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'order_link', 'system')),
  attachment_url TEXT, -- For file uploads
  attachment_type VARCHAR(100), -- MIME type for attachments
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  whatsapp_message_id VARCHAR(255), -- For WhatsApp integration tracking
  reply_to_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL, -- For threaded replies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}' -- For additional message data
);

-- Quick reply templates for admins
CREATE TABLE chat_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general', -- general, order_help, shipping, returns, etc.
  is_shared BOOLEAN DEFAULT FALSE, -- If true, available to all admins
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer contact preferences
CREATE TABLE customer_contact_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  whatsapp_number VARCHAR(20), -- Customer's WhatsApp number
  preferred_contact_method VARCHAR(50) DEFAULT 'chat' CHECK (preferred_contact_method IN ('chat', 'email', 'whatsapp', 'phone')),
  timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
  business_hours_only BOOLEAN DEFAULT TRUE,
  allow_marketing_messages BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp integration tracking
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  whatsapp_message_id VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  webhook_data JSONB, -- Store webhook response data
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================
-- INDEXES FOR PERFORMANCE
-- =======================================

-- Chat conversations indexes
CREATE INDEX idx_chat_conversations_customer_id ON chat_conversations(customer_id);
CREATE INDEX idx_chat_conversations_admin_id ON chat_conversations(admin_id);
CREATE INDEX idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX idx_chat_conversations_last_message_at ON chat_conversations(last_message_at DESC);
CREATE INDEX idx_chat_conversations_order_id ON chat_conversations(order_id);

-- Chat messages indexes
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_is_read ON chat_messages(is_read) WHERE is_read = FALSE;

-- WhatsApp messages indexes
CREATE INDEX idx_whatsapp_messages_phone_number ON whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);

-- =======================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================

-- Enable RLS on all tables
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contact_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Chat conversations policies
CREATE POLICY "Users can view their own conversations" ON chat_conversations
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() = admin_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can update conversations" ON chat_conversations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Chat messages policies
CREATE POLICY "Users can view messages in their conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = conversation_id 
      AND (customer_id = auth.uid() OR admin_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = conversation_id 
      AND (customer_id = auth.uid() OR admin_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (
    sender_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Chat templates policies
CREATE POLICY "Admins can manage templates" ON chat_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view shared templates" ON chat_templates
  FOR SELECT USING (
    is_shared = TRUE AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Customer contact preferences policies
CREATE POLICY "Users can manage their own contact preferences" ON customer_contact_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all contact preferences" ON customer_contact_preferences
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- WhatsApp messages policies
CREATE POLICY "Admins can manage WhatsApp messages" ON whatsapp_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =======================================
-- FUNCTIONS AND TRIGGERS
-- =======================================

-- Function to update conversation last_message_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations 
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when new message is added
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE chat_messages 
  SET is_read = TRUE,
      read_at = NOW(),
      updated_at = NOW()
  WHERE conversation_id = p_conversation_id 
    AND sender_id != p_user_id 
    AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM chat_messages cm
  JOIN chat_conversations cc ON cm.conversation_id = cc.id
  WHERE (cc.customer_id = p_user_id OR cc.admin_id = p_user_id)
    AND cm.sender_id != p_user_id
    AND cm.is_read = FALSE;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when new message is sent
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  conversation_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get conversation details
  SELECT * INTO conversation_record
  FROM chat_conversations 
  WHERE id = NEW.conversation_id;
  
  -- Determine recipient
  IF NEW.sender_id = conversation_record.customer_id THEN
    -- Message from customer to admin
    recipient_id := conversation_record.admin_id;
    notification_title := 'New Customer Message';
    notification_message := 'You have a new message from ' || (
      SELECT name FROM users WHERE id = conversation_record.customer_id
    );
  ELSE
    -- Message from admin to customer
    recipient_id := conversation_record.customer_id;
    notification_title := 'New Message from Support';
    notification_message := 'You have a new message from our support team';
  END IF;
  
  -- Create notification if recipient exists
  IF recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, category, title, message, data)
    VALUES (
      recipient_id,
      'system',
      'message',
      notification_title,
      notification_message,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification for new messages
CREATE TRIGGER trigger_create_message_notification
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Function to assign conversation to admin
CREATE OR REPLACE FUNCTION assign_conversation_to_admin(
  p_conversation_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_admin_id AND role = 'admin') THEN
    RETURN FALSE;
  END IF;
  
  UPDATE chat_conversations 
  SET admin_id = p_admin_id,
      status = 'assigned',
      updated_at = NOW()
  WHERE id = p_conversation_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================================
-- SEED DATA FOR TESTING
-- =======================================

-- Insert some default chat templates for admins
INSERT INTO chat_templates (admin_id, title, content, category, is_shared) VALUES
(
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  'Welcome Message',
  'Hi! Thank you for contacting Rosémama support. How can I help you today?',
  'general',
  TRUE
),
(
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  'Order Status Inquiry',
  'I''ll be happy to check your order status for you. Could you please provide your order number?',
  'order_help',
  TRUE
),
(
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  'Shipping Information',
  'Our standard shipping takes 3-5 business days within South Africa. You''ll receive a tracking number once your order ships.',
  'shipping',
  TRUE
),
(
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  'Return Policy',
  'We offer returns within 72 hrs of purchase. Items must be unworn and in original condition. Would you like me to start a return for you?',
  'returns',
  TRUE
),
(
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  'Thank You & Close',
  'Thank you for contacting Rosémama! Is there anything else I can help you with today?',
  'general',
  TRUE
);

-- =======================================
-- REAL-TIME SUBSCRIPTIONS SETUP
-- =======================================

-- Create publication for real-time features
-- This will be used by Supabase real-time subscriptions

-- Enable real-time for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;

-- Enable real-time for messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Add comments for documentation
COMMENT ON TABLE chat_conversations IS 'Main chat conversations between customers and admins';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat conversations';
COMMENT ON TABLE chat_templates IS 'Quick reply templates for admin efficiency';
COMMENT ON TABLE customer_contact_preferences IS 'Customer communication preferences and WhatsApp numbers';
COMMENT ON TABLE whatsapp_messages IS 'WhatsApp integration tracking and status';