import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { galleryMediaTable } from '../db/schema';
import { uploadMedia } from '../handlers/upload_media';
import { eq } from 'drizzle-orm';

// Mock file creation helpers
const createMockFile = (name: string, type: string, size: number): any => {
  const buffer = new ArrayBuffer(size);
  return {
    name,
    type,
    size,
    arrayBuffer: async () => buffer
  };
};

const createMockBuffer = (size: number): Buffer => {
  return Buffer.alloc(size, 0);
};

// Test inputs
const validImageFile = createMockFile('test-image.jpg', 'image/jpeg', 1024 * 1024); // 1MB
const validPngFile = createMockFile('test-image.png', 'image/png', 512 * 1024); // 512KB
const invalidTypeFile = createMockFile('test-doc.pdf', 'application/pdf', 1024);
const oversizedFile = createMockFile('large-image.jpg', 'image/jpeg', 6 * 1024 * 1024); // 6MB

const testInput = {
  file: validImageFile,
  alt_ar: 'نص بديل عربي',
  alt_en: 'English alt text',
  tags: ['before', 'sedan', 'interior'],
  service_filter: 'interior-cleaning',
  district_filter: 'sanaa',
  category: 'gallery' as const
};

describe('uploadMedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully upload a valid image file', async () => {
    const result = await uploadMedia(testInput);

    expect(result.status).toEqual('success');
    expect(result.id).toBeGreaterThan(0);
    expect(result.url).toMatch(/^https:\/\/storage\.carwash\.ly\/uploads\//);
    expect(result.error).toBeUndefined();
  });

  it('should save media metadata to database', async () => {
    const result = await uploadMedia(testInput);

    const mediaRecords = await db.select()
      .from(galleryMediaTable)
      .where(eq(galleryMediaTable.id, result.id))
      .execute();

    expect(mediaRecords).toHaveLength(1);
    const media = mediaRecords[0];
    
    expect(media.alt_ar).toEqual('نص بديل عربي');
    expect(media.alt_en).toEqual('English alt text');
    expect(media.tags).toEqual(['before', 'sedan', 'interior']);
    expect(media.service_filter).toEqual('interior-cleaning');
    expect(media.district_filter).toEqual('sanaa');
    expect(media.visible).toBe(true);
    expect(media.order).toEqual(0);
    expect(media.created_at).toBeInstanceOf(Date);
  });

  it('should handle PNG files correctly', async () => {
    const pngInput = { ...testInput, file: validPngFile };
    const result = await uploadMedia(pngInput);

    expect(result.status).toEqual('success');
    expect(result.id).toBeGreaterThan(0);
    expect(result.url).toMatch(/\.png$/);
  });

  it('should handle Buffer input correctly', async () => {
    const bufferInput = {
      ...testInput,
      file: createMockBuffer(1024 * 512) // 512KB
    };
    
    const result = await uploadMedia(bufferInput);

    expect(result.status).toEqual('success');
    expect(result.id).toBeGreaterThan(0);
    expect(result.url).toMatch(/^https:\/\/storage\.carwash\.ly\/uploads\//);
  });

  it('should reject invalid file types', async () => {
    const invalidInput = { ...testInput, file: invalidTypeFile };
    const result = await uploadMedia(invalidInput);

    expect(result.status).toEqual('failed');
    expect(result.id).toEqual(0);
    expect(result.url).toEqual('');
    expect(result.error).toMatch(/invalid file type/i);
  });

  it('should reject oversized files', async () => {
    const oversizedInput = { ...testInput, file: oversizedFile };
    const result = await uploadMedia(oversizedInput);

    expect(result.status).toEqual('failed');
    expect(result.id).toEqual(0);
    expect(result.url).toEqual('');
    expect(result.error).toMatch(/file size too large/i);
  });

  it('should handle minimal input correctly', async () => {
    const minimalInput = {
      file: validImageFile,
      category: 'general' as const
    };
    
    const result = await uploadMedia(minimalInput);

    expect(result.status).toEqual('success');
    expect(result.id).toBeGreaterThan(0);

    // Verify database record with null/default values
    const mediaRecords = await db.select()
      .from(galleryMediaTable)
      .where(eq(galleryMediaTable.id, result.id))
      .execute();

    const media = mediaRecords[0];
    expect(media.alt_ar).toBeNull();
    expect(media.alt_en).toBeNull();
    expect(media.tags).toEqual([]);
    expect(media.service_filter).toBeNull();
    expect(media.district_filter).toBeNull();
  });

  it('should handle different media categories', async () => {
    const categories = ['gallery', 'before_after', 'general'] as const;
    
    for (const category of categories) {
      const categoryInput = { ...testInput, file: validImageFile, category };
      const result = await uploadMedia(categoryInput);

      expect(result.status).toEqual('success');
      expect(result.url).toMatch(new RegExp(`${category}_\\d+_`));
    }
  });

  it('should generate unique filenames for concurrent uploads', async () => {
    const input1 = { ...testInput, file: validImageFile };
    const input2 = { ...testInput, file: validPngFile };
    const input3 = { ...testInput, file: createMockFile('another.jpg', 'image/jpeg', 1024) };

    // Upload multiple files concurrently
    const [result1, result2, result3] = await Promise.all([
      uploadMedia(input1),
      uploadMedia(input2),
      uploadMedia(input3)
    ]);

    expect(result1.status).toEqual('success');
    expect(result2.status).toEqual('success');
    expect(result3.status).toEqual('success');

    // All URLs should be unique
    const urls = [result1.url, result2.url, result3.url];
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toEqual(3);

    // All IDs should be unique
    const ids = [result1.id, result2.id, result3.id];
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(3);
  });

  it('should handle WebP files', async () => {
    const webpFile = createMockFile('test.webp', 'image/webp', 512 * 1024);
    const webpInput = { ...testInput, file: webpFile };
    
    const result = await uploadMedia(webpInput);

    expect(result.status).toEqual('success');
    expect(result.url).toMatch(/\.webp$/);
  });

  it('should handle GIF files', async () => {
    const gifFile = createMockFile('test.gif', 'image/gif', 1024 * 1024);
    const gifInput = { ...testInput, file: gifFile };
    
    const result = await uploadMedia(gifInput);

    expect(result.status).toEqual('success');
    expect(result.url).toMatch(/\.gif$/);
  });

  it('should handle empty tags array', async () => {
    const emptyTagsInput = {
      ...testInput,
      tags: []
    };
    
    const result = await uploadMedia(emptyTagsInput);

    expect(result.status).toEqual('success');

    const mediaRecords = await db.select()
      .from(galleryMediaTable)
      .where(eq(galleryMediaTable.id, result.id))
      .execute();

    expect(mediaRecords[0].tags).toEqual([]);
  });

  it('should handle Arabic and English content correctly', async () => {
    const arabicInput = {
      ...testInput,
      alt_ar: 'صورة تنظيف السيارة',
      alt_en: 'Car cleaning image',
      tags: ['تنظيف', 'سيارة', 'cleaning', 'car'],
      service_filter: 'غسيل-خارجي',
      district_filter: 'صنعاء'
    };
    
    const result = await uploadMedia(arabicInput);

    expect(result.status).toEqual('success');

    const mediaRecords = await db.select()
      .from(galleryMediaTable)
      .where(eq(galleryMediaTable.id, result.id))
      .execute();

    const media = mediaRecords[0];
    expect(media.alt_ar).toEqual('صورة تنظيف السيارة');
    expect(media.alt_en).toEqual('Car cleaning image');
    expect(media.tags).toEqual(['تنظيف', 'سيارة', 'cleaning', 'car']);
    expect(media.service_filter).toEqual('غسيل-خارجي');
    expect(media.district_filter).toEqual('صنعاء');
  });
});