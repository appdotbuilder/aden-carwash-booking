import { db } from '../db';
import { servicesTable, addonsTable, pricingRulesTable, couponsTable, zonesTable } from '../db/schema';
import { eq, inArray, and, lte, gte, isNull, or } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

interface PricingInput {
  service_id: number;
  addons: number[];
  car_type: 'sedan' | 'suv' | 'pickup';
  is_solo: boolean;
  zone_id: number;
  geo_point: { lat: number; lng: number };
  coupon_code?: string;
}

interface PricingResult {
  base_price: number;
  addons_price: number;
  distance_fee: number;
  discount: number;
  total_price: number;
  estimated_duration: number;
}

/**
 * Calculates total booking price including all fees.
 * This handler implements the pricing logic:
 * - Base service price (team vs solo)
 * - Add-on services pricing
 * - Distance fee calculation based on zone rules
 * - Any applicable discounts or surge pricing
 * - Tax calculations if required
 */
export const calculatePricing = async (input: PricingInput): Promise<PricingResult> => {
  try {
    // 1. Fetch service details
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, input.service_id))
      .execute();

    if (!services.length) {
      throw new Error(`Service with ID ${input.service_id} not found`);
    }

    const service = services[0];
    
    // Calculate base price based on team/solo preference
    const basePrice = input.is_solo 
      ? parseFloat(service.base_price_solo)
      : parseFloat(service.base_price_team);
    
    let estimatedDuration = service.est_minutes;

    // 2. Calculate add-ons price
    let addonsPrice = 0;
    if (input.addons.length > 0) {
      const addons = await db.select()
        .from(addonsTable)
        .where(inArray(addonsTable.id, input.addons))
        .execute();

      addonsPrice = addons.reduce((sum, addon) => {
        estimatedDuration += addon.est_minutes;
        return sum + parseFloat(addon.price);
      }, 0);
    }

    // 3. Calculate distance fee based on zone rules
    let distanceFee = 0;
    
    // Fetch zone details
    const zones = await db.select()
      .from(zonesTable)
      .where(eq(zonesTable.id, input.zone_id))
      .execute();

    if (!zones.length) {
      throw new Error(`Zone with ID ${input.zone_id} not found`);
    }

    // Fetch distance fee pricing rules
    const distanceRules = await db.select()
      .from(pricingRulesTable)
      .where(and(
        eq(pricingRulesTable.key, 'distance_fee'),
        eq(pricingRulesTable.enabled, true)
      ))
      .execute();

    if (distanceRules.length > 0) {
      try {
        const ruleData = JSON.parse(distanceRules[0].value_json);
        // Simple distance fee calculation - in real scenario would use geo calculations
        // For now, apply a base distance fee if outside primary zone
        if (ruleData.base_fee) {
          distanceFee = parseFloat(ruleData.base_fee);
        }
      } catch (error) {
        console.error('Error parsing distance fee rules:', error);
      }
    }

    // 4. Apply car type multiplier if exists
    let carTypeMultiplier = 1;
    const carTypeRules = await db.select()
      .from(pricingRulesTable)
      .where(and(
        eq(pricingRulesTable.key, 'car_type_multiplier'),
        eq(pricingRulesTable.enabled, true)
      ))
      .execute();

    if (carTypeRules.length > 0) {
      try {
        const multipliers = JSON.parse(carTypeRules[0].value_json);
        if (multipliers[input.car_type]) {
          carTypeMultiplier = parseFloat(multipliers[input.car_type]);
        }
      } catch (error) {
        console.error('Error parsing car type multipliers:', error);
      }
    }

    // Apply car type multiplier to base service price only
    const adjustedBasePrice = basePrice * carTypeMultiplier;

    // 5. Calculate discount from coupon (after all other fees are calculated)
    let discount = 0;
    if (input.coupon_code) {
      const now = new Date();
      
      const coupons = await db.select()
        .from(couponsTable)
        .where(and(
          eq(couponsTable.code, input.coupon_code),
          or(
            isNull(couponsTable.start_at),
            lte(couponsTable.start_at, now)
          ),
          or(
            isNull(couponsTable.end_at),
            gte(couponsTable.end_at, now)
          )
        ))
        .execute();

      if (coupons.length > 0) {
        const coupon = coupons[0];
        const subtotal = adjustedBasePrice + addonsPrice + distanceFee;
        
        if (coupon.discount_type === 'fixed') {
          discount = parseFloat(coupon.value);
        } else if (coupon.discount_type === 'percentage') {
          discount = subtotal * (parseFloat(coupon.value) / 100);
        }
        
        // Ensure discount doesn't exceed subtotal
        discount = Math.min(discount, subtotal);
      }
    }

    // 6. Calculate final total
    const totalPrice = Math.max(0, adjustedBasePrice + addonsPrice + distanceFee - discount);

    return {
      base_price: adjustedBasePrice,
      addons_price: addonsPrice,
      distance_fee: distanceFee,
      discount: discount,
      total_price: totalPrice,
      estimated_duration: estimatedDuration
    };

  } catch (error) {
    console.error('Pricing calculation failed:', error);
    throw error;
  }
};