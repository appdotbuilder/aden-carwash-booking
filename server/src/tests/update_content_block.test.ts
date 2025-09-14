import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentBlocksTable } from '../db/schema';
import { updateContentBlock } from '../handlers/update_content_block';
import { eq } from 'drizzle-orm';

describe('updateContentBlock', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new content block when key does not exist', async () => {
    const result = await updateContentBlock(
      'homepage.hero.title',
      {
        ar_value: 'مرحبا بكم',
        en_value: 'Welcome',
        status: 'draft'
      },
      1
    );

    expect(result.key).toEqual('homepage.hero.title');
    expect(result.ar_value).toEqual('مرحبا بكم');
    expect(result.en_value).toEqual('Welcome');
    expect(result.status).toEqual('draft');
    expect(result.updated_by).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing content block', async () => {
    // Create initial content block
    await db.insert(contentBlocksTable)
      .values({
        key: 'about.description',
        ar_value: 'وصف قديم',
        en_value: 'Old description',
        status: 'draft',
        updated_by: 1
      })
      .execute();

    const result = await updateContentBlock(
      'about.description',
      {
        ar_value: 'وصف جديد',
        en_value: 'New description',
        status: 'published'
      },
      2
    );

    expect(result.key).toEqual('about.description');
    expect(result.ar_value).toEqual('وصف جديد');
    expect(result.en_value).toEqual('New description');
    expect(result.status).toEqual('published');
    expect(result.updated_by).toEqual(2);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create initial content block
    await db.insert(contentBlocksTable)
      .values({
        key: 'services.title',
        ar_value: 'خدماتنا',
        en_value: 'Our Services',
        status: 'draft',
        updated_by: 1
      })
      .execute();

    const result = await updateContentBlock(
      'services.title',
      {
        status: 'published'
      },
      2
    );

    expect(result.key).toEqual('services.title');
    expect(result.ar_value).toEqual('خدماتنا'); // Should remain unchanged
    expect(result.en_value).toEqual('Our Services'); // Should remain unchanged
    expect(result.status).toEqual('published'); // Should be updated
    expect(result.updated_by).toEqual(2);
  });

  it('should handle null values correctly', async () => {
    const result = await updateContentBlock(
      'footer.copyright',
      {
        ar_value: null,
        en_value: '© 2024 Company',
        status: 'published'
      }
    );

    expect(result.ar_value).toBeNull();
    expect(result.en_value).toEqual('© 2024 Company');
    expect(result.status).toEqual('published');
    expect(result.updated_by).toBeNull();
  });

  it('should default to draft status for new content blocks', async () => {
    const result = await updateContentBlock(
      'contact.phone',
      {
        ar_value: '+967 1 234 5678',
        en_value: '+967 1 234 5678'
      }
    );

    expect(result.status).toEqual('draft');
  });

  it('should preserve existing fields when updating partial content', async () => {
    // Create initial content block
    await db.insert(contentBlocksTable)
      .values({
        key: 'pricing.subtitle',
        ar_value: 'أسعار تنافسية',
        en_value: 'Competitive Prices',
        status: 'published',
        updated_by: 5
      })
      .execute();

    const result = await updateContentBlock(
      'pricing.subtitle',
      {
        ar_value: 'أسعار محدثة'
      },
      3
    );

    expect(result.ar_value).toEqual('أسعار محدثة');
    expect(result.en_value).toEqual('Competitive Prices'); // Should remain unchanged
    expect(result.status).toEqual('published'); // Should remain unchanged
    expect(result.updated_by).toEqual(3); // Should be updated
  });

  it('should save content block to database', async () => {
    const result = await updateContentBlock(
      'faq.title',
      {
        ar_value: 'الأسئلة الشائعة',
        en_value: 'Frequently Asked Questions',
        status: 'preview'
      },
      4
    );

    const contentBlocks = await db.select()
      .from(contentBlocksTable)
      .where(eq(contentBlocksTable.id, result.id))
      .execute();

    expect(contentBlocks).toHaveLength(1);
    expect(contentBlocks[0].key).toEqual('faq.title');
    expect(contentBlocks[0].ar_value).toEqual('الأسئلة الشائعة');
    expect(contentBlocks[0].en_value).toEqual('Frequently Asked Questions');
    expect(contentBlocks[0].status).toEqual('preview');
    expect(contentBlocks[0].updated_by).toEqual(4);
    expect(contentBlocks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update timestamp on existing content block modification', async () => {
    // Create initial content block with a past timestamp
    const pastDate = new Date('2023-01-01');
    await db.insert(contentBlocksTable)
      .values({
        key: 'test.timestamp',
        ar_value: 'قديم',
        en_value: 'Old',
        status: 'draft',
        updated_by: 1
      })
      .execute();

    // Update the content block
    const result = await updateContentBlock(
      'test.timestamp',
      {
        ar_value: 'جديد',
        en_value: 'New'
      },
      2
    );

    // Verify the timestamp was updated (should be recent, not the past date)
    const now = new Date();
    const timeDiff = now.getTime() - result.updated_at.getTime();
    expect(timeDiff).toBeLessThan(5000); // Should be within 5 seconds
  });

  it('should handle content blocks with all status types', async () => {
    const statuses = ['draft', 'preview', 'published'] as const;

    for (const status of statuses) {
      const result = await updateContentBlock(
        `test.${status}`,
        {
          ar_value: `نص ${status}`,
          en_value: `${status} text`,
          status: status
        },
        1
      );

      expect(result.status).toEqual(status);
      expect(result.key).toEqual(`test.${status}`);
    }
  });
});