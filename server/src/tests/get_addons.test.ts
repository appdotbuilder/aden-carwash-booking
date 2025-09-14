import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { addonsTable } from '../db/schema';
import { type CreateAddonInput } from '../schema';
import { getAddons } from '../handlers/get_addons';
import { eq } from 'drizzle-orm';

// Test data - comprehensive addon examples
const testAddons: CreateAddonInput[] = [
  {
    slug: 'interior-protection',
    name_ar: 'حماية المقصورة الداخلية',
    name_en: 'Interior Protection',
    desc_ar: 'حماية شاملة للمقصورة الداخلية',
    desc_en: 'Complete interior protection service',
    price: 15.50,
    est_minutes: 30,
    order: 1,
    visible: true
  },
  {
    slug: 'engine-cleaning',
    name_ar: 'تنظيف المحرك',
    name_en: 'Engine Cleaning',
    desc_ar: 'تنظيف المحرك بالتفصيل',
    desc_en: 'Detailed engine cleaning service',
    price: 25.00,
    est_minutes: 45,
    order: 2,
    visible: true
  },
  {
    slug: 'tire-shine',
    name_ar: 'لمعان الإطارات',
    name_en: 'Tire Shine',
    desc_ar: null,
    desc_en: null,
    price: 8.75,
    est_minutes: 15,
    order: 3,
    visible: false // Hidden addon for testing
  }
];

describe('getAddons', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve all visible addons by default', async () => {
    // Create test addons
    for (const addon of testAddons) {
      await db.insert(addonsTable)
        .values({
          ...addon,
          price: addon.price.toString()
        })
        .execute();
    }

    const result = await getAddons();

    // Should only return visible addons (2 out of 3)
    expect(result).toHaveLength(2);
    
    // Verify ordering - should be ordered by 'order' field
    expect(result[0].slug).toBe('interior-protection');
    expect(result[0].order).toBe(1);
    expect(result[1].slug).toBe('engine-cleaning');
    expect(result[1].order).toBe(2);

    // Verify all addons are visible
    result.forEach(addon => {
      expect(addon.visible).toBe(true);
    });
  });

  it('should convert numeric price fields correctly', async () => {
    await db.insert(addonsTable)
      .values({
        ...testAddons[0],
        price: testAddons[0].price.toString()
      })
      .execute();

    const result = await getAddons();

    expect(result).toHaveLength(1);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toBe(15.50);
  });

  it('should return all addons when visible_only is false', async () => {
    // Create all test addons including hidden one
    for (const addon of testAddons) {
      await db.insert(addonsTable)
        .values({
          ...addon,
          price: addon.price.toString()
        })
        .execute();
    }

    const result = await getAddons({ visible_only: false });

    // Should return all addons including hidden ones
    expect(result).toHaveLength(3);
    
    // Verify hidden addon is included
    const hiddenAddon = result.find(addon => addon.slug === 'tire-shine');
    expect(hiddenAddon).toBeDefined();
    expect(hiddenAddon?.visible).toBe(false);
  });

  it('should maintain proper ordering regardless of insertion order', async () => {
    // Insert addons in reverse order
    const reversedAddons = [...testAddons].reverse();
    
    for (const addon of reversedAddons) {
      await db.insert(addonsTable)
        .values({
          ...addon,
          price: addon.price.toString()
        })
        .execute();
    }

    const result = await getAddons({ visible_only: false });

    // Should still be ordered by 'order' field, not insertion order
    expect(result).toHaveLength(3);
    expect(result[0].order).toBe(1);
    expect(result[1].order).toBe(2);
    expect(result[2].order).toBe(3);
  });

  it('should handle empty addon table', async () => {
    const result = await getAddons();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should include all required addon fields', async () => {
    await db.insert(addonsTable)
      .values({
        ...testAddons[0],
        price: testAddons[0].price.toString()
      })
      .execute();

    const result = await getAddons();

    expect(result).toHaveLength(1);
    const addon = result[0];

    // Verify all required fields are present
    expect(addon.id).toBeDefined();
    expect(addon.slug).toBe('interior-protection');
    expect(addon.name_ar).toBe('حماية المقصورة الداخلية');
    expect(addon.name_en).toBe('Interior Protection');
    expect(addon.desc_ar).toBe('حماية شاملة للمقصورة الداخلية');
    expect(addon.desc_en).toBe('Complete interior protection service');
    expect(addon.price).toBe(15.50);
    expect(addon.est_minutes).toBe(30);
    expect(addon.order).toBe(1);
    expect(addon.visible).toBe(true);
    expect(addon.created_at).toBeInstanceOf(Date);
  });

  it('should handle addons with null description fields', async () => {
    await db.insert(addonsTable)
      .values({
        ...testAddons[2], // This one has null descriptions
        price: testAddons[2].price.toString()
      })
      .execute();

    const result = await getAddons({ visible_only: false });

    expect(result).toHaveLength(1);
    const addon = result[0];
    
    expect(addon.desc_ar).toBeNull();
    expect(addon.desc_en).toBeNull();
    expect(addon.name_ar).toBe('لمعان الإطارات');
    expect(addon.name_en).toBe('Tire Shine');
  });

  it('should save addons correctly in database', async () => {
    const testAddon = testAddons[0];
    
    // Insert addon
    await db.insert(addonsTable)
      .values({
        ...testAddon,
        price: testAddon.price.toString()
      })
      .execute();

    // Verify it was saved correctly
    const savedAddons = await db.select()
      .from(addonsTable)
      .where(eq(addonsTable.slug, testAddon.slug))
      .execute();

    expect(savedAddons).toHaveLength(1);
    expect(savedAddons[0].slug).toBe(testAddon.slug);
    expect(savedAddons[0].name_ar).toBe(testAddon.name_ar);
    expect(parseFloat(savedAddons[0].price)).toBe(testAddon.price);
    expect(savedAddons[0].created_at).toBeInstanceOf(Date);
  });
});