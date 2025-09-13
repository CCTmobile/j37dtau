// WhatsAppIntegration.tsx - Admin interface for WhatsApp Business API configuration
// Beautiful gradient-themed component for admin dashboard

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Phone, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Send,
  History,
  Users,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { whatsAppService, sendWhatsAppMessage, routeToWhatsApp } from '../../utils/whatsAppService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

export default function WhatsAppIntegration() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from Rosémama Clothing.');
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState({
    totalMessages: 0,
    activeChats: 0,
    routedConversations: 0
  });

  useEffect(() => {
    // Check if WhatsApp is configured
    setIsConfigured(whatsAppService.isConfigured());
    
    // Load stats (in a real implementation, this would fetch from the database)
    // For now, we'll use dummy data
    setStats({
      totalMessages: 0,
      activeChats: 0,
      routedConversations: 0
    });
  }, []);

  const handleTestMessage = async () => {
    if (!testPhoneNumber.trim() || !testMessage.trim()) {
      toast.error('Please enter both phone number and message');
      return;
    }

    setIsSending(true);
    try {
      const success = await sendWhatsAppMessage(testPhoneNumber, testMessage);
      
      if (success) {
        toast.success('Test message sent successfully!');
        setTestPhoneNumber('');
        setTestMessage('Hello! This is a test message from Rosémama Clothing.');
      } else {
        toast.error('Failed to send test message');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error('Error sending test message');
    } finally {
      setIsSending(false);
    }
  };

  const handleRouteConversation = async (conversationId: string, customerPhone: string) => {
    try {
      const success = await routeToWhatsApp(conversationId, customerPhone);
      
      if (success) {
        toast.success('Conversation routed to WhatsApp successfully!');
      } else {
        toast.error('Failed to route conversation to WhatsApp');
      }
    } catch (error) {
      console.error('Error routing conversation:', error);
      toast.error('Error routing conversation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <MessageCircle className="h-8 w-8" />
              WhatsApp Business Integration
            </h2>
            <p className="text-green-100 mt-1">
              Connect with customers on their preferred messaging platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <Badge className="bg-white bg-opacity-20 text-white border-white/20">
                <CheckCircle className="h-4 w-4 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="bg-red-500/20 text-white border-red-300/20">
                <AlertCircle className="h-4 w-4 mr-1" />
                Not Configured
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      {!isConfigured && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700">
            <p className="mb-4">
              To enable WhatsApp integration, you need to configure the following environment variables:
            </p>
            <ul className="space-y-2 text-sm">
              <li><code className="bg-orange-100 px-2 py-1 rounded">REACT_APP_WHATSAPP_PHONE_NUMBER_ID</code></li>
              <li><code className="bg-orange-100 px-2 py-1 rounded">REACT_APP_WHATSAPP_ACCESS_TOKEN</code></li>
              <li><code className="bg-orange-100 px-2 py-1 rounded">REACT_APP_WHATSAPP_BUSINESS_NUMBER</code></li>
            </ul>
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
                onClick={() => window.open('https://developers.facebook.com/docs/whatsapp/cloud-api/get-started', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                WhatsApp Business API Setup Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Chats</p>
                <p className="text-2xl font-bold">{stats.activeChats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ArrowRight className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Routed Conversations</p>
                <p className="text-2xl font-bold">{stats.routedConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Message Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Test Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Phone Number</label>
            <Input
              type="tel"
              placeholder="+27735514705"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Include country code (e.g., +27 for South Africa)
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <textarea
              placeholder="Enter your test message..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          <Button
            onClick={handleTestMessage}
            disabled={!testPhoneNumber.trim() || !testMessage.trim() || isSending}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Message
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => toast.info('Message templates feature coming soon!')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Manage Message Templates
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => toast.info('WhatsApp analytics feature coming soon!')}
            >
              <History className="h-4 w-4 mr-2" />
              View Message History
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => toast.info('Webhook management feature coming soon!')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Webhooks
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open(`https://wa.me/${whatsAppService.getBusinessPhoneNumber().replace('+', '')}`, '_blank')}
            >
              <Phone className="h-4 w-4 mr-2" />
              Open Business WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Information</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h4 className="font-semibold mb-2">How WhatsApp Integration Works:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Customers can reach out via WhatsApp to your business number</li>
            <li>• Messages are automatically routed to the chat system</li>
            <li>• Admins can respond directly from the web dashboard</li>
            <li>• Conversations can be transferred between web chat and WhatsApp</li>
            <li>• Templates can be used for common responses and notifications</li>
          </ul>

          <h4 className="font-semibold mb-2 mt-4">Business Phone Number:</h4>
          <p className="text-sm">
            <code className="bg-gray-100 px-2 py-1 rounded">{whatsAppService.getBusinessPhoneNumber()}</code>
          </p>

          <p className="text-xs text-muted-foreground mt-4">
            This integration uses the WhatsApp Business API. Messages and data are handled according to 
            WhatsApp's privacy policy and your business data handling practices.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}