import { type Addon } from '../schema';

/**
 * Retrieves all available add-on services.
 * This handler returns add-ons that can be selected during booking:
 * - Only visible/active add-ons
 * - Pricing and time estimates
 * - Proper ordering for display
 * - Localized content for Arabic/English
 */
export async function getAddons(filters?: {
    visible_only?: boolean;
    language?: 'ar' | 'en';
}): Promise<Addon[]> {
    // This is a placeholder implementation! Real code should be implemented here.
    // The actual implementation will:
    // - Query addons table with visibility filter
    // - Order by the 'order' field for proper display
    // - Include localized names and descriptions
    // - Convert price from database numeric to number type
    // - Cache results for booking wizard performance
    
    return []; // Placeholder empty array
}