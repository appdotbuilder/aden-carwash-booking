import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookingsTable, customersTable, servicesTable, zonesTable } from '../db/schema';
import { getBookings } from '../handlers/get_bookings';
import { eq } from 'drizzle-orm';

// Test data factory - generates unique data for each test
let testCustomerCounter = 0;
const createTestCustomer = () => ({
  name: 'John Doe',
  phone: `+96771234${5678 + testCustomerCounter++}`,
  whatsapp_verified: true
});

// Test data factories to avoid unique constraint violations
let testZoneCounter = 0;
let testServiceCounter = 0;

const createTestZone = () => ({
  name_ar: `منطقة الاختبار ${testZoneCounter}`,
  name_en: `Test Zone ${testZoneCounter++}`,
  polygon_or_center: `{"type":"Point","coordinates":[${44.0 + testZoneCounter * 0.1},15.0]}`,
  notes: 'Test zone for bookings'
});

const createTestService = () => ({
  slug: `basic-wash-${testServiceCounter++}`,
  name_ar: 'غسيل أساسي',
  name_en: 'Basic Wash',
  desc_ar: 'خدمة غسيل أساسية',
  desc_en: 'Basic washing service',
  base_price_team: '25.00',
  base_price_solo: '20.00',
  est_minutes: 45,
  order: 1,
  visible: true
});

const createTestBooking = async (overrides = {}) => {
  // Create prerequisite records first
  const [customer] = await db.insert(customersTable)
    .values(createTestCustomer())
    .returning()
    .execute();

  const [zone] = await db.insert(zonesTable)
    .values(createTestZone())
    .returning()
    .execute();

  const [service] = await db.insert(servicesTable)
    .values(createTestService())
    .returning()
    .execute();

  // Create booking with all required fields
  const bookingData = {
    customer_id: customer.id,
    service_id: service.id,
    addons: [],
    car_type: 'sedan' as const,
    zone_id: zone.id,
    address_text: '123 Test Street, Test City',
    geo_point: '{"type":"Point","coordinates":[44.1,15.1]}',
    scheduled_window_start: new Date('2024-01-15T09:00:00Z'),
    scheduled_window_end: new Date('2024-01-15T11:00:00Z'),
    status: 'confirmed' as const,
    price_total: '25.00',
    is_solo: false,
    distance_fee: '5.00',
    ...overrides
  };

  const [booking] = await db.insert(bookingsTable)
    .values(bookingData)
    .returning()
    .execute();

  return { booking, customer, zone, service };
};

