import { db } from '../db';
import { zonesTable } from '../db/schema';
import { type Zone } from '../schema';

/**
 * Retrieves service zones for location selection and pricing.
 * This handler returns zones for:
 * - Booking wizard location validation
 * - Distance fee calculation
 * - Admin scheduling and routing
 * - Service area display on website
 */
export const getZones = async (): Promise<Zone[]> => {
  try {
    const results = await db.select()
      .from(zonesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to retrieve zones:', error);
    throw error;
  }
};