import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable, zonesTable, bookingsTable } from '../db/schema';
import { type UpdateBookingInput, updateBooking } from '../handlers/update_booking';
import { eq } from 'drizzle-orm';

// Test data setup
const testCustomer = {
  name: 'Ahmed Ali',
  phone: '+967771234567',
  whatsapp_verified: false
};

const testZone = {
  name_ar: 'صنعاء',
  name_en: 'Sanaa',
  polygon_or_center: '{"type":"Point","coordinates":[44.2075,15.3693]}',
  notes: null
};

const testService = {
  slug: 'car-wash',
  name_ar: 'غسيل سيارة',
  name_en: 'Car Wash',
  desc_ar: null,
  desc_en: null,
  base_price_team: '15000.00',
  base_price_solo: '12000.00',
  est_minutes: 60,
  order: 1,
  visible: true
};

const testBooking = {
  customer_id: 1,
  service_id: 1,
  addons: [],
  car_type: 'sedan' as const,
  zone_id: 1,
  address_text: 'Test Address, Sanaa',
  geo_point: '{"type":"Point","coordinates":[44.2075,15.3693]}',
  scheduled_window_start: new Date('2024-12-01T10:00:00Z'),
  scheduled_window_end: new Date('2024-12-01T12:00:00Z'),
  status: 'confirmed' as const,
  price_total: '15000.00',
  is_solo: false,
  distance_fee: null
};

