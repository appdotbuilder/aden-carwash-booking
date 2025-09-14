import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable, zonesTable, bookingsTable } from '../db/schema';
import { getAdminOverview } from '../handlers/get_admin_overview';

describe('getAdminOverview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero metrics when no data exists', async () => {
    const result = await getAdminOverview();

    expect(result.today_bookings).toEqual(0);
    expect(result.pending_bookings).toEqual(0);
    expect(result.completed_bookings).toEqual(0);
    expect(result.revenue_today).toEqual(0);
    expect(result.avg_service_time).toEqual(0);
    expect(result.on_time_percentage).toEqual(0);
  });

  it('should calculate today booking counts correctly', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '+967123456789',
        whatsapp_verified: false
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        slug: 'test-service',
        name_ar: 'خدمة تجريبية',
        name_en: 'Test Service',
        base_price_team: '50.00',
        base_price_solo: '30.00',
        est_minutes: 60,
        order: 0,
        visible: true
      })
      .returning()
      .execute();

    const zone = await db.insert(zonesTable)
      .values({
        name_ar: 'منطقة تجريبية',
        name_en: 'Test Zone',
        polygon_or_center: '{"type":"Point","coordinates":[44.2126,15.3694]}',
        notes: null
      })
      .returning()
      .execute();

    // Create today's bookings
    const today = new Date();
    const todayBookingData = {
      customer_id: customer[0].id,
      service_id: service[0].id,
      addons: [],
      car_type: 'sedan' as const,
      zone_id: zone[0].id,
      address_text: 'Test Address',
      geo_point: '{"type":"Point","coordinates":[44.2126,15.3694]}',
      scheduled_window_start: today,
      scheduled_window_end: new Date(today.getTime() + 60 * 60 * 1000),
      status: 'confirmed' as const,
      price_total: '50.00',
      is_solo: false,
      distance_fee: null,
      created_at: today
    };

    // Create 3 bookings today
    await db.insert(bookingsTable).values([
      todayBookingData,
      { ...todayBookingData, status: 'finished' as const },
      { ...todayBookingData, status: 'on_the_way' as const }
    ]).execute();

    const result = await getAdminOverview();

    expect(result.today_bookings).toEqual(3);
    expect(result.completed_bookings).toEqual(1);
    expect(result.pending_bookings).toEqual(2); // confirmed + on_the_way
  });

  it('should calculate revenue from completed bookings today', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '+967123456789',
        whatsapp_verified: false
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        slug: 'test-service',
        name_ar: 'خدمة تجريبية',
        name_en: 'Test Service',
        base_price_team: '100.00',
        base_price_solo: '75.00',
        est_minutes: 90,
        order: 0,
        visible: true
      })
      .returning()
      .execute();

    const zone = await db.insert(zonesTable)
      .values({
        name_ar: 'منطقة تجريبية',
        name_en: 'Test Zone',
        polygon_or_center: '{"type":"Point","coordinates":[44.2126,15.3694]}',
        notes: null
      })
      .returning()
      .execute();

    const today = new Date();

    // Create finished bookings with different prices
    await db.insert(bookingsTable).values([
      {
        customer_id: customer[0].id,
        service_id: service[0].id,
        addons: [],
        car_type: 'sedan' as const,
        zone_id: zone[0].id,
        address_text: 'Test Address',
        geo_point: '{"type":"Point","coordinates":[44.2126,15.3694]}',
        scheduled_window_start: today,
        scheduled_window_end: new Date(today.getTime() + 60 * 60 * 1000),
        status: 'finished' as const,
        price_total: '100.50',
        is_solo: false,
        distance_fee: null,
        created_at: today
      },
      {
        customer_id: customer[0].id,
        service_id: service[0].id,
        addons: [],
        car_type: 'suv' as const,
        zone_id: zone[0].id,
        address_text: 'Test Address 2',
        geo_point: '{"type":"Point","coordinates":[44.2126,15.3694]}',
        scheduled_window_start: today,
        scheduled_window_end: new Date(today.getTime() + 60 * 60 * 1000),
        status: 'finished' as const,
        price_total: '75.25',
        is_solo: true,
        distance_fee: null,
        created_at: today
      }
    ]).execute();

    const result = await getAdminOverview();

    expect(result.revenue_today).toEqual(175.75); // 100.50 + 75.25
    expect(typeof result.revenue_today).toBe('number');
  });

  it('should calculate average service time from recent bookings', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '+967123456789',
        whatsapp_verified: false
      })
      .returning()
      .execute();

    const services = await db.insert(servicesTable)
      .values([
        {
          slug: 'service-60min',
          name_ar: 'خدمة 60 دقيقة',
          name_en: 'Service 60min',
          base_price_team: '50.00',
          base_price_solo: '30.00',
          est_minutes: 60,
          order: 0,
          visible: true
        },
        {
          slug: 'service-90min',
          name_ar: 'خدمة 90 دقيقة',
          name_en: 'Service 90min',
          base_price_team: '75.00',
          base_price_solo: '50.00',
          est_minutes: 90,
          order: 1,
          visible: true
        }
      ])
      .returning()
      .execute();

    const zone = await db.insert(zonesTable)
      .values({
        name_ar: 'منطقة تجريبية',
        name_en: 'Test Zone',
        polygon_or_center: '{"type":"Point","coordinates":[44.2126,15.3694]}',
        notes: null
      })
      .returning()
      .execute();

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 15); // 15 days ago

    // Create finished bookings with different service times
    await db.insert(bookingsTable).values([
      {
        customer_id: customer[0].id,
        service_id: services[0].id, // 60 minutes
        addons: [],
        car_type: 'sedan' as const,
        zone_id: zone[0].id,
        address_text: 'Test Address',
        geo_point: '{"type":"Point","coordinates":[44.2126,15.3694]}',
        scheduled_window_start: recentDate,
        scheduled_window_end: new Date(recentDate.getTime() + 60 * 60 * 1000),
        status: 'finished' as const,
        price_total: '50.00',
        is_solo: false,
        distance_fee: null,
        created_at: recentDate
      },
      {
        customer_id: customer[0].id,
        service_id: services[1].id, // 90 minutes
        addons: [],
        car_type: 'suv' as const,
        zone_id: zone[0].id,
        address_text: 'Test Address 2',
        geo_point: '{"type":"Point","coordinates":[44.2126,15.3694]}',
        scheduled_window_start: recentDate,
        scheduled_window_end: new Date(recentDate.getTime() + 90 * 60 * 1000),
        status: 'finished' as const,
        price_total: '75.00',
        is_solo: false,
        distance_fee: null,
        created_at: recentDate
      }
    ]).execute();

    const result = await getAdminOverview();

    expect(result.avg_service_time).toEqual(75); // (60 + 90) / 2 = 75
  });

  it('should calculate on-time percentage correctly', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '+967123456789',
        whatsapp_verified: false
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        slug: 'test-service',
        name_ar: 'خدمة تجريبية',
        name_en: 'Test Service',
        base_price_team: '50.00',
        base_price_solo: '30.00',
        est_minutes: 60,
        order: 0,
        visible: true
      })
      .returning()
      .execute();

    const zone = await db.insert(zonesTable)
      .values({
        name_ar: 'منطقة تجريبية',
        name_en: 'Test Zone',
        polygon_or_center: '{"type":"Point","coordinates":[44.2126,15.3694]}',
        notes: null
      })
      .returning()
      .execute();

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

    // Create 5 total bookings, 3 finished (60% completion rate)
    const bookingData = {
      customer_id: customer[0].id,
      service_id: service[0].id,
      addons: [],
      car_type: 'sedan' as const,
      zone_id: zone[0].id,
      address_text: 'Test Address',
      geo_point: '{"type":"Point","coordinates":[44.2126,15.3694]}',
      scheduled_window_start: recentDate,
      scheduled_window_end: new Date(recentDate.getTime() + 60 * 60 * 1000),
      price_total: '50.00',
      is_solo: false,
      distance_fee: null,
      created_at: recentDate
    };

    await db.insert(bookingsTable).values([
      { ...bookingData, status: 'finished' as const },
      { ...bookingData, status: 'finished' as const },
      { ...bookingData, status: 'finished' as const },
      { ...bookingData, status: 'confirmed' as const },
      { ...bookingData, status: 'canceled' as const }
    ]).execute();

    const result = await getAdminOverview();

    expect(result.on_time_percentage).toEqual(60); // 3 finished out of 5 total = 60%
  });

  it('should handle mixed date ranges correctly', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '+967123456789',
        whatsapp_verified: false
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        slug: 'test-service',
        name_ar: 'خدمة تجريبية',
        name_en: 'Test Service',
        base_price_team: '50.00',
        base_price_solo: '30.00',
        est_minutes: 60,
        order: 0,
        visible: true
      })
      .returning()
      .execute();

    const zone = await db.insert(zonesTable)
      .values({
        name_ar: 'منطقة تجريبية',
        name_en: 'Test Zone',
        polygon_or_center: '{"type":"Point","coordinates":[44.2126,15.3694]}',
        notes: null
      })
      .returning()
      .execute();

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const baseBooking = {
      customer_id: customer[0].id,
      service_id: service[0].id,
      addons: [],
      car_type: 'sedan' as const,
      zone_id: zone[0].id,
      address_text: 'Test Address',
      geo_point: '{"type":"Point","coordinates":[44.2126,15.3694]}',
      scheduled_window_start: today,
      scheduled_window_end: new Date(today.getTime() + 60 * 60 * 1000),
      status: 'finished' as const,
      price_total: '50.00',
      is_solo: false,
      distance_fee: null
    };

    // Create bookings on different days
    await db.insert(bookingsTable).values([
      { ...baseBooking, created_at: today }, // Today
      { ...baseBooking, created_at: yesterday } // Yesterday
    ]).execute();

    const result = await getAdminOverview();

    // Should only count today's bookings for today_bookings and completed_bookings
    expect(result.today_bookings).toEqual(1);
    expect(result.completed_bookings).toEqual(1);
    expect(result.revenue_today).toEqual(50);
  });
});