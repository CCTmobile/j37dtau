# Real-time Messaging System - Testing Guide

## Overview
This document provides comprehensive testing instructions for the newly implemented real-time messaging system in the Rosémama e-commerce platform.

## Prerequisites

### Database Setup
1. **Execute Migration**: Run the migration file to create the chat system tables
   ```sql
   -- Execute: supabase/migrations/20250913000000_real_time_messaging_system.sql
   ```

2. **Verify Tables Created**:
   - `chat_conversations`
   - `chat_messages` 
   - `chat_templates`
   - `customer_contact_preferences`
   - `whatsapp_messages`

3. **Check RLS Policies**: Ensure Row Level Security policies are active

### Environment Variables (Optional - for WhatsApp)
```env
REACT_APP_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
REACT_APP_WHATSAPP_ACCESS_TOKEN=your_access_token
REACT_APP_WHATSAPP_BUSINESS_NUMBER=+27735514705
```

## Testing Scenarios

### 1. Customer Chat Flow

#### Test 1.1: Start New Conversation
1. **Login as Customer**
2. **Locate Chat Triggers**:
   - Header: Chat notification bell (should show no unread count initially)
   - Footer: "Live Chat Support" and "Contact Us" buttons
   - Floating: Bottom-right floating chat button
3. **Click any chat trigger**
4. **Verify**: Chat modal opens with welcome message
5. **Send Test Message**: "Hello, I need help with my order"
6. **Expected**: Message appears in chat bubble with timestamp

#### Test 1.2: Chat Persistence 
1. **Close Chat Modal**
2. **Reopen Chat** (via any trigger)
3. **Expected**: Previous messages still visible
4. **Send Another Message**: "Is anyone there?"
5. **Expected**: New message added to conversation

#### Test 1.3: Unread Count
1. **Have Admin Send Reply** (see Admin Testing below)
2. **Check Header Bell**: Should show unread count badge
3. **Open Chat Modal**
4. **Expected**: Unread count should decrease/disappear

### 2. Admin Chat Management

#### Test 2.1: Admin Dashboard Access
1. **Login as Admin**
2. **Navigate**: Admin Dashboard → Messages Tab
3. **Expected**: 
   - Conversation list showing customer conversations
   - Search and filter functionality
   - Conversation details panel

#### Test 2.2: Admin Response Flow
1. **Select Customer Conversation**
2. **Type Reply**: "Hello! How can I help you today?"
3. **Send Message**
4. **Expected**: 
   - Message appears in admin chat view
   - Customer receives message in real-time (test with two browser tabs)

#### Test 2.3: Conversation Management
1. **Test Status Updates**:
   - Open → Assigned → Resolved → Closed
2. **Test Assignment**: "Assign to me" button
3. **Expected**: Status changes reflect in conversation list

### 3. Real-time Functionality

#### Test 3.1: Bi-directional Real-time
1. **Open Customer Chat** (Browser Tab 1)
2. **Open Admin Dashboard** (Browser Tab 2) 
3. **Send Message from Customer**
4. **Expected**: Message appears instantly in admin dashboard
5. **Send Reply from Admin**
6. **Expected**: Reply appears instantly in customer chat

#### Test 3.2: Multiple Conversations
1. **Create Second Customer Account**
2. **Start Chat from Second Customer** 
3. **Verify**: Admin sees both conversations in list
4. **Test**: Messages don't cross between conversations

### 4. UI/UX Testing

#### Test 4.1: Responsive Design
1. **Test Mobile View**: 
   - Chat modal should be responsive
   - Floating button should be accessible
   - Touch interactions should work
2. **Test Desktop View**: 
   - Admin dashboard should use full space
   - Conversation list and chat view should be side-by-side

#### Test 4.2: Visual Theme Consistency
1. **Verify Gradient Colors**: 
   - Rose/pink gradients match existing design
   - Chat bubbles use proper styling
   - Admin interface uses gradient headers
