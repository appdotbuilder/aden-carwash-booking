import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { galleryMediaTable } from '../db/schema';
import { type CreateGalleryMediaInput } from '../schema';
import { getGalleryMedia } from '../handlers/get_gallery_media';

// Test data
const testMedia1: CreateGalleryMediaInput = {
  url: 'https://example.com/before-after1.jpg',
  alt_ar: 'قبل وبعد الخدمة الأولى',
  alt_en: 'Before and after first service',
  tags: ['before-after', 'residential'],
  service_filter: 'deep-cleaning',
  district_filter: 'sanaa',
  order: 1,
  visible: true
};

const testMedia2: CreateGalleryMediaInput = {
  url: 'https://example.com/before-after2.jpg',
  alt_ar: 'قبل وبعد الخدمة الثانية',
  alt_en: 'Before and after second service',
  tags: ['before-after', 'commercial'],
  service_filter: 'office-cleaning',
  district_filter: 'aden',
  order: 2,
  visible: true
};

const testMedia3: CreateGalleryMediaInput = {
  url: 'https://example.com/hidden-media.jpg',
  alt_ar: 'وسائط مخفية',
  alt_en: 'Hidden media',
  tags: ['draft', 'test'],
  service_filter: null,
  district_filter: null,
  order: 3,
  visible: false
};

const testMedia4: CreateGalleryMediaInput = {
  url: 'https://example.com/general-media.jpg',
  alt_ar: 'وسائط عامة',
  alt_en: 'General media',
  tags: ['general', 'showcase'],
  service_filter: null, // No specific service filter
  district_filter: null, // No specific district filter
  order: 0, // Should appear first
  visible: true
};

