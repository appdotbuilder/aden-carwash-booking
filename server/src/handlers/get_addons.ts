import { db } from '../db';
import { addonsTable } from '../db/schema';
import { type Addon } from '../schema';
import { eq, asc, SQL } from 'drizzle-orm';

/**
 * Retrieves all available add-on services.
 * This handler returns add-ons that can be selected during booking:
 * - Only visible/active add-ons
 * - Pricing and time estimates
 * - Proper ordering for display
 * - Localized content for Arabic/English
 */
export const getAddons = async (filters?: {
  visible_only?: boolean;
  language?: 'ar' | 'en';
}): Promise<Addon[]> => {
  try {
    // Build query with conditional filtering
    const baseQuery = db.select().from(addonsTable);
    
    const finalQuery = filters?.visible_only !== false
      ? baseQuery.where(eq(addonsTable.visible, true)).orderBy(asc(addonsTable.order))
      : baseQuery.orderBy(asc(addonsTable.order));

    const results = await finalQuery.execute();

    // Convert numeric fields back to numbers
    return results.map(addon => ({
      ...addon,
      price: parseFloat(addon.price)
    }));
  } catch (error) {
    console.error('Get addons failed:', error);
    throw error;
  }
};