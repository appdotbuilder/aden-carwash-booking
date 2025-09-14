import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { whatsappTemplatesTable } from '../db/schema';
import { type SendWhatsAppMessageInput } from '../handlers/send_whatsapp_message';
import { sendWhatsAppMessage } from '../handlers/send_whatsapp_message';

// Test templates
const testTemplates = [
  {
    key: 'confirm',
    body_ar: 'تم تأكيد حجزك {{booking_id}} في {{service_name}} يوم {{date}}',
    body_en: 'Your booking {{booking_id}} for {{service_name}} on {{date}} is confirmed'
  },
  {
    key: 'reminder',
    body_ar: 'تذكير: موعدك {{service_name}} غداً في {{time}}',
    body_en: 'Reminder: Your {{service_name}} appointment tomorrow at {{time}}'
  },
  {
    key: 'on_the_way',
    body_ar: 'فريقنا في الطريق إليك. الوصول خلال {{eta}} دقيقة',
    body_en: 'Our team is on the way. Arriving in {{eta}} minutes'
  },
  {
    key: 'review',
    body_ar: 'نأمل أن تكون راضياً عن خدمتنا. يرجى تقييم الخدمة: {{review_link}}',
    body_en: 'We hope you enjoyed our service. Please rate us: {{review_link}}'
  }
];

