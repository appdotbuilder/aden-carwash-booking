import { db } from '../db';
import { contentBlocksTable } from '../db/schema';
import { type ContentBlock } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Updates a content block with new values.
 * This handler manages CMS content updates:
 * - Updates Arabic and/or English content
 * - Manages draft/preview/published status
 * - Tracks who made changes and when
 * - Creates new content block if key doesn't exist
 */
export async function updateContentBlock(
    key: string,
    updates: {
        ar_value?: string | null;
        en_value?: string | null;
        status?: 'draft' | 'preview' | 'published';
    },
    updatedBy?: number
): Promise<ContentBlock> {
    try {
        // Check if content block exists
        const existingBlocks = await db.select()
            .from(contentBlocksTable)
            .where(eq(contentBlocksTable.key, key))
            .execute();

        if (existingBlocks.length === 0) {
            // Create new content block
            const result = await db.insert(contentBlocksTable)
                .values({
                    key: key,
                    ar_value: updates.ar_value || null,
                    en_value: updates.en_value || null,
                    status: updates.status || 'draft',
                    updated_by: updatedBy || null
                })
                .returning()
                .execute();

            return result[0];
        } else {
            // Update existing content block
            const result = await db.update(contentBlocksTable)
                .set({
                    ar_value: updates.ar_value !== undefined ? updates.ar_value : existingBlocks[0].ar_value,
                    en_value: updates.en_value !== undefined ? updates.en_value : existingBlocks[0].en_value,
                    status: updates.status || existingBlocks[0].status,
                    updated_by: updatedBy || existingBlocks[0].updated_by,
                    updated_at: new Date()
                })
                .where(eq(contentBlocksTable.key, key))
                .returning()
                .execute();

            return result[0];
        }
    } catch (error) {
        console.error('Content block update failed:', error);
        throw error;
    }
}