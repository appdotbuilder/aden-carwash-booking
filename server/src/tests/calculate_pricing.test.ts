import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  servicesTable, 
  addonsTable, 
  pricingRulesTable, 
  couponsTable, 
  zonesTable 
} from '../db/schema';
import { calculatePricing } from '../handlers/calculate_pricing';
import { eq } from 'drizzle-orm';

// Test data setup
const testService = {
  slug: 'interior-cleaning',
  name_ar: 'تنظيف داخلي',
  name_en: 'Interior Cleaning',
  desc_ar: 'تنظيف شامل للداخل',
  desc_en: 'Complete interior cleaning',
  base_price_team: '15000.00',
  base_price_solo: '12000.00',
  est_minutes: 45,
  order: 1,
  visible: true
};

const testAddon = {
  slug: 'carpet-cleaning',
  name_ar: 'تنظيف السجاد',
  name_en: 'Carpet Cleaning',
  desc_ar: 'تنظيف عميق للسجاد',
  desc_en: 'Deep carpet cleaning',
  price: '3000.00',
  est_minutes: 20,
  order: 1,
  visible: true
};

const testZone = {
  name_ar: 'صنعاء القديمة',
  name_en: 'Old Sanaa',
  polygon_or_center: '{"type":"Point","coordinates":[44.206,15.369]}',
  notes: 'Historical district'
};

const testCoupon = {
  code: 'SAVE10',
  discount_type: 'percentage' as const,
  value: '10.00',
  start_at: new Date(Date.now() - 86400000), // Yesterday
  end_at: new Date(Date.now() + 86400000), // Tomorrow
  usage_limit: 100
};

const testPricingInput = {
  service_id: 0, // Will be set after service creation
  addons: [] as number[], // Will be set after addon creation
  car_type: 'sedan' as const,
  is_solo: false,
  zone_id: 0, // Will be set after zone creation
  geo_point: { lat: 15.369, lng: 44.206 }
};

