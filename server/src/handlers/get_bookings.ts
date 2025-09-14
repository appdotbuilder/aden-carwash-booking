import { db } from '../db';
import { bookingsTable, customersTable, servicesTable, zonesTable } from '../db/schema';
import { type Booking } from '../schema';
import { eq, and, gte, lte, desc, SQL } from 'drizzle-orm';

/**
 * Retrieves all bookings with optional filtering.
 * This handler supports various filters for admin dashboard:
 * - By status (confirmed, on_the_way, started, finished, etc.)
 * - By date range (today, upcoming, historical)
 * - By zone/district for scheduling optimization
 * - By customer for service history
 */
export const getBookings = async (filters?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  zone_id?: number;
  customer_id?: number;
}): Promise<Booking[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (filters?.status) {
      conditions.push(eq(bookingsTable.status, filters.status as any));
    }

    if (filters?.date_from) {
      conditions.push(gte(bookingsTable.created_at, new Date(filters.date_from)));
    }

    if (filters?.date_to) {
      conditions.push(lte(bookingsTable.created_at, new Date(filters.date_to)));
    }

    if (filters?.zone_id) {
      conditions.push(eq(bookingsTable.zone_id, filters.zone_id));
    }

    if (filters?.customer_id) {
      conditions.push(eq(bookingsTable.customer_id, filters.customer_id));
    }

    // Build final query with or without where clause
    const results = conditions.length > 0
      ? await db.select()
          .from(bookingsTable)
          .innerJoin(customersTable, eq(bookingsTable.customer_id, customersTable.id))
          .innerJoin(servicesTable, eq(bookingsTable.service_id, servicesTable.id))
          .innerJoin(zonesTable, eq(bookingsTable.zone_id, zonesTable.id))
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(bookingsTable.created_at), desc(bookingsTable.scheduled_window_start))
          .execute()
      : await db.select()
          .from(bookingsTable)
          .innerJoin(customersTable, eq(bookingsTable.customer_id, customersTable.id))
          .innerJoin(servicesTable, eq(bookingsTable.service_id, servicesTable.id))
          .innerJoin(zonesTable, eq(bookingsTable.zone_id, zonesTable.id))
          .orderBy(desc(bookingsTable.created_at), desc(bookingsTable.scheduled_window_start))
          .execute();

    // Map joined results back to Booking schema with numeric conversions
    return results.map(result => ({
      id: result.bookings.id,
      customer_id: result.bookings.customer_id,
      service_id: result.bookings.service_id,
      addons: result.bookings.addons,
      car_type: result.bookings.car_type,
      zone_id: result.bookings.zone_id,
      address_text: result.bookings.address_text,
      geo_point: result.bookings.geo_point,
      scheduled_window_start: result.bookings.scheduled_window_start,
      scheduled_window_end: result.bookings.scheduled_window_end,
      status: result.bookings.status,
      price_total: parseFloat(result.bookings.price_total), // Convert numeric to number
      is_solo: result.bookings.is_solo,
      distance_fee: result.bookings.distance_fee ? parseFloat(result.bookings.distance_fee) : null, // Convert numeric to number
      created_at: result.bookings.created_at
    }));
  } catch (error) {
    console.error('Get bookings failed:', error);
    throw error;
  }
};