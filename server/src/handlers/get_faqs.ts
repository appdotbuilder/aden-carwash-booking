import { db } from '../db';
import { faqsTable } from '../db/schema';
import { type FAQ } from '../schema';
import { eq, asc, and, sql, type SQL } from 'drizzle-orm';

/**
 * Retrieves FAQ items for display and management.
 * This handler returns FAQ content:
 * - Published FAQs for public site
 * - All FAQs for admin management
 * - Proper ordering for display
 * - Tag-based filtering
 * - Localized questions and answers
 */
export const getFAQs = async (filters?: {
  visible_only?: boolean;
  tags?: string[];
  language?: 'ar' | 'en';
}): Promise<FAQ[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Filter by visibility if specified
    if (filters?.visible_only) {
      conditions.push(eq(faqsTable.visible, true));
    }

    // Filter by tags if specified
    if (filters?.tags && filters.tags.length > 0) {
      // Use PostgreSQL's json ? operator to check if tags array contains any of the specified tags
      const tagConditions = filters.tags.map(tag => 
        sql`${faqsTable.tags}::jsonb ? ${tag}`
      );
      // Use OR logic for tags - match any of the specified tags
      conditions.push(sql`(${sql.join(tagConditions, sql` OR `)})`);
    }

    // Build the complete query step by step
    const baseQuery = db.select().from(faqsTable);
    
    const queryWithConditions = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    // Apply ordering and execute
    const results = await queryWithConditions
      .orderBy(asc(faqsTable.order), asc(faqsTable.id))
      .execute();

    // Convert results to match schema types (no numeric conversions needed for FAQ)
    return results.map(faq => ({
      ...faq,
      // Ensure tags is properly typed as string array
      tags: Array.isArray(faq.tags) ? faq.tags : []
    }));
  } catch (error) {
    console.error('FAQ retrieval failed:', error);
    throw error;
  }
};