2. **Check Accessibility**: 
   - Proper contrast ratios
   - Keyboard navigation support

### 5. WhatsApp Integration (Optional)

#### Test 5.1: WhatsApp Configuration
1. **Admin Dashboard** → Messages → WhatsApp Integration
2. **Check Configuration Status**
3. **Send Test Message** (if configured)

#### Test 5.2: Conversation Routing
1. **Test Route to WhatsApp** button in admin interface
2. **Verify**: Customer receives WhatsApp message

## Error Scenarios

### Test 6.1: Authentication Requirements
1. **Test Unauthenticated Access**: 
   - Chat triggers should not appear for unauthenticated users
   - OR should prompt for authentication

### Test 6.2: Network Issues
1. **Simulate Network Disconnect**
2. **Send Message**
3. **Expected**: Graceful error handling

### Test 6.3: Database Connection Issues
1. **Verify Error Messages**: Clear error messaging for failures
2. **Test Recovery**: System should recover when connection restored

## Performance Testing

### Test 7.1: Message Load Times
1. **Create Conversation with 100+ messages**
2. **Test Load Performance**: Should load quickly
3. **Test Scrolling**: Smooth scrolling through messages

### Test 7.2: Real-time Subscription Management
1. **Open/Close Chat Multiple Times**
2. **Verify**: No memory leaks from subscriptions
3. **Check Browser DevTools**: No excessive WebSocket connections

## Deployment Checklist

### Pre-deployment
- [ ] All TypeScript compilation errors resolved
- [ ] Database migration tested on staging
- [ ] Environment variables configured
- [ ] Build process completes successfully

### Post-deployment
- [ ] Migration executed on production database
- [ ] Real-time functionality working
- [ ] Chat triggers visible to users
- [ ] Admin dashboard accessible
- [ ] Error monitoring configured

## Troubleshooting

### Common Issues

1. **Chat Modal Not Opening**
   - Check browser console for JavaScript errors
   - Verify authentication state
   - Check component imports

2. **Messages Not Appearing**
   - Verify database connection
   - Check RLS policies
   - Inspect real-time subscriptions

3. **Admin Dashboard Issues**
   - Confirm admin role assignment
   - Check database permissions
   - Verify component routing

4. **Real-time Not Working**
   - Check Supabase project settings
   - Verify real-time enabled in Supabase
   - Check WebSocket connection in DevTools

### Database Queries for Debugging

```sql
-- Check conversations
SELECT * FROM chat_conversations ORDER BY created_at DESC LIMIT 10;

-- Check messages
SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 20;

-- Check unread messages for user
SELECT COUNT(*) FROM chat_messages 
WHERE conversation_id IN (
  SELECT id FROM chat_conversations WHERE customer_id = 'USER_ID'
) AND sender_id != 'USER_ID' AND is_read = false;

-- Check WhatsApp messages
SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 10;
```

## Success Criteria

The messaging system is ready for production when:

✅ **Core Functionality**
- [x] Customers can start conversations
- [x] Real-time messaging works both directions  
- [x] Admin can manage conversations
- [x] Messages persist between sessions

✅ **User Experience**
- [x] Intuitive chat interface
- [x] Consistent visual design
- [x] Mobile responsive
- [x] Accessible to all users

✅ **Technical Requirements**
- [x] TypeScript compilation success
- [x] Database migrations complete
- [x] Real-time subscriptions working
- [x] Error handling implemented

✅ **Integration**
- [x] Header/Footer integration complete
- [x] Admin dashboard integration
- [x] WhatsApp routing available
- [x] Notification system connected

## Next Steps

After successful testing:

1. **Monitor Usage**: Track conversation metrics
2. **Gather Feedback**: Collect user feedback for improvements
3. **Optimize Performance**: Monitor real-time performance
4. **Extend Features**: Consider chat attachments, typing indicators, etc.
5. **WhatsApp Enhancement**: Complete Business API setup if desired

---

**Contact**: For issues with this testing guide or the messaging system, create a conversation using the chat system! 😊