describe('getBookings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all bookings when no filters are provided', async () => {
    // Create test booking
    await createTestBooking();
    await createTestBooking({
      status: 'finished' as const,
      price_total: '30.00'
    });

    const results = await getBookings();

    expect(results).toHaveLength(2);
    expect(results[0].customer_id).toBeDefined();
    expect(results[0].service_id).toBeDefined();
    expect(results[0].zone_id).toBeDefined();
    expect(typeof results[0].price_total).toBe('number');
    expect(typeof results[0].distance_fee).toBe('number');
  });

  it('should filter bookings by status', async () => {
    // Create bookings with different statuses
    await createTestBooking({ status: 'confirmed' as const });
    await createTestBooking({ status: 'finished' as const });
    await createTestBooking({ status: 'on_the_way' as const });

    const confirmedBookings = await getBookings({ status: 'confirmed' });
    const finishedBookings = await getBookings({ status: 'finished' });

    expect(confirmedBookings).toHaveLength(1);
    expect(confirmedBookings[0].status).toBe('confirmed');

    expect(finishedBookings).toHaveLength(1);
    expect(finishedBookings[0].status).toBe('finished');
  });

  it('should filter bookings by date range', async () => {
    const yesterday = new Date('2024-01-14T10:00:00Z');
    const today = new Date('2024-01-15T10:00:00Z');
    const tomorrow = new Date('2024-01-16T10:00:00Z');

    // Create first booking and update its created_at to yesterday
    const booking1Data = await createTestBooking();
    await db.update(bookingsTable)
      .set({ created_at: yesterday })
      .where(eq(bookingsTable.id, booking1Data.booking.id))
      .execute();

    // Create second booking and update its created_at to today
    const booking2Data = await createTestBooking();
    await db.update(bookingsTable)
      .set({ created_at: today })
      .where(eq(bookingsTable.id, booking2Data.booking.id))
      .execute();

    // Test filtering for yesterday's bookings
    const yesterdayBookings = await getBookings({
      date_from: new Date('2024-01-14T00:00:00Z').toISOString(),
      date_to: new Date('2024-01-14T23:59:59Z').toISOString()
    });

    // Test filtering for today's bookings
    const todayBookings = await getBookings({
      date_from: today.toISOString(),
      date_to: tomorrow.toISOString()
    });

    expect(yesterdayBookings).toHaveLength(1);
    expect(yesterdayBookings[0].id).toBe(booking1Data.booking.id);
    
    expect(todayBookings).toHaveLength(1);
    expect(todayBookings[0].id).toBe(booking2Data.booking.id);
  });

  it('should filter bookings by zone_id', async () => {
    // Create first booking with default zone
    const { zone: zone1 } = await createTestBooking();

    // Create second zone and booking
    const [zone2] = await db.insert(zonesTable)
      .values({
        name_ar: 'منطقة ثانية',
        name_en: 'Second Zone',
        polygon_or_center: '{"type":"Point","coordinates":[44.2,15.2]}'
      })
      .returning()
      .execute();

    await createTestBooking({ zone_id: zone2.id });

    // Test zone filtering
    const zone1Bookings = await getBookings({ zone_id: zone1.id });
    const zone2Bookings = await getBookings({ zone_id: zone2.id });

    expect(zone1Bookings).toHaveLength(1);
    expect(zone1Bookings[0].zone_id).toBe(zone1.id);

    expect(zone2Bookings).toHaveLength(1);
    expect(zone2Bookings[0].zone_id).toBe(zone2.id);
  });

  it('should filter bookings by customer_id', async () => {
    // Create first booking with default customer
    const { customer: customer1 } = await createTestBooking();

    // Create second customer and booking
    const [customer2] = await db.insert(customersTable)
      .values(createTestCustomer())
      .returning()
      .execute();

    await createTestBooking({ customer_id: customer2.id });

    // Test customer filtering
    const customer1Bookings = await getBookings({ customer_id: customer1.id });
    const customer2Bookings = await getBookings({ customer_id: customer2.id });

    expect(customer1Bookings).toHaveLength(1);
    expect(customer1Bookings[0].customer_id).toBe(customer1.id);

    expect(customer2Bookings).toHaveLength(1);
    expect(customer2Bookings[0].customer_id).toBe(customer2.id);
  });

  it('should handle multiple filters simultaneously', async () => {
    // Create first booking with confirmed status in a specific zone
    const { customer, zone } = await createTestBooking({
      status: 'confirmed' as const
    });

    // Create second booking with finished status in the same zone
    await createTestBooking({
      status: 'finished' as const,
      zone_id: zone.id
    });

    // Create third booking with confirmed status in the same zone (different customer)
    await createTestBooking({
      status: 'confirmed' as const,
      zone_id: zone.id
    });

    // Filter by status and zone - should return 2 confirmed bookings in the zone
    const results = await getBookings({
      status: 'confirmed',
      zone_id: zone.id
    });

    expect(results).toHaveLength(2);
    results.forEach(booking => {
      expect(booking.status).toBe('confirmed');
      expect(booking.zone_id).toBe(zone.id);
    });
  });

  it('should return bookings ordered by created_at desc, then scheduled_window_start desc', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Create bookings with different timestamps
    const booking1 = await createTestBooking({
      scheduled_window_start: new Date('2024-01-15T09:00:00Z')
    });
    
    const booking2 = await createTestBooking({
      scheduled_window_start: new Date('2024-01-15T11:00:00Z')
    });

    // Update created_at times
    await db.update(bookingsTable)
      .set({ created_at: twoHoursAgo })
      .where(eq(bookingsTable.id, booking1.booking.id))
      .execute();

    await db.update(bookingsTable)
      .set({ created_at: oneHourAgo })
      .where(eq(bookingsTable.id, booking2.booking.id))
      .execute();

    const results = await getBookings();

    expect(results).toHaveLength(2);
    // Most recent booking should be first
    expect(results[0].id).toBe(booking2.booking.id);
    expect(results[1].id).toBe(booking1.booking.id);
  });

  it('should return empty array when no bookings match filters', async () => {
    await createTestBooking({ status: 'confirmed' as const });

    const results = await getBookings({ status: 'canceled' });

    expect(results).toHaveLength(0);
  });

  it('should handle numeric field conversions correctly', async () => {
    await createTestBooking({
      price_total: '99.50',
      distance_fee: '12.75'
    });

    const results = await getBookings();

    expect(results).toHaveLength(1);
    expect(typeof results[0].price_total).toBe('number');
    expect(results[0].price_total).toBe(99.50);
    expect(typeof results[0].distance_fee).toBe('number');
    expect(results[0].distance_fee).toBe(12.75);
  });

  it('should handle null distance_fee correctly', async () => {
    await createTestBooking({
      distance_fee: null
    });

    const results = await getBookings();

    expect(results).toHaveLength(1);
    expect(results[0].distance_fee).toBeNull();
  });
});