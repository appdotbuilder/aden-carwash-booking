import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { faqsTable } from '../db/schema';
import { type CreateFAQInput } from '../schema';
import { getFAQs } from '../handlers/get_faqs';

// Test FAQ inputs
const testFAQ1: CreateFAQInput = {
  q_ar: 'ما هي أوقات العمل؟',
  q_en: 'What are your working hours?',
  a_ar: 'نعمل من الساعة 8 صباحاً حتى 10 مساءً',
  a_en: 'We work from 8 AM to 10 PM',
  order: 1,
  tags: ['general', 'hours'],
  visible: true
};

const testFAQ2: CreateFAQInput = {
  q_ar: 'كم تكلفة الخدمة؟',
  q_en: 'How much does the service cost?',
  a_ar: 'تختلف التكلفة حسب نوع الخدمة',
  a_en: 'Cost varies depending on service type',
  order: 2,
  tags: ['pricing', 'general'],
  visible: true
};

const testFAQ3: CreateFAQInput = {
  q_ar: 'هل تقدمون خدمة التوصيل؟',
  q_en: 'Do you provide delivery service?',
  a_ar: 'نعم نقدم خدمة التوصيل في جميع المناطق',
  a_en: 'Yes, we provide delivery service in all areas',
  order: 3,
  tags: ['delivery'],
  visible: false // Hidden FAQ
};

const testFAQ4: CreateFAQInput = {
  q_ar: 'كيف يمكنني إلغاء الطلب؟',
  q_en: 'How can I cancel my order?',
  a_ar: 'يمكنك إلغاء الطلب من خلال التطبيق',
  a_en: 'You can cancel your order through the app',
  order: 0, // Should appear first
  tags: ['cancellation', 'orders'],
  visible: true
};

describe('getFAQs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test FAQs
  const createTestFAQs = async () => {
    await db.insert(faqsTable).values([
      testFAQ1,
      testFAQ2,
      testFAQ3,
      testFAQ4
    ]).execute();
  };

  it('should retrieve all FAQs without filters', async () => {
    await createTestFAQs();

    const result = await getFAQs();

    expect(result).toHaveLength(4);
    
    // Should be ordered by order field, then by ID
    expect(result[0].order).toBe(0); // testFAQ4
    expect(result[1].order).toBe(1); // testFAQ1
    expect(result[2].order).toBe(2); // testFAQ2
    expect(result[3].order).toBe(3); // testFAQ3
    
    // Verify content
    expect(result[0].q_en).toBe('How can I cancel my order?');
    expect(result[1].q_en).toBe('What are your working hours?');
  });

  it('should filter by visible_only', async () => {
    await createTestFAQs();

    const result = await getFAQs({ visible_only: true });

    expect(result).toHaveLength(3);
    
    // Should not include the hidden FAQ (testFAQ3)
    const questions = result.map(faq => faq.q_en);
    expect(questions).not.toContain('Do you provide delivery service?');
    
    // Should include visible FAQs
    expect(questions).toContain('What are your working hours?');
    expect(questions).toContain('How much does the service cost?');
    expect(questions).toContain('How can I cancel my order?');
  });

  it('should filter by single tag', async () => {
    await createTestFAQs();

    const result = await getFAQs({ tags: ['general'] });

    expect(result).toHaveLength(2);
    
    // Should include FAQs with 'general' tag
    const questions = result.map(faq => faq.q_en);
    expect(questions).toContain('What are your working hours?');
    expect(questions).toContain('How much does the service cost?');
  });

  it('should filter by multiple tags', async () => {
    await createTestFAQs();

    const result = await getFAQs({ tags: ['delivery', 'cancellation'] });

    expect(result).toHaveLength(2);
    
    // Should include FAQs with either 'delivery' or 'cancellation' tags
    const questions = result.map(faq => faq.q_en);
    expect(questions).toContain('Do you provide delivery service?');
    expect(questions).toContain('How can I cancel my order?');
  });

  it('should combine visible_only and tag filters', async () => {
    await createTestFAQs();

    const result = await getFAQs({ 
      visible_only: true, 
      tags: ['general'] 
    });

    expect(result).toHaveLength(2);
    
    // Should include only visible FAQs with 'general' tag
    const questions = result.map(faq => faq.q_en);
    expect(questions).toContain('What are your working hours?');
    expect(questions).toContain('How much does the service cost?');
    
    // Should not include hidden FAQ even if it has other matching criteria
    expect(questions).not.toContain('Do you provide delivery service?');
  });

  it('should return empty array for non-existent tags', async () => {
    await createTestFAQs();

    const result = await getFAQs({ tags: ['nonexistent'] });

    expect(result).toHaveLength(0);
  });

  it('should handle empty database', async () => {
    const result = await getFAQs();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should preserve tags array structure', async () => {
    await createTestFAQs();

    const result = await getFAQs();

    // Verify that tags are properly returned as arrays
    result.forEach(faq => {
      expect(Array.isArray(faq.tags)).toBe(true);
      expect(faq.tags.length).toBeGreaterThan(0);
    });
    
    // Check specific tag content
    const generalFAQ = result.find(faq => faq.q_en === 'What are your working hours?');
    expect(generalFAQ?.tags).toContain('general');
    expect(generalFAQ?.tags).toContain('hours');
  });

  it('should return all FAQ fields correctly', async () => {
    await createTestFAQs();

    const result = await getFAQs();
    const firstFAQ = result[0];

    // Verify all required fields are present
    expect(firstFAQ.id).toBeDefined();
    expect(typeof firstFAQ.id).toBe('number');
    expect(typeof firstFAQ.q_ar).toBe('string');
    expect(typeof firstFAQ.q_en).toBe('string');
    expect(typeof firstFAQ.a_ar).toBe('string');
    expect(typeof firstFAQ.a_en).toBe('string');
    expect(typeof firstFAQ.order).toBe('number');
    expect(Array.isArray(firstFAQ.tags)).toBe(true);
    expect(typeof firstFAQ.visible).toBe('boolean');
    expect(firstFAQ.created_at).toBeInstanceOf(Date);
  });

  it('should maintain consistent ordering', async () => {
    // Create FAQs with same order value to test secondary sort by ID
    await db.insert(faqsTable).values([
      { ...testFAQ1, order: 5 },
      { ...testFAQ2, order: 5 },
      { ...testFAQ3, order: 1 }
    ]).execute();

    const result = await getFAQs();

    expect(result).toHaveLength(3);
    
    // Should be ordered by order field first
    expect(result[0].order).toBe(1);
    expect(result[1].order).toBe(5);
    expect(result[2].order).toBe(5);
    
    // For same order values, should be consistent (ordered by ID)
    expect(result[1].id).toBeLessThan(result[2].id);
  });

  it('should handle FAQs without tags', async () => {
    // Create FAQ with empty tags array
    const faqNoTags = {
      q_ar: 'سؤال بدون تصنيف',
      q_en: 'Question without tags',
      a_ar: 'جواب بدون تصنيف',
      a_en: 'Answer without tags',
      order: 1,
      tags: [] as string[],
      visible: true
    };

    await db.insert(faqsTable).values([faqNoTags]).execute();

    const result = await getFAQs();

    expect(result).toHaveLength(1);
    expect(result[0].tags).toEqual([]);
  });
});