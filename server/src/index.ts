import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createBookingInputSchema,
  createServiceInputSchema,
  createAddonInputSchema,
  createFleetLeadInputSchema,
  createContentBlockInputSchema,
  createFAQInputSchema,
  createTestimonialInputSchema,
  createGalleryMediaInputSchema,
  createPricingRuleInputSchema
} from './schema';

// Import handlers
import { createBooking } from './handlers/create_booking';
import { getBookings } from './handlers/get_bookings';
import { updateBooking } from './handlers/update_booking';
import { getServices } from './handlers/get_services';
import { getAddons } from './handlers/get_addons';
import { getZones } from './handlers/get_zones';
import { calculatePricing } from './handlers/calculate_pricing';
import { getContentBlocks } from './handlers/get_content_blocks';
import { updateContentBlock } from './handlers/update_content_block';
import { getFAQs } from './handlers/get_faqs';
import { createService } from './handlers/create_service';
import { getAdminOverview } from './handlers/get_admin_overview';
import { sendWhatsAppMessage } from './handlers/send_whatsapp_message';
import { getGalleryMedia } from './handlers/get_gallery_media';
import { uploadMedia } from './handlers/upload_media';
import { getPricingRules } from './handlers/get_pricing_rules';
import { getTestimonials } from './handlers/get_testimonials';
import { createFleetLead } from './handlers/create_fleet_lead';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Booking procedures
  createBooking: publicProcedure
    .input(createBookingInputSchema)
    .mutation(({ input }) => createBooking(input)),

  getBookings: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
      zone_id: z.number().optional(),
      customer_id: z.number().optional()
    }).optional())
    .query(({ input }) => getBookings(input)),

  updateBooking: publicProcedure
    .input(z.object({
      id: z.number(),
      updates: z.object({
        status: z.string().optional(),
        scheduled_window_start: z.string().optional(),
        scheduled_window_end: z.string().optional(),
        address_text: z.string().optional(),
        geo_point: z.object({
          lat: z.number(),
          lng: z.number()
        }).optional(),
        notes: z.string().optional()
      })
    }))
    .mutation(({ input }) => updateBooking(input.id, input.updates)),

  // Catalog procedures
  getServices: publicProcedure
    .input(z.object({
      visible_only: z.boolean().optional(),
      language: z.enum(['ar', 'en']).optional()
    }).optional())
    .query(({ input }) => getServices(input)),

  createService: publicProcedure
    .input(createServiceInputSchema)
    .mutation(({ input }) => createService(input)),

  getAddons: publicProcedure
    .input(z.object({
      visible_only: z.boolean().optional(),
      language: z.enum(['ar', 'en']).optional()
    }).optional())
    .query(({ input }) => getAddons(input)),

  getZones: publicProcedure
    .query(() => getZones()),

  // Pricing procedures
  calculatePricing: publicProcedure
    .input(z.object({
      service_id: z.number(),
      addons: z.array(z.number()),
      car_type: z.enum(['sedan', 'suv', 'pickup']),
      is_solo: z.boolean(),
      zone_id: z.number(),
      geo_point: z.object({
        lat: z.number(),
        lng: z.number()
      }),
      coupon_code: z.string().optional()
    }))
    .query(({ input }) => calculatePricing(input)),

  getPricingRules: publicProcedure
    .input(z.object({
      enabled_only: z.boolean().optional(),
      keys: z.array(z.string()).optional()
    }).optional())
    .query(({ input }) => getPricingRules(input)),

  // CMS procedures
  getContentBlocks: publicProcedure
    .input(z.object({
      status: z.enum(['draft', 'preview', 'published']).optional(),
      keys: z.array(z.string()).optional(),
      language: z.enum(['ar', 'en']).optional()
    }).optional())
    .query(({ input }) => getContentBlocks(input)),

  updateContentBlock: publicProcedure
    .input(z.object({
      key: z.string(),
      updates: z.object({
        ar_value: z.string().nullable().optional(),
        en_value: z.string().nullable().optional(),
        status: z.enum(['draft', 'preview', 'published']).optional()
      }),
      updated_by: z.number().optional()
    }))
    .mutation(({ input }) => updateContentBlock(input.key, input.updates, input.updated_by)),

  getFAQs: publicProcedure
    .input(z.object({
      visible_only: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      language: z.enum(['ar', 'en']).optional()
    }).optional())
    .query(({ input }) => getFAQs(input)),

  getTestimonials: publicProcedure
    .input(z.object({
      visible_only: z.boolean().optional(),
      min_stars: z.number().optional(),
      district: z.string().optional(),
      language: z.enum(['ar', 'en']).optional()
    }).optional())
    .query(({ input }) => getTestimonials(input)),

  // Gallery procedures
  getGalleryMedia: publicProcedure
    .input(z.object({
      visible_only: z.boolean().optional(),
      service_filter: z.string().optional(),
      district_filter: z.string().optional(),
      tags: z.array(z.string()).optional(),
      language: z.enum(['ar', 'en']).optional()
    }).optional())
    .query(({ input }) => getGalleryMedia(input)),

  // WhatsApp procedures
  sendWhatsAppMessage: publicProcedure
    .input(z.object({
      phone: z.string(),
      template_key: z.enum(['confirm', 'reminder', 'on_the_way', 'review', 'custom']),
      variables: z.record(z.string()).optional(),
      language: z.enum(['ar', 'en']).optional(),
      custom_message: z.string().optional()
    }))
    .mutation(({ input }) => sendWhatsAppMessage(input)),

  // Fleet/Business procedures
  createFleetLead: publicProcedure
    .input(createFleetLeadInputSchema)
    .mutation(({ input }) => createFleetLead(input)),

  // Admin procedures
  getAdminOverview: publicProcedure
    .query(() => getAdminOverview()),

  // Media upload (simplified for TRPC)
  uploadMediaUrl: publicProcedure
    .input(z.object({
      url: z.string().url(),
      alt_ar: z.string().optional(),
      alt_en: z.string().optional(),
      tags: z.array(z.string()).optional(),
      service_filter: z.string().optional(),
      district_filter: z.string().optional(),
      booking_id: z.number().optional(),
      category: z.enum(['gallery', 'before_after', 'general'])
    }))
    .mutation(({ input }) => uploadMedia({
      file: Buffer.from(''), // Placeholder for URL-based upload
      alt_ar: input.alt_ar,
      alt_en: input.alt_en,
      tags: input.tags,
      service_filter: input.service_filter,
      district_filter: input.district_filter,
      booking_id: input.booking_id,
      category: input.category
    }))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  
  const server = createHTTPServer({
    middleware: cors({
      origin: process.env['CLIENT_URL'] || 'http://localhost:3000',
      credentials: true,
    }),
    router: appRouter,
    createContext() {
      return {};
    },
  });
  
  server.listen(port);
  console.log(`🚀 Mobile Car Wash TRPC server listening at port: ${port}`);
  console.log(`📱 Ready to handle bookings, CMS, and WhatsApp integrations`);
}

start().catch(console.error);