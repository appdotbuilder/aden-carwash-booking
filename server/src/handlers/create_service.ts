import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput, type Service } from '../schema';

/**
 * Creates a new service in the catalog.
 * This handler manages service creation for admin:
 * - Creates new service with localized content
 * - Sets pricing for both team and solo options
 * - Configures time estimates and display order
 * - Manages visibility status
 */
export async function createService(input: CreateServiceInput): Promise<Service> {
  try {
    // Insert service record
    const result = await db.insert(servicesTable)
      .values({
        slug: input.slug,
        name_ar: input.name_ar,
        name_en: input.name_en,
        desc_ar: input.desc_ar || null,
        desc_en: input.desc_en || null,
        base_price_team: input.base_price_team.toString(),
        base_price_solo: input.base_price_solo.toString(),
        est_minutes: input.est_minutes,
        order: input.order,
        visible: input.visible
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const service = result[0];
    return {
      ...service,
      base_price_team: parseFloat(service.base_price_team),
      base_price_solo: parseFloat(service.base_price_solo)
    };
  } catch (error) {
    console.error('Service creation failed:', error);
    throw error;
  }
}