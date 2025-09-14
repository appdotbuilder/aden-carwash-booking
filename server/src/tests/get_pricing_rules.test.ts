import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pricingRulesTable } from '../db/schema';
import { type CreatePricingRuleInput } from '../schema';
import { getPricingRules } from '../handlers/get_pricing_rules';

// Test data
const testRules: CreatePricingRuleInput[] = [
    {
        key: 'distance_fee',
        value_json: JSON.stringify({
            base_fee: 5.0,
            per_km: 2.5,
            min_distance: 1.0
        }),
        enabled: true
    },
    {
        key: 'surge_pricing',
        value_json: JSON.stringify({
            multiplier: 1.5,
            peak_hours: ['18:00-20:00', '12:00-14:00']
        }),
        enabled: true
    },
    {
        key: 'zone_adjustment',
        value_json: JSON.stringify({
            zone_1: 1.2,
            zone_2: 0.9,
            zone_3: 1.0
        }),
        enabled: false
    },
    {
        key: 'discount_rules',
        value_json: JSON.stringify({
            first_customer: 0.2,
            bulk_booking: 0.15
        }),
        enabled: true
    }
];

describe('getPricingRules', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should get all pricing rules when no filters applied', async () => {
        // Insert test data
        await db.insert(pricingRulesTable)
            .values(testRules)
            .execute();

        const result = await getPricingRules();

        expect(result).toHaveLength(4);
        expect(result[0].key).toEqual('discount_rules'); // Ordered by key
        expect(result[1].key).toEqual('distance_fee');
        expect(result[2].key).toEqual('surge_pricing');
        expect(result[3].key).toEqual('zone_adjustment');

        // Verify all fields are present
        const firstRule = result[0];
        expect(firstRule.id).toBeDefined();
        expect(firstRule.key).toEqual('discount_rules');
        expect(firstRule.value_json).toEqual(testRules[3].value_json);
        expect(firstRule.enabled).toBe(true);
        expect(firstRule.created_at).toBeInstanceOf(Date);
    });

    it('should filter by enabled status only', async () => {
        // Insert test data
        await db.insert(pricingRulesTable)
            .values(testRules)
            .execute();

        const result = await getPricingRules({ enabled_only: true });

        expect(result).toHaveLength(3);
        // Should exclude the disabled 'zone_adjustment' rule
        const keys = result.map(rule => rule.key);
        expect(keys).toEqual(['discount_rules', 'distance_fee', 'surge_pricing']);
        
        // Verify all returned rules are enabled
        result.forEach(rule => {
            expect(rule.enabled).toBe(true);
        });
    });

    it('should filter by specific keys', async () => {
        // Insert test data
        await db.insert(pricingRulesTable)
            .values(testRules)
            .execute();

        const result = await getPricingRules({ 
            keys: ['distance_fee', 'surge_pricing'] 
        });

        expect(result).toHaveLength(2);
        const keys = result.map(rule => rule.key);
        expect(keys).toEqual(['distance_fee', 'surge_pricing']);
    });

    it('should combine enabled and keys filters', async () => {
        // Insert test data
        await db.insert(pricingRulesTable)
            .values(testRules)
            .execute();

        const result = await getPricingRules({ 
            enabled_only: true,
            keys: ['zone_adjustment', 'distance_fee', 'surge_pricing']
        });

        expect(result).toHaveLength(2);
        const keys = result.map(rule => rule.key);
        expect(keys).toEqual(['distance_fee', 'surge_pricing']);
        
        // Verify all returned rules are enabled
        result.forEach(rule => {
            expect(rule.enabled).toBe(true);
        });
    });

    it('should return empty array when no keys match', async () => {
        // Insert test data
        await db.insert(pricingRulesTable)
            .values(testRules)
            .execute();

        const result = await getPricingRules({ 
            keys: ['non_existent_key'] 
        });

        expect(result).toHaveLength(0);
    });

    it('should return empty array when no rules exist', async () => {
        const result = await getPricingRules();
        expect(result).toHaveLength(0);
    });

    it('should handle empty keys array', async () => {
        // Insert test data
        await db.insert(pricingRulesTable)
            .values(testRules)
            .execute();

        const result = await getPricingRules({ keys: [] });

        // Should return all rules since empty array is ignored
        expect(result).toHaveLength(4);
    });

    it('should preserve JSON structure in value_json field', async () => {
        // Insert test data
        await db.insert(pricingRulesTable)
            .values([testRules[0]]) // distance_fee rule
            .execute();

        const result = await getPricingRules({ 
            keys: ['distance_fee'] 
        });

        expect(result).toHaveLength(1);
        const rule = result[0];
        
        // Verify JSON structure is preserved
        const jsonValue = JSON.parse(rule.value_json);
        expect(jsonValue.base_fee).toEqual(5.0);
        expect(jsonValue.per_km).toEqual(2.5);
        expect(jsonValue.min_distance).toEqual(1.0);
    });

    it('should handle both enabled true and false filters', async () => {
        // Insert test data
        await db.insert(pricingRulesTable)
            .values(testRules)
            .execute();

        // Test enabled_only: false (should return all rules)
        const allRules = await getPricingRules({ enabled_only: false });
        expect(allRules).toHaveLength(4);

        // Test enabled_only: true (should return only enabled rules)
        const enabledRules = await getPricingRules({ enabled_only: true });
        expect(enabledRules).toHaveLength(3);
    });

    it('should maintain consistent ordering by key', async () => {
        // Insert test data in different order
        const shuffledRules = [testRules[2], testRules[0], testRules[3], testRules[1]];
        await db.insert(pricingRulesTable)
            .values(shuffledRules)
            .execute();

        const result = await getPricingRules();

        expect(result).toHaveLength(4);
        // Should still be ordered by key alphabetically
        const keys = result.map(rule => rule.key);
        expect(keys).toEqual(['discount_rules', 'distance_fee', 'surge_pricing', 'zone_adjustment']);
    });
});