import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, bookingsTable, servicesTable, addonsTable, zonesTable } from '../db/schema';
import { type CreateBookingInput } from '../schema';
import { createBooking } from '../handlers/create_booking';
import { eq } from 'drizzle-orm';

describe('createBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test prerequisites
  const setupTestData = async () => {
    // Create zone
    const zones = await db.insert(zonesTable)
      .values({
        name_ar: 'منطقة الاختبار',
        name_en: 'Test Zone',
        polygon_or_center: JSON.stringify({
          type: 'Point',
          coordinates: [44.2124, 15.3694]
        }),
        notes: null
      })
      .returning()
      .execute();

    // Create service
    const services = await db.insert(servicesTable)
      .values({
        slug: 'test-service',
        name_ar: 'خدمة اختبار',
        name_en: 'Test Service',
        desc_ar: null,
        desc_en: null,
        base_price_team: '100.00',
        base_price_solo: '150.00',
        est_minutes: 60,
        order: 1,
        visible: true
      })
      .returning()
      .execute();

    // Create addon
    const testAddons = await db.insert(addonsTable)
      .values({
        slug: 'test-addon',
        name_ar: 'إضافة اختبار',
        name_en: 'Test Addon',
        desc_ar: null,
        desc_en: null,
        price: '25.00',
        est_minutes: 15,
        order: 1,
        visible: true
      })
      .returning()
      .execute();

    return {
      zone: zones[0],
      service: services[0],
      addon: testAddons[0]
    };
  };

  const createTestInput = (overrides: Partial<CreateBookingInput> = {}): CreateBookingInput => ({
    customer: {
      name: 'احمد محمد',
      phone: '+967712345678'
    },
    service_id: 1,
    addons: [],
    car_type: 'sedan',
    zone_id: 1,
    address_text: 'شارع الزبيري، صنعاء',
    geo_point: {
      lat: 15.3694,
      lng: 44.2124
    },
    scheduled_window: {
      start: '2024-12-20T10:00:00Z',
      end: '2024-12-20T12:00:00Z'
    },
    is_solo: false,
    ...overrides
  });

  it('should create booking with new customer', async () => {
    const testData = await setupTestData();
    const input = createTestInput({
      service_id: testData.service.id,
      zone_id: testData.zone.id
    });

    const result = await createBooking(input);

    // Validate response structure
    expect(result.booking_id).toMatch(/^BK\d{6}$/);
    expect(result.price_total).toBe(100); // Team price
    expect(result.wa_message_id).toMatch(/^wa_\d+_\d+$/);
    expect(typeof result.price_total).toBe('number');

    // Verify customer was created
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.phone, input.customer.phone))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toBe('احمد محمد');
    expect(customers[0].whatsapp_verified).toBe(false);

    // Verify booking was created
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.customer_id, customers[0].id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].service_id).toBe(testData.service.id);
    expect(bookings[0].zone_id).toBe(testData.zone.id);
    expect(bookings[0].car_type).toBe('sedan');
    expect(bookings[0].status).toBe('confirmed');
    expect(parseFloat(bookings[0].price_total)).toBe(100);
    expect(bookings[0].is_solo).toBe(false);
  });

  it('should reuse existing customer', async () => {
    const testData = await setupTestData();

    // Create existing customer
    const existingCustomer = await db.insert(customersTable)
      .values({
        name: 'محمد أحمد',
        phone: '+967712345678',
        whatsapp_verified: true
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const input = createTestInput({
      service_id: testData.service.id,
      zone_id: testData.zone.id,
      customer: {
        name: 'احمد محمد', // Different name
        phone: '+967712345678' // Same phone
      }
    });

    const result = await createBooking(input);

    expect(result.booking_id).toMatch(/^BK\d{6}$/);

    // Verify no new customer was created
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.phone, input.customer.phone))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].id).toBe(existingCustomer.id);
    expect(customers[0].name).toBe('محمد أحمد'); // Original name preserved

    // Verify booking uses existing customer
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.customer_id, existingCustomer.id))
      .execute();

    expect(bookings).toHaveLength(1);
  });

  it('should calculate solo pricing correctly', async () => {
    const testData = await setupTestData();
    const input = createTestInput({
      service_id: testData.service.id,
      zone_id: testData.zone.id,
      is_solo: true
    });

    const result = await createBooking(input);

    expect(result.price_total).toBe(150); // Solo price

    // Verify booking record has correct solo flag
    const bookings = await db.select()
      .from(bookingsTable)
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].is_solo).toBe(true);
    expect(parseFloat(bookings[0].price_total)).toBe(150);
  });

  it('should include addon pricing in total', async () => {
    const testData = await setupTestData();
    const input = createTestInput({
      service_id: testData.service.id,
      zone_id: testData.zone.id,
      addons: [testData.addon.id]
    });

    const result = await createBooking(input);

    expect(result.price_total).toBe(125); // Base (100) + Addon (25)

    // Verify booking record includes addon IDs
    const bookings = await db.select()
      .from(bookingsTable)
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].addons).toEqual([testData.addon.id]);
  });

  it('should store geo point as GeoJSON', async () => {
    const testData = await setupTestData();
    const input = createTestInput({
      service_id: testData.service.id,
      zone_id: testData.zone.id,
      geo_point: { lat: 15.5, lng: 44.2 }
    });

    await createBooking(input);

    const bookings = await db.select()
      .from(bookingsTable)
      .execute();

    expect(bookings).toHaveLength(1);
    const geoPoint = JSON.parse(bookings[0].geo_point);
    expect(geoPoint).toEqual({
      type: 'Point',
      coordinates: [44.2, 15.5] // lng, lat order for GeoJSON
    });
  });

  it('should handle scheduled time windows correctly', async () => {
    const testData = await setupTestData();
    const startTime = '2024-12-25T14:30:00Z';
    const endTime = '2024-12-25T16:30:00Z';

    const input = createTestInput({
      service_id: testData.service.id,
      zone_id: testData.zone.id,
      scheduled_window: {
        start: startTime,
        end: endTime
      }
    });

    await createBooking(input);

    const bookings = await db.select()
      .from(bookingsTable)
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].scheduled_window_start).toEqual(new Date(startTime));
    expect(bookings[0].scheduled_window_end).toEqual(new Date(endTime));
  });

  it('should throw error for non-existent service', async () => {
    await setupTestData();
    const input = createTestInput({
      service_id: 999999 // Non-existent service
    });

    await expect(createBooking(input)).rejects.toThrow(/service not found/i);
  });

  it('should throw error for non-existent addon', async () => {
    const testData = await setupTestData();
    const input = createTestInput({
      service_id: testData.service.id,
      zone_id: testData.zone.id,
      addons: [999999] // Non-existent addon
    });

    await expect(createBooking(input)).rejects.toThrow(/addons not found/i);
  });

  it('should handle multiple addons correctly', async () => {
    const testData = await setupTestData();

    // Create second addon
    const addon2 = await db.insert(addonsTable)
      .values({
        slug: 'test-addon-2',
        name_ar: 'إضافة اختبار ٢',
        name_en: 'Test Addon 2',
        desc_ar: null,
        desc_en: null,
        price: '35.00',
        est_minutes: 20,
        order: 2,
        visible: true
      })
      .returning()
      .execute()
      .then(results => results[0]);

    const input = createTestInput({
      service_id: testData.service.id,
      zone_id: testData.zone.id,
      addons: [testData.addon.id, addon2.id]
    });

    const result = await createBooking(input);

    expect(result.price_total).toBe(160); // Base (100) + Addon1 (25) + Addon2 (35)

    const bookings = await db.select()
      .from(bookingsTable)
      .execute();

    expect(bookings[0].addons).toEqual([testData.addon.id, addon2.id]);
  });
});