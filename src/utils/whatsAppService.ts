// WhatsApp Integration Service - Business API integration for external messaging
// This provides WhatsApp routing for customers who prefer WhatsApp over web chat

import { supabase } from './supabase/client';

// =======================================
// WHATSAPP BUSINESS API CONFIGURATION
// =======================================

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  webhookToken: string;
  businessPhoneNumber: string;
}

// These would come from environment variables in production
const WHATSAPP_CONFIG: WhatsAppConfig = {
  phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '',
  accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '',
  webhookToken: import.meta.env.VITE_WHATSAPP_WEBHOOK_TOKEN || '',
  businessPhoneNumber: import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER || '+27735514705'
};

// Development mode fallback check
const isDevelopment = import.meta.env.DEV;
if (isDevelopment && !WHATSAPP_CONFIG.phoneNumberId) {
  console.log('WhatsApp Business API not configured for development. Messages will be logged only.');
}

// =======================================
// WHATSAPP MESSAGE TYPES
// =======================================

interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'template' | 'interactive';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
  interactive?: {
    type: 'button' | 'list';
    body: {
      text: string;
    };
    action: {
      buttons?: any[];
      sections?: any[];
    };
  };
}

interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: string;
}

// =======================================
// WHATSAPP SERVICE CLASS
// =======================================

export class WhatsAppService {
  private static instance: WhatsAppService;
  private config: WhatsAppConfig;

