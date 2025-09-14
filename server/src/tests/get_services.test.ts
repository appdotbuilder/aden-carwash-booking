import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { getServices } from '../handlers/get_services';

// Test service data
const testService1: CreateServiceInput = {
    slug: 'car-wash',
    name_ar: 'غسيل السيارة',
    name_en: 'Car Wash',
    desc_ar: 'غسيل شامل للسيارة',
    desc_en: 'Complete car washing service',
    base_price_team: 50.00,
    base_price_solo: 35.00,
    est_minutes: 60,
    order: 1,
    visible: true
};

const testService2: CreateServiceInput = {
    slug: 'car-detailing',
    name_ar: 'تنظيف مفصل',
    name_en: 'Car Detailing',
    desc_ar: null,
    desc_en: null,
    base_price_team: 120.99,
    base_price_solo: 89.50,
    est_minutes: 180,
    order: 2,
    visible: true
};

const testService3: CreateServiceInput = {
    slug: 'hidden-service',
    name_ar: 'خدمة مخفية',
    name_en: 'Hidden Service',
    desc_ar: 'خدمة غير مرئية',
    desc_en: 'Not visible service',
    base_price_team: 25.00,
    base_price_solo: 20.00,
    est_minutes: 30,
    order: 3,
    visible: false
};

describe('getServices', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should retrieve all services without filters', async () => {
        // Create test services
        await db.insert(servicesTable).values([
            {
                ...testService1,
                base_price_team: testService1.base_price_team.toString(),
                base_price_solo: testService1.base_price_solo.toString()
            },
            {
                ...testService2,
                base_price_team: testService2.base_price_team.toString(),
                base_price_solo: testService2.base_price_solo.toString()
            },
            {
                ...testService3,
                base_price_team: testService3.base_price_team.toString(),
                base_price_solo: testService3.base_price_solo.toString()
            }
        ]).execute();

        const services = await getServices();

        expect(services).toHaveLength(3);
        expect(services[0].name_en).toBe('Car Wash');
        expect(services[1].name_en).toBe('Car Detailing');
        expect(services[2].name_en).toBe('Hidden Service');
    });

    it('should filter visible services only', async () => {
        // Create test services
        await db.insert(servicesTable).values([
            {
                ...testService1,
                base_price_team: testService1.base_price_team.toString(),
                base_price_solo: testService1.base_price_solo.toString()
            },
            {
                ...testService2,
                base_price_team: testService2.base_price_team.toString(),
                base_price_solo: testService2.base_price_solo.toString()
            },
            {
                ...testService3,
                base_price_team: testService3.base_price_team.toString(),
                base_price_solo: testService3.base_price_solo.toString()
            }
        ]).execute();

        const services = await getServices({ visible_only: true });

        expect(services).toHaveLength(2);
        expect(services[0].name_en).toBe('Car Wash');
        expect(services[1].name_en).toBe('Car Detailing');
        expect(services.every(service => service.visible)).toBe(true);
    });

    it('should return services ordered by order field then by id', async () => {
        // Create services with different order values
        await db.insert(servicesTable).values([
            {
                ...testService2,
                base_price_team: testService2.base_price_team.toString(),
                base_price_solo: testService2.base_price_solo.toString(),
                order: 5
            },
            {
                ...testService1,
                base_price_team: testService1.base_price_team.toString(),
                base_price_solo: testService1.base_price_solo.toString(),
                order: 1
            },
            {
                ...testService3,
                base_price_team: testService3.base_price_team.toString(),
                base_price_solo: testService3.base_price_solo.toString(),
                order: 3
            }
        ]).execute();

        const services = await getServices();

        expect(services).toHaveLength(3);
        expect(services[0].order).toBe(1);
        expect(services[1].order).toBe(3);
        expect(services[2].order).toBe(5);
    });

    it('should convert numeric prices to numbers', async () => {
        await db.insert(servicesTable).values({
            ...testService1,
            base_price_team: testService1.base_price_team.toString(),
            base_price_solo: testService1.base_price_solo.toString()
        }).execute();

        const services = await getServices();

        expect(services).toHaveLength(1);
        expect(typeof services[0].base_price_team).toBe('number');
        expect(typeof services[0].base_price_solo).toBe('number');
        expect(services[0].base_price_team).toBe(50.00);
        expect(services[0].base_price_solo).toBe(35.00);
    });

    it('should return empty array when no services exist', async () => {
        const services = await getServices();
        expect(services).toHaveLength(0);
    });

    it('should handle decimal prices correctly', async () => {
        await db.insert(servicesTable).values({
            ...testService2,
            base_price_team: testService2.base_price_team.toString(),
            base_price_solo: testService2.base_price_solo.toString()
        }).execute();

        const services = await getServices();

        expect(services).toHaveLength(1);
        expect(services[0].base_price_team).toBe(120.99);
        expect(services[0].base_price_solo).toBe(89.50);
    });

    it('should include all service fields', async () => {
        await db.insert(servicesTable).values({
            ...testService1,
            base_price_team: testService1.base_price_team.toString(),
            base_price_solo: testService1.base_price_solo.toString()
        }).execute();

        const services = await getServices();

        expect(services).toHaveLength(1);
        const service = services[0];

        // Verify all required fields are present
        expect(service.id).toBeDefined();
        expect(service.slug).toBe('car-wash');
        expect(service.name_ar).toBe('غسيل السيارة');
        expect(service.name_en).toBe('Car Wash');
        expect(service.desc_ar).toBe('غسيل شامل للسيارة');
        expect(service.desc_en).toBe('Complete car washing service');
        expect(service.base_price_team).toBe(50.00);
        expect(service.base_price_solo).toBe(35.00);
        expect(service.est_minutes).toBe(60);
        expect(service.order).toBe(1);
        expect(service.visible).toBe(true);
        expect(service.created_at).toBeInstanceOf(Date);
    });

    it('should handle services with null descriptions', async () => {
        await db.insert(servicesTable).values({
            ...testService2,
            base_price_team: testService2.base_price_team.toString(),
            base_price_solo: testService2.base_price_solo.toString()
        }).execute();

        const services = await getServices();

        expect(services).toHaveLength(1);
        expect(services[0].desc_ar).toBeNull();
        expect(services[0].desc_en).toBeNull();
    });

    it('should not filter when visible_only is false', async () => {
        // Create both visible and hidden services
        await db.insert(servicesTable).values([
            {
                ...testService1,
                base_price_team: testService1.base_price_team.toString(),
                base_price_solo: testService1.base_price_solo.toString()
            },
            {
                ...testService3,
                base_price_team: testService3.base_price_team.toString(),
                base_price_solo: testService3.base_price_solo.toString()
            }
        ]).execute();

        const services = await getServices({ visible_only: false });

        expect(services).toHaveLength(2);
        expect(services.some(service => !service.visible)).toBe(true);
    });
});