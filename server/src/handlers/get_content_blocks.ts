import { db } from '../db';
import { contentBlocksTable } from '../db/schema';
import { type ContentBlock } from '../schema';
import { eq, inArray, and, type SQL } from 'drizzle-orm';

/**
 * Retrieves content blocks for CMS management.
 * This handler returns editable content used throughout the site:
 * - Hero headlines and subtext
 * - Value proposition icons and text
 * - Button labels and CTAs
 * - Policy text and legal content
 * - Service area descriptions
 */
export const getContentBlocks = async (filters?: {
  status?: 'draft' | 'preview' | 'published';
  keys?: string[];
  language?: 'ar' | 'en';
}): Promise<ContentBlock[]> => {
  try {
    // Build conditions array for filters
    const conditions: SQL<unknown>[] = [];

    if (filters?.status) {
      conditions.push(eq(contentBlocksTable.status, filters.status));
    }

    if (filters?.keys && filters.keys.length > 0) {
      conditions.push(inArray(contentBlocksTable.key, filters.keys));
    }

    // Build query with conditions if any exist
    const results = conditions.length > 0
      ? await db.select()
          .from(contentBlocksTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(contentBlocksTable)
          .execute();

    // Return all content blocks with proper type conversion
    return results.map(block => ({
      ...block,
      updated_at: block.updated_at
    }));
  } catch (error) {
    console.error('Content blocks retrieval failed:', error);
    throw error;
  }
};