describe('calculatePricing', () => {
  let serviceId: number;
  let addonId: number;
  let zoneId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test service
    const serviceResult = await db.insert(servicesTable)
      .values(testService)
      .returning()
      .execute();
    serviceId = serviceResult[0].id;

    // Create test addon
    const addonResult = await db.insert(addonsTable)
      .values(testAddon)
      .returning()
      .execute();
    addonId = addonResult[0].id;

    // Create test zone
    const zoneResult = await db.insert(zonesTable)
      .values(testZone)
      .returning()
      .execute();
    zoneId = zoneResult[0].id;
  });

  afterEach(resetDB);

  it('should calculate basic team service pricing without addons', async () => {
    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId,
      is_solo: false
    };

    const result = await calculatePricing(input);

    expect(result.base_price).toEqual(15000);
    expect(result.addons_price).toEqual(0);
    expect(result.distance_fee).toEqual(0);
    expect(result.discount).toEqual(0);
    expect(result.total_price).toEqual(15000);
    expect(result.estimated_duration).toEqual(45);
  });

  it('should calculate solo service pricing', async () => {
    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId,
      is_solo: true
    };

    const result = await calculatePricing(input);

    expect(result.base_price).toEqual(12000);
    expect(result.total_price).toEqual(12000);
  });

  it('should include addon pricing and duration', async () => {
    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId,
      addons: [addonId]
    };

    const result = await calculatePricing(input);

    expect(result.base_price).toEqual(15000);
    expect(result.addons_price).toEqual(3000);
    expect(result.total_price).toEqual(18000);
    expect(result.estimated_duration).toEqual(65); // 45 + 20 minutes
  });

  it('should apply percentage discount from valid coupon', async () => {
    // Create coupon
    await db.insert(couponsTable)
      .values(testCoupon)
      .execute();

    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId,
      coupon_code: 'SAVE10'
    };

    const result = await calculatePricing(input);

    expect(result.base_price).toEqual(15000);
    expect(result.discount).toEqual(1500); // 10% of 15000
    expect(result.total_price).toEqual(13500);
  });

  it('should apply fixed discount coupon', async () => {
    const fixedCoupon = {
      ...testCoupon,
      code: 'FIXED500',
      discount_type: 'fixed' as const,
      value: '500.00'
    };

    await db.insert(couponsTable)
      .values(fixedCoupon)
      .execute();

    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId,
      coupon_code: 'FIXED500'
    };

    const result = await calculatePricing(input);

    expect(result.base_price).toEqual(15000);
    expect(result.discount).toEqual(500);
    expect(result.total_price).toEqual(14500);
  });

  it('should not apply expired coupon', async () => {
    const expiredCoupon = {
      ...testCoupon,
      code: 'EXPIRED',
      end_at: new Date(Date.now() - 86400000) // Yesterday
    };

    await db.insert(couponsTable)
      .values(expiredCoupon)
      .execute();

    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId,
      coupon_code: 'EXPIRED'
    };

    const result = await calculatePricing(input);

    expect(result.discount).toEqual(0);
    expect(result.total_price).toEqual(15000);
  });

  it('should apply distance fee when pricing rule exists', async () => {
    // Create distance fee pricing rule
    await db.insert(pricingRulesTable)
      .values({
        key: 'distance_fee',
        value_json: '{"base_fee": "2000"}',
        enabled: true
      })
      .execute();

    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId
    };

    const result = await calculatePricing(input);

    expect(result.base_price).toEqual(15000);
    expect(result.distance_fee).toEqual(2000);
    expect(result.total_price).toEqual(17000);
  });

  it('should apply car type multiplier when pricing rule exists', async () => {
    // Create car type multiplier rule
    await db.insert(pricingRulesTable)
      .values({
        key: 'car_type_multiplier',
        value_json: '{"suv": "1.2", "pickup": "1.5"}',
        enabled: true
      })
      .execute();

    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId,
      car_type: 'suv' as const
    };

    const result = await calculatePricing(input);

    expect(result.base_price).toEqual(18000); // 15000 * 1.2
    expect(result.total_price).toEqual(18000);
  });

  it('should handle complex pricing with all components', async () => {
    // Create pricing rules
    await db.insert(pricingRulesTable)
      .values([
        {
          key: 'distance_fee',
          value_json: '{"base_fee": "1000"}',
          enabled: true
        },
        {
          key: 'car_type_multiplier',
          value_json: '{"pickup": "1.3"}',
          enabled: true
        }
      ])
      .execute();

    // Create coupon
    await db.insert(couponsTable)
      .values(testCoupon)
      .execute();

    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId,
      addons: [addonId],
      car_type: 'pickup' as const,
      coupon_code: 'SAVE10'
    };

    const result = await calculatePricing(input);

    // Expected calculation:
    // Base: 15000 * 1.3 = 19500 (pickup multiplier)
    // Addons: 3000
    // Distance fee: 1000
    // Subtotal: 23500
    // Discount: 2350 (10% of subtotal)
    // Total: 21150

    expect(result.base_price).toEqual(19500);
    expect(result.addons_price).toEqual(3000);
    expect(result.distance_fee).toEqual(1000);
    expect(result.discount).toEqual(2350);
    expect(result.total_price).toEqual(21150);
    expect(result.estimated_duration).toEqual(65);
  });

  it('should ensure discount does not exceed subtotal', async () => {
    // Create high-value fixed discount
    const bigCoupon = {
      ...testCoupon,
      code: 'BIGDISCOUNT',
      discount_type: 'fixed' as const,
      value: '20000.00' // More than service price
    };

    await db.insert(couponsTable)
      .values(bigCoupon)
      .execute();

    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId,
      coupon_code: 'BIGDISCOUNT'
    };

    const result = await calculatePricing(input);

    expect(result.discount).toEqual(15000); // Capped at subtotal
    expect(result.total_price).toEqual(0);
  });

  it('should throw error for non-existent service', async () => {
    const input = {
      ...testPricingInput,
      service_id: 99999,
      zone_id: zoneId
    };

    expect(calculatePricing(input)).rejects.toThrow(/Service with ID 99999 not found/);
  });

  it('should throw error for non-existent zone', async () => {
    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: 99999
    };

    expect(calculatePricing(input)).rejects.toThrow(/Zone with ID 99999 not found/);
  });

  it('should handle multiple addons correctly', async () => {
    // Create second addon
    const secondAddon = {
      ...testAddon,
      slug: 'wax-coating',
      name_ar: 'طلاء الشمع',
      name_en: 'Wax Coating',
      price: '5000.00',
      est_minutes: 30
    };

    const secondAddonResult = await db.insert(addonsTable)
      .values(secondAddon)
      .returning()
      .execute();

    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId,
      addons: [addonId, secondAddonResult[0].id]
    };

    const result = await calculatePricing(input);

    expect(result.base_price).toEqual(15000);
    expect(result.addons_price).toEqual(8000); // 3000 + 5000
    expect(result.total_price).toEqual(23000);
    expect(result.estimated_duration).toEqual(95); // 45 + 20 + 30 minutes
  });

  it('should ignore disabled pricing rules', async () => {
    // Create disabled distance fee rule
    await db.insert(pricingRulesTable)
      .values({
        key: 'distance_fee',
        value_json: '{"base_fee": "2000"}',
        enabled: false // Disabled
      })
      .execute();

    const input = {
      ...testPricingInput,
      service_id: serviceId,
      zone_id: zoneId
    };

    const result = await calculatePricing(input);

    expect(result.distance_fee).toEqual(0);
    expect(result.total_price).toEqual(15000);
  });
});