import { db } from '../db';
import { fleetLeadsTable } from '../db/schema';
import { type CreateFleetLeadInput, type FleetLead } from '../schema';

export const createFleetLead = async (input: CreateFleetLeadInput): Promise<FleetLead> => {
  try {
    // Insert fleet lead record
    const result = await db.insert(fleetLeadsTable)
      .values({
        company_name: input.company_name,
        contact_person: input.contact_person,
        phone: input.phone,
        status: input.status,
        notes: input.notes || null
      })
      .returning()
      .execute();

    const fleetLead = result[0];
    return fleetLead;
  } catch (error) {
    console.error('Fleet lead creation failed:', error);
    throw error;
  }
};