describe('getGalleryMedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to insert test media
  const insertTestMedia = async (media: CreateGalleryMediaInput) => {
    const result = await db.insert(galleryMediaTable)
      .values({
        url: media.url,
        alt_ar: media.alt_ar,
        alt_en: media.alt_en,
        tags: media.tags,
        service_filter: media.service_filter,
        district_filter: media.district_filter,
        order: media.order,
        visible: media.visible
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should retrieve all visible media when no filters applied', async () => {
    // Insert test data
    await insertTestMedia(testMedia1);
    await insertTestMedia(testMedia2);
    await insertTestMedia(testMedia3); // Hidden
    await insertTestMedia(testMedia4);

    const results = await getGalleryMedia();

    // Should return only visible media
    expect(results).toHaveLength(3);
    expect(results.every(media => media.visible)).toBe(true);

    // Should be ordered by order field, then by id
    expect(results[0].order).toBe(0);
    expect(results[1].order).toBe(1);
    expect(results[2].order).toBe(2);
  });

  it('should include hidden media when visible_only is false', async () => {
    await insertTestMedia(testMedia1);
    await insertTestMedia(testMedia3); // Hidden

    const results = await getGalleryMedia({ visible_only: false });

    expect(results).toHaveLength(2);
    expect(results.some(media => !media.visible)).toBe(true);
  });

  it('should filter by service type', async () => {
    await insertTestMedia(testMedia1); // deep-cleaning
    await insertTestMedia(testMedia2); // office-cleaning
    await insertTestMedia(testMedia4); // no service filter (null)

    const results = await getGalleryMedia({ service_filter: 'deep-cleaning' });

    // Should return media with matching service_filter OR null service_filter
    expect(results).toHaveLength(2);
    expect(results.some(media => media.service_filter === 'deep-cleaning')).toBe(true);
    expect(results.some(media => media.service_filter === null)).toBe(true);
  });

  it('should filter by district', async () => {
    await insertTestMedia(testMedia1); // sanaa
    await insertTestMedia(testMedia2); // aden
    await insertTestMedia(testMedia4); // no district filter (null)

    const results = await getGalleryMedia({ district_filter: 'sanaa' });

    // Should return media with matching district_filter OR null district_filter
    expect(results).toHaveLength(2);
    expect(results.some(media => media.district_filter === 'sanaa')).toBe(true);
    expect(results.some(media => media.district_filter === null)).toBe(true);
  });

  it('should filter by tags', async () => {
    await insertTestMedia(testMedia1); // ['before-after', 'residential']
    await insertTestMedia(testMedia2); // ['before-after', 'commercial']
    await insertTestMedia(testMedia4); // ['general', 'showcase']

    const results = await getGalleryMedia({ tags: ['before-after'] });

    // Should return media that contain the specified tag
    expect(results).toHaveLength(2);
    expect(results.every(media => media.tags.includes('before-after'))).toBe(true);
  });

  it('should filter by multiple tags (OR logic)', async () => {
    await insertTestMedia(testMedia1); // ['before-after', 'residential']
    await insertTestMedia(testMedia2); // ['before-after', 'commercial']
    await insertTestMedia(testMedia4); // ['general', 'showcase']

    const results = await getGalleryMedia({ tags: ['residential', 'general'] });

    // Should return media that contain ANY of the specified tags
    expect(results).toHaveLength(2);
    expect(results.some(media => media.tags.includes('residential'))).toBe(true);
    expect(results.some(media => media.tags.includes('general'))).toBe(true);
  });

  it('should combine multiple filters correctly', async () => {
    await insertTestMedia(testMedia1); // deep-cleaning, sanaa, visible
    await insertTestMedia(testMedia2); // office-cleaning, aden, visible
    await insertTestMedia({
      ...testMedia1,
      url: 'https://example.com/combo-test.jpg',
      service_filter: 'deep-cleaning',
      district_filter: 'sanaa',
      tags: ['commercial', 'premium'],
      order: 5
    });

    const results = await getGalleryMedia({
      service_filter: 'deep-cleaning',
      district_filter: 'sanaa',
      tags: ['residential']
    });

    // Should return media matching service AND district AND tag filters
    expect(results).toHaveLength(1);
    expect(results[0].service_filter).toBe('deep-cleaning');
    expect(results[0].district_filter).toBe('sanaa');
    expect(results[0].tags.includes('residential')).toBe(true);
  });

  it('should maintain proper ordering', async () => {
    // Insert in random order
    await insertTestMedia({ ...testMedia1, order: 10 });
    await insertTestMedia({ ...testMedia2, order: 5 });
    await insertTestMedia({ ...testMedia4, order: 1 });

    const results = await getGalleryMedia();

    // Should be ordered by order field ascending
    expect(results[0].order).toBe(1);
    expect(results[1].order).toBe(5);
    expect(results[2].order).toBe(10);
  });

  it('should handle empty results gracefully', async () => {
    const results = await getGalleryMedia({ tags: ['nonexistent'] });

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should preserve tags array structure', async () => {
    await insertTestMedia(testMedia1);

    const results = await getGalleryMedia();

    expect(results[0].tags).toEqual(['before-after', 'residential']);
    expect(Array.isArray(results[0].tags)).toBe(true);
  });

  it('should handle null service and district filters correctly', async () => {
    await insertTestMedia(testMedia4); // Both filters are null

    const results = await getGalleryMedia({
      service_filter: 'any-service'
    });

    // Media with null service_filter should be included
    expect(results).toHaveLength(1);
    expect(results[0].service_filter).toBeNull();
  });

  it('should return proper field types', async () => {
    await insertTestMedia(testMedia1);

    const results = await getGalleryMedia();

    const media = results[0];
    expect(typeof media.id).toBe('number');
    expect(typeof media.url).toBe('string');
    expect(typeof media.alt_ar).toBe('string');
    expect(typeof media.alt_en).toBe('string');
    expect(Array.isArray(media.tags)).toBe(true);
    expect(typeof media.order).toBe('number');
    expect(typeof media.visible).toBe('boolean');
    expect(media.created_at).toBeInstanceOf(Date);
  });
});