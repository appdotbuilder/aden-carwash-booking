import { db } from '../db';
import { galleryMediaTable } from '../db/schema';
import { type GalleryMedia } from '../schema';
import { eq, and, or, sql, asc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

/**
 * Retrieves gallery media for before/after display.
 * This handler returns media with filtering options:
 * - Filter by service type or district
 * - Tag-based categorization
 * - Proper ordering for display
 * - Localized alt text and captions
 * - Visibility management
 */
export const getGalleryMedia = async (filters?: {
  visible_only?: boolean;
  service_filter?: string;
  district_filter?: string;
  tags?: string[];
  language?: 'ar' | 'en';
}): Promise<GalleryMedia[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Apply visibility filter (defaults to true for public display)
    if (filters?.visible_only !== false) {
      conditions.push(eq(galleryMediaTable.visible, true));
    }

    // Apply service filter
    if (filters?.service_filter) {
      conditions.push(
        or(
          eq(galleryMediaTable.service_filter, filters.service_filter),
          sql`${galleryMediaTable.service_filter} IS NULL`
        )!
      );
    }

    // Apply district filter
    if (filters?.district_filter) {
      conditions.push(
        or(
          eq(galleryMediaTable.district_filter, filters.district_filter),
          sql`${galleryMediaTable.district_filter} IS NULL`
        )!
      );
    }

    // Apply tag filters - media must contain at least one of the specified tags
    if (filters?.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(tag =>
        sql`${galleryMediaTable.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`
      );
      conditions.push(or(...tagConditions)!);
    }

    // Execute query with all conditions and ordering
    const results = await db.select()
      .from(galleryMediaTable)
      .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined)
      .orderBy(asc(galleryMediaTable.order), asc(galleryMediaTable.id))
      .execute();

    // Return results with proper type conversion
    return results.map(media => ({
      ...media,
      tags: media.tags as string[], // Ensure JSON array is properly typed
      created_at: media.created_at
    }));
  } catch (error) {
    console.error('Gallery media retrieval failed:', error);
    throw error;
  }
};