describe('updateBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update booking status', async () => {
    // Create prerequisite data
    await db.insert(customersTable).values(testCustomer).execute();
    await db.insert(zonesTable).values(testZone).execute();
    await db.insert(servicesTable).values(testService).execute();
    
    const [booking] = await db.insert(bookingsTable)
      .values(testBooking)
      .returning()
      .execute();

    const updateInput: UpdateBookingInput = {
      status: 'on_the_way'
    };

    const result = await updateBooking(booking.id, updateInput);

    expect(result.status).toEqual('on_the_way');
    expect(result.id).toEqual(booking.id);
    expect(result.address_text).toEqual(testBooking.address_text);
    expect(typeof result.price_total).toEqual('number');
    expect(result.price_total).toEqual(15000);
  });

  it('should update scheduled time window', async () => {
    // Create prerequisite data
    await db.insert(customersTable).values(testCustomer).execute();
    await db.insert(zonesTable).values(testZone).execute();
    await db.insert(servicesTable).values(testService).execute();
    
    const [booking] = await db.insert(bookingsTable)
      .values(testBooking)
      .returning()
      .execute();

    const newStartTime = '2024-12-02T14:00:00Z';
    const newEndTime = '2024-12-02T16:00:00Z';

    const updateInput: UpdateBookingInput = {
      scheduled_window_start: newStartTime,
      scheduled_window_end: newEndTime
    };

    const result = await updateBooking(booking.id, updateInput);

    expect(result.scheduled_window_start).toEqual(new Date(newStartTime));
    expect(result.scheduled_window_end).toEqual(new Date(newEndTime));
    expect(result.status).toEqual('confirmed'); // Should remain unchanged
  });

  it('should update address and geo point', async () => {
    // Create prerequisite data
    await db.insert(customersTable).values(testCustomer).execute();
    await db.insert(zonesTable).values(testZone).execute();
    await db.insert(servicesTable).values(testService).execute();
    
    const [booking] = await db.insert(bookingsTable)
      .values(testBooking)
      .returning()
      .execute();

    const updateInput: UpdateBookingInput = {
      address_text: 'New Address, Aden',
      geo_point: {
        lat: 12.7794,
        lng: 45.0367
      }
    };

    const result = await updateBooking(booking.id, updateInput);

    expect(result.address_text).toEqual('New Address, Aden');
    expect(result.geo_point).toEqual('{"type":"Point","coordinates":[45.0367,12.7794]}');
    expect(result.status).toEqual('confirmed'); // Should remain unchanged
  });

  it('should update multiple fields simultaneously', async () => {
    // Create prerequisite data
    await db.insert(customersTable).values(testCustomer).execute();
    await db.insert(zonesTable).values(testZone).execute();
    await db.insert(servicesTable).values(testService).execute();
    
    const [booking] = await db.insert(bookingsTable)
      .values(testBooking)
      .returning()
      .execute();

    const updateInput: UpdateBookingInput = {
      status: 'started',
      address_text: 'Updated Address',
      scheduled_window_start: '2024-12-03T08:00:00Z',
      geo_point: {
        lat: 13.5000,
        lng: 44.0000
      }
    };

    const result = await updateBooking(booking.id, updateInput);

    expect(result.status).toEqual('started');
    expect(result.address_text).toEqual('Updated Address');
    expect(result.scheduled_window_start).toEqual(new Date('2024-12-03T08:00:00Z'));
    expect(result.geo_point).toEqual('{"type":"Point","coordinates":[44,13.5]}');
    expect(result.scheduled_window_end).toEqual(testBooking.scheduled_window_end); // Should remain unchanged
  });

  it('should save updates to database', async () => {
    // Create prerequisite data
    await db.insert(customersTable).values(testCustomer).execute();
    await db.insert(zonesTable).values(testZone).execute();
    await db.insert(servicesTable).values(testService).execute();
    
    const [booking] = await db.insert(bookingsTable)
      .values(testBooking)
      .returning()
      .execute();

    const updateInput: UpdateBookingInput = {
      status: 'finished'
    };

    await updateBooking(booking.id, updateInput);

    // Verify the change was persisted
    const dbBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, booking.id))
      .execute();

    expect(dbBookings).toHaveLength(1);
    expect(dbBookings[0].status).toEqual('finished');
  });

  it('should throw error for non-existent booking', async () => {
    const updateInput: UpdateBookingInput = {
      status: 'finished'
    };

    await expect(updateBooking(999, updateInput)).rejects.toThrow(/Booking with ID 999 not found/i);
  });

  it('should handle numeric field conversion correctly', async () => {
    // Create prerequisite data
    await db.insert(customersTable).values(testCustomer).execute();
    await db.insert(zonesTable).values(testZone).execute();
    await db.insert(servicesTable).values(testService).execute();
    
    // Create booking with distance fee
    const bookingWithFee = {
      ...testBooking,
      distance_fee: '2500.50'
    };
    
    const [booking] = await db.insert(bookingsTable)
      .values(bookingWithFee)
      .returning()
      .execute();

    const updateInput: UpdateBookingInput = {
      status: 'on_the_way'
    };

    const result = await updateBooking(booking.id, updateInput);

    // Verify numeric conversions
    expect(typeof result.price_total).toEqual('number');
    expect(result.price_total).toEqual(15000);
    expect(typeof result.distance_fee).toEqual('number');
    expect(result.distance_fee).toEqual(2500.50);
  });

  it('should preserve original values for unspecified fields', async () => {
    // Create prerequisite data
    await db.insert(customersTable).values(testCustomer).execute();
    await db.insert(zonesTable).values(testZone).execute();
    await db.insert(servicesTable).values(testService).execute();
    
    const [booking] = await db.insert(bookingsTable)
      .values(testBooking)
      .returning()
      .execute();

    // Only update status, leave everything else unchanged
    const updateInput: UpdateBookingInput = {
      status: 'canceled'
    };

    const result = await updateBooking(booking.id, updateInput);

    // Check that only status changed
    expect(result.status).toEqual('canceled');
    expect(result.address_text).toEqual(testBooking.address_text);
    expect(result.scheduled_window_start).toEqual(testBooking.scheduled_window_start);
    expect(result.scheduled_window_end).toEqual(testBooking.scheduled_window_end);
    expect(result.geo_point).toEqual(testBooking.geo_point);
    expect(result.car_type).toEqual(testBooking.car_type);
  });
});