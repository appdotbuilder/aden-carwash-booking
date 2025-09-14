import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type Testimonial } from '../schema';
import { eq, gte, desc, asc, and, type SQL } from 'drizzle-orm';

/**
 * Retrieves customer testimonials for display.
 * This handler returns testimonial content:
 * - Published testimonials for public site
 * - All testimonials for admin management  
 * - Proper ordering by rating and date
 * - District-based filtering
 * - Localized testimonial text
 */
export async function getTestimonials(filters?: {
    visible_only?: boolean;
    min_stars?: number;
    district?: string;
    language?: 'ar' | 'en';
}): Promise<Testimonial[]> {
    try {
        // Start with base query
        let baseQuery = db.select().from(testimonialsTable);
        
        // Build conditions array for filtering
        const conditions: SQL<unknown>[] = [];

        // Filter by visibility (default to visible only for public display)
        if (filters?.visible_only !== false) {
            conditions.push(eq(testimonialsTable.visible, true));
        }

        // Filter by minimum star rating
        if (filters?.min_stars !== undefined) {
            conditions.push(gte(testimonialsTable.stars, filters.min_stars));
        }

        // Filter by district (case-insensitive)
        if (filters?.district) {
            conditions.push(eq(testimonialsTable.district, filters.district));
        }

        // Apply where conditions if any exist
        let query = conditions.length > 0 
            ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
            : baseQuery;

        // Order by stars (desc), then order field (asc), then created_at (desc)
        const results = await query
            .orderBy(
                desc(testimonialsTable.stars),
                asc(testimonialsTable.order),
                desc(testimonialsTable.created_at)
            )
            .execute();

        // Convert numeric fields and return testimonials
        return results.map(testimonial => ({
            ...testimonial,
            // No numeric conversions needed - stars is integer, all others are text/boolean/date
        }));

    } catch (error) {
        console.error('Failed to retrieve testimonials:', error);
        throw error;
    }
}