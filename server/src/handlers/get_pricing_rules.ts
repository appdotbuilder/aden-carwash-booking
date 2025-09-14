import { db } from '../db';
import { pricingRulesTable } from '../db/schema';
import { type PricingRule } from '../schema';
import { eq, inArray, and, type SQL } from 'drizzle-orm';

/**
 * Retrieves pricing rules for calculations and admin management.
 * This handler returns pricing configuration:
 * - Distance fee rules and thresholds  
 * - Surge pricing windows and multipliers
 * - Discount rules and conditions
 * - Zone-specific pricing adjustments
 * - Time-based pricing variations
 */
export async function getPricingRules(filters?: {
    enabled_only?: boolean;
    keys?: string[];
}): Promise<PricingRule[]> {
    try {
        // Build conditions array
        const conditions: SQL<unknown>[] = [];

        // Apply enabled filter if requested
        if (filters?.enabled_only === true) {
            conditions.push(eq(pricingRulesTable.enabled, true));
        }

        // Apply keys filter if provided
        if (filters?.keys && filters.keys.length > 0) {
            conditions.push(inArray(pricingRulesTable.key, filters.keys));
        }

        // Build and execute query
        const baseQuery = db.select().from(pricingRulesTable);
        
        let query;
        if (conditions.length > 0) {
            query = baseQuery.where(
                conditions.length === 1 ? conditions[0] : and(...conditions)
            );
        } else {
            query = baseQuery;
        }

        const results = await query.orderBy(pricingRulesTable.key).execute();

        return results;
    } catch (error) {
        console.error('Pricing rules retrieval failed:', error);
        throw error;
    }
}