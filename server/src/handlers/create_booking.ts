import { db } from '../db';
import { customersTable, bookingsTable, servicesTable, addonsTable } from '../db/schema';
import { type CreateBookingInput, type BookingResponse } from '../schema';
import { eq, inArray, and } from 'drizzle-orm';

export const createBooking = async (input: CreateBookingInput): Promise<BookingResponse> => {
  try {
    // 1. Create or find customer by phone
    let customer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.phone, input.customer.phone))
      .execute()
      .then(results => results[0]);

    if (!customer) {
      const newCustomers = await db.insert(customersTable)
        .values({
          name: input.customer.name,
          phone: input.customer.phone,
          whatsapp_verified: false
        })
        .returning()
        .execute();
      customer = newCustomers[0];
    }

    // 2. Get service pricing information
    const service = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, input.service_id))
      .execute()
      .then(results => results[0]);

    if (!service) {
      throw new Error('Service not found');
    }

    // 3. Get addon pricing if any addons are selected
    let addons: any[] = [];
    if (input.addons.length > 0) {
      addons = await db.select()
        .from(addonsTable)
        .where(inArray(addonsTable.id, input.addons))
        .execute();

      if (addons.length !== input.addons.length) {
        throw new Error('Some addons not found');
      }
    }

    // 4. Calculate total price
    const basePrice = input.is_solo 
      ? parseFloat(service.base_price_solo)
      : parseFloat(service.base_price_team);

    const addonPrice = addons.reduce((total, addon) => {
      return total + parseFloat(addon.price);
    }, 0);

    // Distance fee calculation (simplified - in practice this would use actual distance calculation)
    const distanceFee = 0; // Placeholder - would calculate based on geo_point and service area

    const totalPrice = basePrice + addonPrice + distanceFee;

    // 5. Create booking record
    const geoPointJson = JSON.stringify({
      type: 'Point',
      coordinates: [input.geo_point.lng, input.geo_point.lat]
    });

    const bookingResult = await db.insert(bookingsTable)
      .values({
        customer_id: customer.id,
        service_id: input.service_id,
        addons: input.addons,
        car_type: input.car_type,
        zone_id: input.zone_id,
        address_text: input.address_text,
        geo_point: geoPointJson,
        scheduled_window_start: new Date(input.scheduled_window.start),
        scheduled_window_end: new Date(input.scheduled_window.end),
        status: 'confirmed',
        price_total: totalPrice.toString(), // Convert number to string for numeric column
        is_solo: input.is_solo,
        distance_fee: distanceFee > 0 ? distanceFee.toString() : null
      })
      .returning()
      .execute();

    const booking = bookingResult[0];

    // 6. Generate booking ID and WhatsApp message (simplified)
    const bookingId = `BK${booking.id.toString().padStart(6, '0')}`;
    const whatsappMessageId = `wa_${Date.now()}_${booking.id}`;

    // 7. Return booking response
    return {
      booking_id: bookingId,
      price_total: parseFloat(booking.price_total), // Convert string back to number
      wa_message_id: whatsappMessageId
    };

  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
};