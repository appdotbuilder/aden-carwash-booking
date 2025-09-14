import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentBlocksTable } from '../db/schema';
import { type CreateContentBlockInput } from '../schema';
import { getContentBlocks } from '../handlers/get_content_blocks';

// Test data setup
const testContentBlocks: CreateContentBlockInput[] = [
  {
    key: 'hero_title',
    ar_value: 'خدمة تنظيف السيارات',
    en_value: 'Car Cleaning Service',
    status: 'published'
  },
  {
    key: 'hero_subtitle',
    ar_value: 'أفضل خدمة تنظيف في المدينة',
    en_value: 'Best cleaning service in the city',
    status: 'published'
  },
  {
    key: 'draft_content',
    ar_value: 'محتوى مسودة',
    en_value: 'Draft content',
    status: 'draft'
  },
  {
    key: 'preview_content',
    ar_value: 'محتوى معاينة',
    en_value: 'Preview content',
    status: 'preview'
  },
  {
    key: 'cta_button',
    ar_value: 'احجز الآن',
    en_value: 'Book Now',
    status: 'published'
  }
];

describe('getContentBlocks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve all content blocks without filters', async () => {
    // Insert test data
    await db.insert(contentBlocksTable)
      .values(testContentBlocks)
      .execute();

    const result = await getContentBlocks();

    expect(result).toHaveLength(5);
    
    // Verify structure of returned data
    const heroBlock = result.find(block => block.key === 'hero_title');
    expect(heroBlock).toBeDefined();
    expect(heroBlock!.ar_value).toEqual('خدمة تنظيف السيارات');
    expect(heroBlock!.en_value).toEqual('Car Cleaning Service');
    expect(heroBlock!.status).toEqual('published');
    expect(heroBlock!.id).toBeDefined();
    expect(heroBlock!.updated_at).toBeInstanceOf(Date);
  });

  it('should filter content blocks by status', async () => {
    // Insert test data
    await db.insert(contentBlocksTable)
      .values(testContentBlocks)
      .execute();

    const publishedBlocks = await getContentBlocks({ status: 'published' });
    expect(publishedBlocks).toHaveLength(3);
    publishedBlocks.forEach(block => {
      expect(block.status).toEqual('published');
    });

    const draftBlocks = await getContentBlocks({ status: 'draft' });
    expect(draftBlocks).toHaveLength(1);
    expect(draftBlocks[0].key).toEqual('draft_content');

    const previewBlocks = await getContentBlocks({ status: 'preview' });
    expect(previewBlocks).toHaveLength(1);
    expect(previewBlocks[0].key).toEqual('preview_content');
  });

  it('should filter content blocks by specific keys', async () => {
    // Insert test data
    await db.insert(contentBlocksTable)
      .values(testContentBlocks)
      .execute();

    const heroBlocks = await getContentBlocks({ 
      keys: ['hero_title', 'hero_subtitle'] 
    });
    
    expect(heroBlocks).toHaveLength(2);
    const keys = heroBlocks.map(block => block.key);
    expect(keys).toContain('hero_title');
    expect(keys).toContain('hero_subtitle');
  });

  it('should combine status and keys filters', async () => {
    // Insert test data
    await db.insert(contentBlocksTable)
      .values(testContentBlocks)
      .execute();

    const filteredBlocks = await getContentBlocks({
      status: 'published',
      keys: ['hero_title', 'draft_content', 'cta_button']
    });

    expect(filteredBlocks).toHaveLength(2);
    const keys = filteredBlocks.map(block => block.key);
    expect(keys).toContain('hero_title');
    expect(keys).toContain('cta_button');
    expect(keys).not.toContain('draft_content'); // Filtered out by status

    filteredBlocks.forEach(block => {
      expect(block.status).toEqual('published');
    });
  });

  it('should return empty array when no matches found', async () => {
    // Insert test data
    await db.insert(contentBlocksTable)
      .values(testContentBlocks)
      .execute();

    const noMatches = await getContentBlocks({ 
      keys: ['nonexistent_key'] 
    });
    
    expect(noMatches).toHaveLength(0);
  });

  it('should handle empty keys array', async () => {
    // Insert test data
    await db.insert(contentBlocksTable)
      .values(testContentBlocks)
      .execute();

    const result = await getContentBlocks({ keys: [] });
    
    // Empty keys array should return all blocks
    expect(result).toHaveLength(5);
  });

  it('should return empty array when no content blocks exist', async () => {
    const result = await getContentBlocks();
    expect(result).toHaveLength(0);
  });

  it('should handle content blocks with null values', async () => {
    // Insert content block with null values
    await db.insert(contentBlocksTable)
      .values([
        {
          key: 'partial_content',
          ar_value: 'Arabic only',
          en_value: null,
          status: 'published'
        },
        {
          key: 'other_partial',
          ar_value: null,
          en_value: 'English only',
          status: 'draft'
        }
      ])
      .execute();

    const result = await getContentBlocks();
    
    expect(result).toHaveLength(2);
    
    const arabicOnly = result.find(block => block.key === 'partial_content');
    expect(arabicOnly!.ar_value).toEqual('Arabic only');
    expect(arabicOnly!.en_value).toBeNull();

    const englishOnly = result.find(block => block.key === 'other_partial');
    expect(englishOnly!.ar_value).toBeNull();
    expect(englishOnly!.en_value).toEqual('English only');
  });

  it('should verify database persistence of retrieved data', async () => {
    // Insert test data
    const insertResult = await db.insert(contentBlocksTable)
      .values([testContentBlocks[0]])
      .returning()
      .execute();

    const retrievedBlocks = await getContentBlocks({ 
      keys: ['hero_title'] 
    });

    expect(retrievedBlocks).toHaveLength(1);
    expect(retrievedBlocks[0].id).toEqual(insertResult[0].id);
    expect(retrievedBlocks[0].key).toEqual(insertResult[0].key);
    expect(retrievedBlocks[0].ar_value).toEqual(insertResult[0].ar_value);
    expect(retrievedBlocks[0].en_value).toEqual(insertResult[0].en_value);
    expect(retrievedBlocks[0].updated_at).toEqual(insertResult[0].updated_at);
  });
});