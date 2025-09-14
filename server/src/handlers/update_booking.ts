import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Booking, bookingStatusSchema } from '../schema';
import { z } from 'zod';

// Input schema for updating bookings
export const updateBookingInputSchema = z.object({
  status: bookingStatusSchema.optional(),
  scheduled_window_start: z.string().datetime().optional(),
  scheduled_window_end: z.string().datetime().optional(),
  address_text: z.string().min(1).optional(),
  geo_point: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

export type UpdateBookingInput = z.infer<typeof updateBookingInputSchema>;

// TRPC-compatible input type (allowing string status for backward compatibility)
export type UpdateBookingTRPCInput = {
  status?: string;
  scheduled_window_start?: string;
  scheduled_window_end?: string;
  address_text?: string;
  geo_point?: { lat: number; lng: number };
};

/**
 * Updates an existing booking record.
 * This handler manages booking modifications including:
 * - Status changes (confirmed → on_the_way → started → finished)
 * - Rescheduling with new time windows
 * - Cancellation with proper notifications
 * - Adding notes or special instructions
 * - Updating address or contact details
 */
// Overloaded function for different input types
export async function updateBooking(bookingId: number, input: UpdateBookingTRPCInput): Promise<Booking>;
export async function updateBooking(bookingId: number, input: UpdateBookingInput): Promise<Booking>;
export async function updateBooking(
  bookingId: number,
  input: UpdateBookingInput | UpdateBookingTRPCInput
): Promise<Booking> {
  try {
    // First, check if booking exists
    const existingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    if (existingBookings.length === 0) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }

    // Prepare update values
    const updateValues: any = {};

    if (input.status !== undefined) {
      // Validate status if it's a string from TRPC
      if (typeof input.status === 'string') {
        const parsedStatus = bookingStatusSchema.safeParse(input.status);
        if (!parsedStatus.success) {
          throw new Error(`Invalid status: ${input.status}`);
        }
        updateValues.status = parsedStatus.data;
      } else {
        updateValues.status = input.status;
      }
    }

    if (input.scheduled_window_start !== undefined) {
      updateValues.scheduled_window_start = new Date(input.scheduled_window_start);
    }

    if (input.scheduled_window_end !== undefined) {
      updateValues.scheduled_window_end = new Date(input.scheduled_window_end);
    }

    if (input.address_text !== undefined) {
      updateValues.address_text = input.address_text;
    }

    if (input.geo_point !== undefined) {
      updateValues.geo_point = JSON.stringify({
        type: 'Point',
        coordinates: [input.geo_point.lng, input.geo_point.lat]
      });
    }

    // Update the booking
    const result = await db.update(bookingsTable)
      .set(updateValues)
      .where(eq(bookingsTable.id, bookingId))
      .returning()
      .execute();

    const updatedBooking = result[0];

    // Convert numeric fields back to numbers
    return {
      ...updatedBooking,
      price_total: parseFloat(updatedBooking.price_total),
      distance_fee: updatedBooking.distance_fee ? parseFloat(updatedBooking.distance_fee) : null
    };
  } catch (error) {
    console.error('Booking update failed:', error);
    throw error;
  }
};