  private constructor() {
    this.config = WHATSAPP_CONFIG;
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  // =======================================
  // CONFIGURATION METHODS
  // =======================================

  public isConfigured(): boolean {
    return !!(
      this.config.phoneNumberId &&
      this.config.accessToken &&
      this.config.businessPhoneNumber
    );
  }

  public updateConfig(config: Partial<WhatsAppConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // =======================================
  // MESSAGE SENDING METHODS
  // =======================================

  public async sendTextMessage(to: string, message: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('WhatsApp not configured, logging message instead:', { to, message });
      return this.logWhatsAppMessage(to, message, 'outbound');
    }

    try {
      const whatsAppMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(whatsAppMessage)
        }
      );

      if (response.ok) {
        // Log successful message to database
        await this.logWhatsAppMessage(to, message, 'outbound');
        return true;
      } else {
        const error = await response.text();
        console.error('WhatsApp API Error:', error);
        return false;
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  public async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: any[]
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('WhatsApp not configured, logging template message instead:', { to, templateName });
      return this.logWhatsAppMessage(to, `Template: ${templateName}`, 'outbound');
    }

    try {
      const whatsAppMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components || []
        }
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(whatsAppMessage)
        }
      );

      if (response.ok) {
        await this.logWhatsAppMessage(to, `Template: ${templateName}`, 'outbound');
        return true;
      } else {
        const error = await response.text();
        console.error('WhatsApp Template API Error:', error);
        return false;
      }
    } catch (error) {
      console.error('Error sending WhatsApp template:', error);
      return false;
    }
  }

  // =======================================
  // WEBHOOK PROCESSING
  // =======================================

  public async processWebhookMessage(webhookData: any): Promise<boolean> {
    try {
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages) {
        return true; // Not a message webhook
      }

      const message: WhatsAppWebhookMessage = value.messages[0];
      const contact = value.contacts?.[0];

      if (message.type === 'text' && message.text?.body) {
        // Log incoming message
        await this.logWhatsAppMessage(
          message.from,
          message.text.body,
          'inbound'
        );

        // Find or create conversation for this phone number
        await this.handleIncomingMessage(
          message.from,
          message.text.body,
          contact?.profile?.name || 'WhatsApp User'
        );

        return true;
      }

      return true;
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      return false;
    }
  }

  // =======================================
  // CONVERSATION INTEGRATION
  // =======================================

  private async handleIncomingMessage(
    phoneNumber: string,
    messageText: string,
    userName: string
  ): Promise<void> {
    try {
      // Find existing customer by phone number or create new one
      let customer = await this.findCustomerByPhone(phoneNumber);
      
      if (!customer) {
        customer = await this.createWhatsAppCustomer(phoneNumber, userName);
      }

      if (!customer) {
        console.error('Failed to create/find customer for WhatsApp message');
        return;
      }

      // Find or create conversation
      const conversation = await this.findOrCreateWhatsAppConversation(customer.id, phoneNumber);
      
      if (!conversation) {
        console.error('Failed to create/find conversation for WhatsApp message');
        return;
      }

      // Add message to conversation
      await this.addMessageToConversation(
        conversation.id,
        customer.id,
        messageText,
        'whatsapp'
      );

    } catch (error) {
      console.error('Error handling incoming WhatsApp message:', error);
    }
  }

  // =======================================
  // DATABASE INTEGRATION METHODS
  // =======================================

  private async logWhatsAppMessage(
    phoneNumber: string,
    message: string,
    direction: 'inbound' | 'outbound'
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('whatsapp_messages')
        .insert({
          phone_number: this.formatPhoneNumber(phoneNumber),
          message_content: message,
          direction,
          status: 'sent',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging WhatsApp message:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in logWhatsAppMessage:', error);
      return false;
    }
  }

  private async findCustomerByPhone(phoneNumber: string): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('phone', this.formatPhoneNumber(phoneNumber))
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error finding customer by phone:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in findCustomerByPhone:', error);
      return null;
    }
  }

  private async createWhatsAppCustomer(phoneNumber: string, userName: string): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('users')
        .insert({
          phone: this.formatPhoneNumber(phoneNumber),
          name: userName,
          email: `whatsapp_${phoneNumber.replace(/\D/g, '')}@temp.email`,
          source: 'whatsapp',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating WhatsApp customer:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createWhatsAppCustomer:', error);
      return null;
    }
  }

  private async findOrCreateWhatsAppConversation(customerId: string, phoneNumber: string): Promise<any> {
    try {
      // Try to find existing open conversation
      const { data: existingConversation } = await (supabase as any)
        .from('chat_conversations')
        .select('*')
        .eq('customer_id', customerId)
        .in('status', ['open', 'assigned'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingConversation) {
        return existingConversation;
      }

      // Create new conversation
      const { data: newConversation, error } = await (supabase as any)
        .from('chat_conversations')
        .insert({
          customer_id: customerId,
          subject: `WhatsApp Chat - ${phoneNumber}`,
          status: 'open',
          priority: 2,
          source: 'whatsapp',
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating WhatsApp conversation:', error);
        return null;
      }

      return newConversation;
    } catch (error) {
      console.error('Error in findOrCreateWhatsAppConversation:', error);
      return null;
    }
  }

  private async addMessageToConversation(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: string = 'whatsapp'
  ): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding message to conversation:', error);
        return null;
      }

      // Update conversation last_message_at
      await (supabase as any)
        .from('chat_conversations')
        .update({
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error in addMessageToConversation:', error);
      return null;
    }
  }

  // =======================================
  // UTILITY METHODS
  // =======================================

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming South Africa +27)
    if (cleaned.length === 9 && cleaned.startsWith('7')) {
      return '+27' + cleaned;
    } else if (cleaned.length === 10 && cleaned.startsWith('07')) {
      return '+27' + cleaned.substring(1);
    } else if (cleaned.length === 11 && cleaned.startsWith('27')) {
      return '+' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('27')) {
      return '+' + cleaned;
    }
    
    return phoneNumber; // Return as-is if format is unclear
  }

  public getBusinessPhoneNumber(): string {
    return this.config.businessPhoneNumber;
  }

  // =======================================
  // TEMPLATE METHODS FOR COMMON MESSAGES
  // =======================================

  public async sendWelcomeMessage(to: string, customerName?: string): Promise<boolean> {
    const message = customerName 
      ? `Hi ${customerName}! 👋 Welcome to Rosémama Clothing. How can we help you today?`
      : `Hi! 👋 Welcome to Rosémama Clothing. How can we help you today?`;

    return this.sendTextMessage(to, message);
  }

  public async sendOrderConfirmation(to: string, orderNumber: string): Promise<boolean> {
    const message = `✅ Order confirmation: Your order #${orderNumber} has been confirmed! We'll send you tracking details soon. Thank you for shopping with Rosémama Clothing!`;
    
    return this.sendTextMessage(to, message);
  }

  public async sendShippingUpdate(to: string, orderNumber: string, trackingNumber: string): Promise<boolean> {
    const message = `📦 Shipping update: Your order #${orderNumber} is on its way! Track your package: ${trackingNumber}`;
    
    return this.sendTextMessage(to, message);
  }
}

// =======================================
// CONVENIENCE FUNCTIONS
// =======================================

export const whatsAppService = WhatsAppService.getInstance();

export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  return whatsAppService.sendTextMessage(phoneNumber, message);
}

export async function routeToWhatsApp(conversationId: string, customerPhone: string): Promise<boolean> {
  try {
    const message = `Hi! This is Rosémama Clothing support. We received your message and we'll continue our conversation here on WhatsApp. How can we help you today?`;
    
    const success = await whatsAppService.sendTextMessage(customerPhone, message);
    
    if (success) {
      // Update conversation to indicate it was routed to WhatsApp
      await (supabase as any)
        .from('chat_conversations')
        .update({
          status: 'routed_whatsapp',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
    }
    
    return success;
  } catch (error) {
    console.error('Error routing to WhatsApp:', error);
    return false;
  }
}

export default WhatsAppService;