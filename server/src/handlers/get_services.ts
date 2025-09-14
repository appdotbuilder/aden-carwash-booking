import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';
import { eq, asc } from 'drizzle-orm';

/**
 * Retrieves all available services for the booking wizard.
 * This handler returns services with pricing and availability:
 * - Only visible/active services
 * - Both team and solo pricing
 * - Estimated time for scheduling
 * - Proper ordering for display
 * - Localized names and descriptions
 */
export async function getServices(filters?: {
    visible_only?: boolean;
    language?: 'ar' | 'en';
}): Promise<Service[]> {
    try {
        // Build the complete query based on filters
        let results;

        if (filters?.visible_only === true) {
            results = await db.select()
                .from(servicesTable)
                .where(eq(servicesTable.visible, true))
                .orderBy(asc(servicesTable.order), asc(servicesTable.id))
                .execute();
        } else {
            results = await db.select()
                .from(servicesTable)
                .orderBy(asc(servicesTable.order), asc(servicesTable.id))
                .execute();
        }

        // Convert numeric fields from database strings to numbers
        return results.map(service => ({
            ...service,
            base_price_team: parseFloat(service.base_price_team),
            base_price_solo: parseFloat(service.base_price_solo)
        }));
    } catch (error) {
        console.error('Failed to retrieve services:', error);
        throw error;
    }
}