describe('sendWhatsAppMessage', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test templates
    for (const template of testTemplates) {
      await db.insert(whatsappTemplatesTable).values(template).execute();
    }
  });
  
  afterEach(resetDB);

  it('should send message with confirm template in Arabic', async () => {
    const input: SendWhatsAppMessageInput = {
      phone: '+967777123456',
      template_key: 'confirm',
      variables: {
        booking_id: 'BK001',
        service_name: 'تنظيف السيارة',
        date: '2024-01-15'
      },
      language: 'ar'
    };

    const result = await sendWhatsAppMessage(input);

    expect(result.status).toEqual('sent');
    expect(result.message_id).toMatch(/^wam_\d+_[a-z0-9]+$/);
    expect(result.error).toBeUndefined();
  });

  it('should send message with confirm template in English', async () => {
    const input: SendWhatsAppMessageInput = {
      phone: '+967777123456',
      template_key: 'confirm',
      variables: {
        booking_id: 'BK001',
        service_name: 'Car Cleaning',
        date: '2024-01-15'
      },
      language: 'en'
    };

    const result = await sendWhatsAppMessage(input);

    expect(result.status).toEqual('sent');
    expect(result.message_id).toMatch(/^wam_\d+_[a-z0-9]+$/);
    expect(result.error).toBeUndefined();
  });

  it('should default to Arabic when no language specified', async () => {
    const input: SendWhatsAppMessageInput = {
      phone: '+967777123456',
      template_key: 'reminder',
      variables: {
        service_name: 'تنظيف السيارة',
        time: '2:00 PM'
      }
    };

    const result = await sendWhatsAppMessage(input);

    expect(result.status).toEqual('sent');
    expect(result.message_id).toMatch(/^wam_\d+_[a-z0-9]+$/);
    expect(result.error).toBeUndefined();
  });

  it('should handle message without variables', async () => {
    // Insert a simple template without variables
    await db.insert(whatsappTemplatesTable).values({
      key: 'simple',
      body_ar: 'رسالة بسيطة بدون متغيرات',
      body_en: 'Simple message without variables'
    }).execute();

    const input: SendWhatsAppMessageInput = {
      phone: '+967777123456',
      template_key: 'simple' as any,
      language: 'en'
    };

    const result = await sendWhatsAppMessage(input);

    expect(result.status).toEqual('sent');
    expect(result.message_id).toMatch(/^wam_\d+_[a-z0-9]+$/);
    expect(result.error).toBeUndefined();
  });

  it('should replace multiple variables in template', async () => {
    const input: SendWhatsAppMessageInput = {
      phone: '+967777123456',
      template_key: 'on_the_way',
      variables: {
        eta: '15'
      },
      language: 'en'
    };

    const result = await sendWhatsAppMessage(input);

    expect(result.status).toEqual('sent');
    expect(result.message_id).toMatch(/^wam_\d+_[a-z0-9]+$/);
    expect(result.error).toBeUndefined();
  });

  it('should send custom message', async () => {
    const input: SendWhatsAppMessageInput = {
      phone: '+967777123456',
      template_key: 'custom',
      custom_message: 'This is a custom admin message',
      language: 'en'
    };

    const result = await sendWhatsAppMessage(input);

    expect(result.status).toEqual('sent');
    expect(result.message_id).toMatch(/^wam_\d+_[a-z0-9]+$/);
    expect(result.error).toBeUndefined();
  });

  it('should fail with invalid phone number format', async () => {
    const input: SendWhatsAppMessageInput = {
      phone: '777123456', // Missing country code
      template_key: 'confirm',
      variables: {
        booking_id: 'BK001',
        service_name: 'Car Cleaning',
        date: '2024-01-15'
      }
    };

    const result = await sendWhatsAppMessage(input);

    expect(result.status).toEqual('failed');
    expect(result.message_id).toEqual('');
    expect(result.error).toMatch(/invalid phone number format/i);
  });

  it('should fail when template not found', async () => {
    const input: SendWhatsAppMessageInput = {
      phone: '+967777123456',
      template_key: 'nonexistent' as any,
      variables: {
        booking_id: 'BK001'
      }
    };

    const result = await sendWhatsAppMessage(input);

    expect(result.status).toEqual('failed');
    expect(result.message_id).toEqual('');
    expect(result.error).toMatch(/template.*not found/i);
  });

  it('should fail when custom message is missing for custom template', async () => {
    const input: SendWhatsAppMessageInput = {
      phone: '+967777123456',
      template_key: 'custom'
      // Missing custom_message
    };

    const result = await sendWhatsAppMessage(input);

    expect(result.status).toEqual('failed');
    expect(result.message_id).toEqual('');
    expect(result.error).toMatch(/custom message is required/i);
  });

  it('should handle various phone number formats', async () => {
    const validPhoneNumbers = [
      '+967777123456',  // 9 digits
      '+96777123456',   // 8 digits
      '+967701234567'   // 9 digits starting with 70
    ];

    for (const phone of validPhoneNumbers) {
      const input: SendWhatsAppMessageInput = {
        phone,
        template_key: 'confirm',
        variables: {
          booking_id: 'BK001',
          service_name: 'Test Service',
          date: '2024-01-15'
        }
      };

      const result = await sendWhatsAppMessage(input);
      expect(result.status).toEqual('sent');
    }
  });

  it('should reject invalid phone number formats', async () => {
    const invalidPhoneNumbers = [
      '+9677771234567',  // Too many digits
      '+966777123456',   // Wrong country code
      '+96777123',       // Too few digits
      '967777123456',    // Missing +
      '+967-777-123456'  // Contains dashes
    ];

    for (const phone of invalidPhoneNumbers) {
      const input: SendWhatsAppMessageInput = {
        phone,
        template_key: 'confirm',
        variables: {
          booking_id: 'BK001',
          service_name: 'Test Service',
          date: '2024-01-15'
        }
      };

      const result = await sendWhatsAppMessage(input);
      expect(result.status).toEqual('failed');
      expect(result.error).toMatch(/invalid phone number format/i);
    }
  });

  it('should handle templates with same variable multiple times', async () => {
    // Insert template with repeated variable
    await db.insert(whatsappTemplatesTable).values({
      key: 'repeat',
      body_ar: 'مرحباً {{name}}، نأمل أن تكون بخير {{name}}',
      body_en: 'Hello {{name}}, we hope you are well {{name}}'
    }).execute();

    const input: SendWhatsAppMessageInput = {
      phone: '+967777123456',
      template_key: 'repeat' as any,
      variables: {
        name: 'Ahmed'
      },
      language: 'en'
    };

    const result = await sendWhatsAppMessage(input);

    expect(result.status).toEqual('sent');
    expect(result.message_id).toMatch(/^wam_\d+_[a-z0-9]+$/);
    expect(result.error).toBeUndefined();
  });

  it('should handle empty variables object', async () => {
    const input: SendWhatsAppMessageInput = {
      phone: '+967777123456',
      template_key: 'confirm',
      variables: {},
      language: 'ar'
    };

    const result = await sendWhatsAppMessage(input);

    expect(result.status).toEqual('sent');
    expect(result.message_id).toMatch(/^wam_\d+_[a-z0-9]+$/);
    expect(result.error).toBeUndefined();
  });

  it('should generate unique message IDs', async () => {
    const input: SendWhatsAppMessageInput = {
      phone: '+967777123456',
      template_key: 'confirm',
      variables: {
        booking_id: 'BK001',
        service_name: 'Test Service',
        date: '2024-01-15'
      }
    };

    const results = await Promise.all([
      sendWhatsAppMessage(input),
      sendWhatsAppMessage(input),
      sendWhatsAppMessage(input)
    ]);

    const messageIds = results.map(r => r.message_id);
    const uniqueIds = new Set(messageIds);
    
    expect(uniqueIds.size).toEqual(3); // All IDs should be unique
    results.forEach(result => {
      expect(result.status).toEqual('sent');
    });
  });
});