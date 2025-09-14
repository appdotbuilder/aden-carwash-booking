import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { createService } from '../handlers/create_service';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateServiceInput = {
  slug: 'deep-cleaning',
  name_ar: 'تنظيف عميق',
  name_en: 'Deep Cleaning',
  desc_ar: 'خدمة تنظيف شاملة لجميع أجزاء السيارة',
  desc_en: 'Comprehensive cleaning service for all car parts',
  base_price_team: 89.50,
  base_price_solo: 65.00,
  est_minutes: 120,
  order: 10,
  visible: true
};

// Minimal test input (with Zod defaults applied)
const minimalInput: CreateServiceInput = {
  slug: 'basic-wash',
  name_ar: 'غسيل أساسي',
  name_en: 'Basic Wash',
  base_price_team: 45.00,
  base_price_solo: 35.00,
  est_minutes: 60,
  order: 0, // Zod default
  visible: true // Zod default
};

describe('createService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service with all fields', async () => {
    const result = await createService(testInput);

    // Validate all fields
    expect(result.slug).toEqual('deep-cleaning');
    expect(result.name_ar).toEqual('تنظيف عميق');
    expect(result.name_en).toEqual('Deep Cleaning');
    expect(result.desc_ar).toEqual('خدمة تنظيف شاملة لجميع أجزاء السيارة');
    expect(result.desc_en).toEqual('Comprehensive cleaning service for all car parts');
    expect(result.base_price_team).toEqual(89.50);
    expect(result.base_price_solo).toEqual(65.00);
    expect(result.est_minutes).toEqual(120);
    expect(result.order).toEqual(10);
    expect(result.visible).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.base_price_team).toEqual('number');
    expect(typeof result.base_price_solo).toEqual('number');
  });

  it('should create a service with minimal fields and defaults', async () => {
    const result = await createService(minimalInput);

    // Validate required fields
    expect(result.slug).toEqual('basic-wash');
    expect(result.name_ar).toEqual('غسيل أساسي');
    expect(result.name_en).toEqual('Basic Wash');
    expect(result.desc_ar).toBeNull();
    expect(result.desc_en).toBeNull();
    expect(result.base_price_team).toEqual(45.00);
    expect(result.base_price_solo).toEqual(35.00);
    expect(result.est_minutes).toEqual(60);
    expect(result.order).toEqual(0);
    expect(result.visible).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save service to database correctly', async () => {
    const result = await createService(testInput);

    // Query using proper drizzle syntax
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(services).toHaveLength(1);
    const savedService = services[0];
    
    expect(savedService.slug).toEqual('deep-cleaning');
    expect(savedService.name_ar).toEqual('تنظيف عميق');
    expect(savedService.name_en).toEqual('Deep Cleaning');
    expect(savedService.desc_ar).toEqual('خدمة تنظيف شاملة لجميع أجزاء السيارة');
    expect(savedService.desc_en).toEqual('Comprehensive cleaning service for all car parts');
    expect(parseFloat(savedService.base_price_team)).toEqual(89.50);
    expect(parseFloat(savedService.base_price_solo)).toEqual(65.00);
    expect(savedService.est_minutes).toEqual(120);
    expect(savedService.order).toEqual(10);
    expect(savedService.visible).toEqual(true);
    expect(savedService.created_at).toBeInstanceOf(Date);
  });

  it('should handle null description fields', async () => {
    const inputWithoutDescriptions: CreateServiceInput = {
      slug: 'no-desc-service',
      name_ar: 'خدمة بدون وصف',
      name_en: 'No Description Service',
      base_price_team: 50.00,
      base_price_solo: 40.00,
      est_minutes: 90,
      order: 5,
      visible: false
    };

    const result = await createService(inputWithoutDescriptions);

    expect(result.desc_ar).toBeNull();
    expect(result.desc_en).toBeNull();
    expect(result.visible).toEqual(false);
    
    // Verify in database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(services[0].desc_ar).toBeNull();
    expect(services[0].desc_en).toBeNull();
    expect(services[0].visible).toEqual(false);
  });

  it('should enforce slug uniqueness', async () => {
    // Create first service
    await createService(testInput);

    // Attempt to create another service with same slug
    const duplicateInput: CreateServiceInput = {
      ...testInput,
      name_ar: 'خدمة مكررة',
      name_en: 'Duplicate Service'
    };

    await expect(createService(duplicateInput))
      .rejects
      .toThrow(/unique constraint|duplicate/i);
  });

  it('should handle decimal prices correctly', async () => {
    const decimalInput: CreateServiceInput = {
      slug: 'precision-service',
      name_ar: 'خدمة دقيقة',
      name_en: 'Precision Service',
      base_price_team: 99.99,
      base_price_solo: 75.50,
      est_minutes: 150,
      order: 1,
      visible: true
    };

    const result = await createService(decimalInput);

    // Verify precise decimal handling
    expect(result.base_price_team).toEqual(99.99);
    expect(result.base_price_solo).toEqual(75.50);

    // Verify in database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(parseFloat(services[0].base_price_team)).toEqual(99.99);
    expect(parseFloat(services[0].base_price_solo)).toEqual(75.50);
  });

  it('should create multiple services with different orders', async () => {
    const service1Input: CreateServiceInput = {
      slug: 'service-1',
      name_ar: 'خدمة 1',
      name_en: 'Service 1',
      base_price_team: 50.00,
      base_price_solo: 40.00,
      est_minutes: 60,
      order: 1,
      visible: true
    };

    const service2Input: CreateServiceInput = {
      slug: 'service-2',
      name_ar: 'خدمة 2',
      name_en: 'Service 2',
      base_price_team: 75.00,
      base_price_solo: 60.00,
      est_minutes: 90,
      order: 2,
      visible: true
    };

    const result1 = await createService(service1Input);
    const result2 = await createService(service2Input);

    expect(result1.order).toEqual(1);
    expect(result2.order).toEqual(2);
    expect(result1.id).not.toEqual(result2.id);

    // Verify both services exist in database
    const services = await db.select()
      .from(servicesTable)
      .execute();

    expect(services).toHaveLength(2);
    const orders = services.map(s => s.order).sort();
    expect(orders).toEqual([1, 2]);
  });
});