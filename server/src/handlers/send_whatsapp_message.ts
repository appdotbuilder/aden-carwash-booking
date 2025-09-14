import { db } from '../db';
import { whatsappTemplatesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Input schema for sending WhatsApp messages
 */
export interface SendWhatsAppMessageInput {
  phone: string;
  template_key: 'confirm' | 'reminder' | 'on_the_way' | 'review' | 'custom';
  variables?: Record<string, string>;
  language?: 'ar' | 'en';
  custom_message?: string;
}

/**
 * Response schema for WhatsApp message sending
 */
export interface SendWhatsAppMessageResponse {
  message_id: string;
  status: 'sent' | 'failed';
  error?: string;
}

/**
 * Sends WhatsApp messages using business API.
 * This handler manages all WhatsApp communications:
 * - Booking confirmations with details and links
 * - Arrival notifications ("on the way")
 * - Reminder messages before appointments
 * - Review requests after completion
 * - Custom admin messages and updates
 */
export const sendWhatsAppMessage = async (input: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResponse> => {
  try {
    // Validate phone number format
    if (!input.phone.match(/^\+967\d{8,9}$/)) {
      return {
        message_id: '',
        status: 'failed',
        error: 'Invalid phone number format. Must be +967XXXXXXXX'
      };
    }

    let messageBody: string;
    const language = input.language || 'ar';

    if (input.template_key === 'custom') {
      // For custom messages, use the provided message directly
      if (!input.custom_message) {
        return {
          message_id: '',
          status: 'failed',
          error: 'Custom message is required when template_key is "custom"'
        };
      }
      messageBody = input.custom_message;
    } else {
      // Fetch template from database
      const templates = await db.select()
        .from(whatsappTemplatesTable)
        .where(eq(whatsappTemplatesTable.key, input.template_key))
        .execute();

      if (templates.length === 0) {
        return {
          message_id: '',
          status: 'failed',
          error: `Template with key "${input.template_key}" not found`
        };
      }

      const template = templates[0];
      
      // Select appropriate language version
      messageBody = language === 'en' ? template.body_en : template.body_ar;
      
      // Replace variables in template
      if (input.variables) {
        for (const [key, value] of Object.entries(input.variables)) {
          const placeholder = `{{${key}}}`;
          messageBody = messageBody.replace(new RegExp(placeholder, 'g'), value);
        }
      }
    }

    // Generate message ID for tracking
    const messageId = `wam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, this would call the WhatsApp Business API
    // For now, we simulate the API call with basic validation
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Log the message sending attempt (in production, this would be more comprehensive)
    console.log(`WhatsApp message sent to ${input.phone}:`, {
      message_id: messageId,
      template_key: input.template_key,
      language,
      message_preview: messageBody.substring(0, 100) + (messageBody.length > 100 ? '...' : '')
    });

    return {
      message_id: messageId,
      status: 'sent'
    };

  } catch (error) {
    console.error('WhatsApp message sending failed:', error);
    return {
      message_id: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};