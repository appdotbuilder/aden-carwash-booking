import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type CreateTestimonialInput } from '../schema';
import { getTestimonials } from '../handlers/get_testimonials';

// Test testimonial inputs
const testimonial1: CreateTestimonialInput = {
    name: 'أحمد محمد',
    district: 'صنعاء القديمة',
    stars: 5,
    text_ar: 'خدمة ممتازة جداً، فريق محترف',
    text_en: 'Excellent service, professional team',
    order: 1,
    visible: true
};

const testimonial2: CreateTestimonialInput = {
    name: 'Sara Ali',
    district: 'Hadda',
    stars: 4,
    text_ar: 'خدمة جيدة ونظافة عالية',
    text_en: 'Good service and high quality cleaning',
    order: 2,
    visible: true
};

const testimonial3: CreateTestimonialInput = {
    name: 'Mohammed Hassan',
    district: 'Taiz Center',
    stars: 3,
    text_ar: 'خدمة عادية، يحتاج تحسين',
    text_en: 'Average service, needs improvement',
    order: 3,
    visible: false // Hidden testimonial
};

const testimonial4: CreateTestimonialInput = {
    name: 'Fatima Ahmed',
    district: 'صنعاء القديمة',
    stars: 5,
    text_ar: 'الأفضل في المدينة',
    text_en: 'The best in the city',
    order: 0, // Should appear first due to lower order value
    visible: true
};

describe('getTestimonials', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should retrieve all visible testimonials by default', async () => {
        // Create test testimonials
        await db.insert(testimonialsTable).values([
            testimonial1,
            testimonial2,
            testimonial3, // This one is not visible
            testimonial4
        ]).execute();

        const result = await getTestimonials();

        // Should return only visible testimonials (3 out of 4)
        expect(result).toHaveLength(3);
        expect(result.every(t => t.visible === true)).toBe(true);
        
        // Verify specific testimonials are included
        const names = result.map(t => t.name);
        expect(names).toContain('أحمد محمد');
        expect(names).toContain('Sara Ali');
        expect(names).toContain('Fatima Ahmed');
        expect(names).not.toContain('Mohammed Hassan'); // Hidden
    });

    it('should order testimonials correctly (stars desc, order asc, created_at desc)', async () => {
        await db.insert(testimonialsTable).values([
            testimonial1, // 5 stars, order 1
            testimonial2, // 4 stars, order 2  
            testimonial4  // 5 stars, order 0 (should be first among 5-star)
        ]).execute();

        const result = await getTestimonials();

        expect(result).toHaveLength(3);
        
        // First should be 5-star with lowest order (0)
        expect(result[0].name).toBe('Fatima Ahmed');
        expect(result[0].stars).toBe(5);
        expect(result[0].order).toBe(0);
        
        // Second should be 5-star with higher order (1)
        expect(result[1].name).toBe('أحمد محمد');
        expect(result[1].stars).toBe(5);
        expect(result[1].order).toBe(1);
        
        // Third should be 4-star
        expect(result[2].name).toBe('Sara Ali');
        expect(result[2].stars).toBe(4);
    });

    it('should filter by minimum star rating', async () => {
        await db.insert(testimonialsTable).values([
            testimonial1, // 5 stars
            testimonial2, // 4 stars
            { ...testimonial3, visible: true } // 3 stars, make visible for this test
        ]).execute();

        const result = await getTestimonials({ min_stars: 4 });

        expect(result).toHaveLength(2);
        expect(result.every(t => t.stars >= 4)).toBe(true);
        
        const names = result.map(t => t.name);
        expect(names).toContain('أحمد محمد');
        expect(names).toContain('Sara Ali');
        expect(names).not.toContain('Mohammed Hassan');
    });

    it('should filter by district', async () => {
        await db.insert(testimonialsTable).values([
            testimonial1, // صنعاء القديمة
            testimonial2, // Hadda
            testimonial4  // صنعاء القديمة
        ]).execute();

        const result = await getTestimonials({ district: 'صنعاء القديمة' });

        expect(result).toHaveLength(2);
        expect(result.every(t => t.district === 'صنعاء القديمة')).toBe(true);
        
        const names = result.map(t => t.name);
        expect(names).toContain('أحمد محمد');
        expect(names).toContain('Fatima Ahmed');
        expect(names).not.toContain('Sara Ali');
    });

    it('should include hidden testimonials when visible_only is false', async () => {
        await db.insert(testimonialsTable).values([
            testimonial1, // visible: true
            testimonial2, // visible: true
            testimonial3  // visible: false
        ]).execute();

        const result = await getTestimonials({ visible_only: false });

        expect(result).toHaveLength(3);
        
        const visibleCount = result.filter(t => t.visible === true).length;
        const hiddenCount = result.filter(t => t.visible === false).length;
        
        expect(visibleCount).toBe(2);
        expect(hiddenCount).toBe(1);
        
        const names = result.map(t => t.name);
        expect(names).toContain('Mohammed Hassan'); // Previously hidden
    });

    it('should combine multiple filters correctly', async () => {
        await db.insert(testimonialsTable).values([
            testimonial1, // 5 stars, صنعاء القديمة, visible
            testimonial2, // 4 stars, Hadda, visible
            testimonial4, // 5 stars, صنعاء القديمة, visible
            { ...testimonial3, stars: 5, district: 'صنعاء القديمة', visible: true } // 5 stars, صنعاء القديمة, visible
        ]).execute();

        const result = await getTestimonials({
            min_stars: 5,
            district: 'صنعاء القديمة',
            visible_only: true
        });

        expect(result).toHaveLength(3);
        expect(result.every(t => t.stars >= 5)).toBe(true);
        expect(result.every(t => t.district === 'صنعاء القديمة')).toBe(true);
        expect(result.every(t => t.visible === true)).toBe(true);
    });

    it('should return all testimonial fields correctly', async () => {
        await db.insert(testimonialsTable).values([testimonial1]).execute();

        const result = await getTestimonials();

        expect(result).toHaveLength(1);
        const testimonial = result[0];
        
        expect(testimonial.id).toBeDefined();
        expect(testimonial.name).toBe('أحمد محمد');
        expect(testimonial.district).toBe('صنعاء القديمة');
        expect(testimonial.stars).toBe(5);
        expect(typeof testimonial.stars).toBe('number');
        expect(testimonial.text_ar).toBe('خدمة ممتازة جداً، فريق محترف');
        expect(testimonial.text_en).toBe('Excellent service, professional team');
        expect(testimonial.order).toBe(1);
        expect(typeof testimonial.order).toBe('number');
        expect(testimonial.visible).toBe(true);
        expect(testimonial.created_at).toBeInstanceOf(Date);
    });

    it('should return empty array when no testimonials match filters', async () => {
        await db.insert(testimonialsTable).values([testimonial1]).execute();

        const result = await getTestimonials({
            district: 'NonExistent District',
            min_stars: 5
        });

        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty database gracefully', async () => {
        const result = await getTestimonials();

        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by exact star rating boundary', async () => {
        await db.insert(testimonialsTable).values([
            { ...testimonial1, stars: 3 }, // exactly 3 stars
            { ...testimonial2, stars: 4 }, // 4 stars
            { ...testimonial4, stars: 5 }  // 5 stars
        ]).execute();

        // Test min_stars: 3 should include all
        const result3 = await getTestimonials({ min_stars: 3 });
        expect(result3).toHaveLength(3);
        
        // Test min_stars: 4 should include only 4 and 5 star
        const result4 = await getTestimonials({ min_stars: 4 });
        expect(result4).toHaveLength(2);
        expect(result4.every(t => t.stars >= 4)).toBe(true);
        
        // Test min_stars: 5 should include only 5 star
        const result5 = await getTestimonials({ min_stars: 5 });
        expect(result5).toHaveLength(1);
        expect(result5[0].stars).toBe(5);
    });
});