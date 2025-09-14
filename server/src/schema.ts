import { z } from 'zod';

// Enum schemas
export const carTypeSchema = z.enum(['sedan', 'suv', 'pickup']);
export const bookingStatusSchema = z.enum([
  'confirmed',
  'on_the_way', 
  'started',
  'finished',
  'postponed',
  'canceled'
]);
export const discountTypeSchema = z.enum(['fixed', 'percentage']);
export const contentStatusSchema = z.enum(['draft', 'preview', 'published']);
export const fleetLeadStatusSchema = z.enum(['new', 'contacted', 'trial', 'converted', 'rejected']);

// Core Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  whatsapp_verified: z.boolean(),
  created_at: z.coerce.date()
});
export type Customer = z.infer<typeof customerSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^\+967\d{8,9}$/),
  whatsapp_verified: z.boolean().default(false)
});
export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Zone schema
export const zoneSchema = z.object({
  id: z.number(),
  name_ar: z.string(),
  name_en: z.string(),
  polygon_or_center: z.string(), // GeoJSON as string
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});
export type Zone = z.infer<typeof zoneSchema>;

export const createZoneInputSchema = z.object({
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  polygon_or_center: z.string(),
  notes: z.string().nullable().optional()
});
export type CreateZoneInput = z.infer<typeof createZoneInputSchema>;

// Service schema
export const serviceSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name_ar: z.string(),
  name_en: z.string(),
  desc_ar: z.string().nullable(),
  desc_en: z.string().nullable(),
  base_price_team: z.number(),
  base_price_solo: z.number(),
  est_minutes: z.number().int(),
  order: z.number().int(),
  visible: z.boolean(),
  created_at: z.coerce.date()
});
export type Service = z.infer<typeof serviceSchema>;

export const createServiceInputSchema = z.object({
  slug: z.string().min(1),
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  desc_ar: z.string().nullable().optional(),
  desc_en: z.string().nullable().optional(),
  base_price_team: z.number().positive(),
  base_price_solo: z.number().positive(),
  est_minutes: z.number().int().positive(),
  order: z.number().int().default(0),
  visible: z.boolean().default(true)
});
export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;

// Add-on schema
export const addonSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name_ar: z.string(),
  name_en: z.string(),
  desc_ar: z.string().nullable(),
  desc_en: z.string().nullable(),
  price: z.number(),
  est_minutes: z.number().int(),
  order: z.number().int(),
  visible: z.boolean(),
  created_at: z.coerce.date()
});
export type Addon = z.infer<typeof addonSchema>;

export const createAddonInputSchema = z.object({
  slug: z.string().min(1),
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  desc_ar: z.string().nullable().optional(),
  desc_en: z.string().nullable().optional(),
  price: z.number().positive(),
  est_minutes: z.number().int().positive(),
  order: z.number().int().default(0),
  visible: z.boolean().default(true)
});
export type CreateAddonInput = z.infer<typeof createAddonInputSchema>;

// Plan schema (subscriptions)
export const planSchema = z.object({
  id: z.number(),
  code: z.string(),
  name_ar: z.string(),
  name_en: z.string(),
  desc_ar: z.string().nullable(),
  desc_en: z.string().nullable(),
  price: z.number(),
  benefits_ar: z.array(z.string()),
  benefits_en: z.array(z.string()),
  visible: z.boolean(),
  created_at: z.coerce.date()
});
export type Plan = z.infer<typeof planSchema>;

export const createPlanInputSchema = z.object({
  code: z.string().min(1),
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  desc_ar: z.string().nullable().optional(),
  desc_en: z.string().nullable().optional(),
  price: z.number().positive(),
  benefits_ar: z.array(z.string()).default([]),
  benefits_en: z.array(z.string()).default([]),
  visible: z.boolean().default(true)
});
export type CreatePlanInput = z.infer<typeof createPlanInputSchema>;

// Booking schema
export const bookingSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  service_id: z.number(),
  addons: z.array(z.number()),
  car_type: carTypeSchema,
  zone_id: z.number(),
  address_text: z.string(),
  geo_point: z.string(), // GeoJSON as string
  scheduled_window_start: z.coerce.date(),
  scheduled_window_end: z.coerce.date(),
  status: bookingStatusSchema,
  price_total: z.number(),
  is_solo: z.boolean(),
  distance_fee: z.number().nullable(),
  created_at: z.coerce.date()
});
export type Booking = z.infer<typeof bookingSchema>;

export const createBookingInputSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().regex(/^\+967\d{8,9}$/)
  }),
  service_id: z.number(),
  addons: z.array(z.number()).default([]),
  car_type: carTypeSchema,
  zone_id: z.number(),
  address_text: z.string().min(1),
  geo_point: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  scheduled_window: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  is_solo: z.boolean().default(false)
});
export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

// Pricing Rules schema
export const pricingRuleSchema = z.object({
  id: z.number(),
  key: z.string(),
  value_json: z.string(), // JSON as string
  enabled: z.boolean(),
  created_at: z.coerce.date()
});
export type PricingRule = z.infer<typeof pricingRuleSchema>;

export const createPricingRuleInputSchema = z.object({
  key: z.string().min(1),
  value_json: z.string(),
  enabled: z.boolean().default(true)
});
export type CreatePricingRuleInput = z.infer<typeof createPricingRuleInputSchema>;

// Content Block schema (CMS)
export const contentBlockSchema = z.object({
  id: z.number(),
  key: z.string(),
  ar_value: z.string().nullable(),
  en_value: z.string().nullable(),
  status: contentStatusSchema,
  updated_by: z.number().nullable(),
  updated_at: z.coerce.date()
});
export type ContentBlock = z.infer<typeof contentBlockSchema>;

export const createContentBlockInputSchema = z.object({
  key: z.string().min(1),
  ar_value: z.string().nullable().optional(),
  en_value: z.string().nullable().optional(),
  status: contentStatusSchema.default('draft')
});
export type CreateContentBlockInput = z.infer<typeof createContentBlockInputSchema>;

// FAQ schema
export const faqSchema = z.object({
  id: z.number(),
  q_ar: z.string(),
  q_en: z.string(),
  a_ar: z.string(),
  a_en: z.string(),
  order: z.number().int(),
  tags: z.array(z.string()),
  visible: z.boolean(),
  created_at: z.coerce.date()
});
export type FAQ = z.infer<typeof faqSchema>;

export const createFAQInputSchema = z.object({
  q_ar: z.string().min(1),
  q_en: z.string().min(1),
  a_ar: z.string().min(1),
  a_en: z.string().min(1),
  order: z.number().int().default(0),
  tags: z.array(z.string()).default([]),
  visible: z.boolean().default(true)
});
export type CreateFAQInput = z.infer<typeof createFAQInputSchema>;

// Testimonial schema
export const testimonialSchema = z.object({
  id: z.number(),
  name: z.string(),
  district: z.string(),
  stars: z.number().int().min(1).max(5),
  text_ar: z.string(),
  text_en: z.string(),
  order: z.number().int(),
  visible: z.boolean(),
  created_at: z.coerce.date()
});
export type Testimonial = z.infer<typeof testimonialSchema>;

export const createTestimonialInputSchema = z.object({
  name: z.string().min(1),
  district: z.string().min(1),
  stars: z.number().int().min(1).max(5),
  text_ar: z.string().min(1),
  text_en: z.string().min(1),
  order: z.number().int().default(0),
  visible: z.boolean().default(true)
});
export type CreateTestimonialInput = z.infer<typeof createTestimonialInputSchema>;

// Gallery Media schema
export const galleryMediaSchema = z.object({
  id: z.number(),
  url: z.string(),
  alt_ar: z.string().nullable(),
  alt_en: z.string().nullable(),
  tags: z.array(z.string()),
  service_filter: z.string().nullable(),
  district_filter: z.string().nullable(),
  order: z.number().int(),
  visible: z.boolean(),
  created_at: z.coerce.date()
});
export type GalleryMedia = z.infer<typeof galleryMediaSchema>;

export const createGalleryMediaInputSchema = z.object({
  url: z.string().url(),
  alt_ar: z.string().nullable().optional(),
  alt_en: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  service_filter: z.string().nullable().optional(),
  district_filter: z.string().nullable().optional(),
  order: z.number().int().default(0),
  visible: z.boolean().default(true)
});
export type CreateGalleryMediaInput = z.infer<typeof createGalleryMediaInputSchema>;

// Service Area schema
export const serviceAreaSchema = z.object({
  id: z.number(),
  name_ar: z.string(),
  name_en: z.string(),
  polygon_or_center: z.string(), // GeoJSON as string
  order: z.number().int(),
  visible: z.boolean(),
  created_at: z.coerce.date()
});
export type ServiceArea = z.infer<typeof serviceAreaSchema>;

export const createServiceAreaInputSchema = z.object({
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  polygon_or_center: z.string(),
  order: z.number().int().default(0),
  visible: z.boolean().default(true)
});
export type CreateServiceAreaInput = z.infer<typeof createServiceAreaInputSchema>;

// Pop-up schema
export const popupSchema = z.object({
  id: z.number(),
  location_name_ar: z.string(),
  location_name_en: z.string(),
  zone_id: z.number(),
  day_of_week: z.number().int().min(0).max(6), // 0=Sunday, 6=Saturday
  start_time: z.string(), // HH:MM format
  end_time: z.string(), // HH:MM format
  partner_share_pct: z.number().min(0).max(100),
  visible: z.boolean(),
  created_at: z.coerce.date()
});
export type Popup = z.infer<typeof popupSchema>;

export const createPopupInputSchema = z.object({
  location_name_ar: z.string().min(1),
  location_name_en: z.string().min(1),
  zone_id: z.number(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  partner_share_pct: z.number().min(0).max(100).default(0),
  visible: z.boolean().default(true)
});
export type CreatePopupInput = z.infer<typeof createPopupInputSchema>;

// SEO Meta schema
export const seoMetaSchema = z.object({
  id: z.number(),
  route: z.string(),
  title_ar: z.string().nullable(),
  title_en: z.string().nullable(),
  desc_ar: z.string().nullable(),
  desc_en: z.string().nullable(),
  og_image_url: z.string().nullable(),
  created_at: z.coerce.date()
});
export type SEOMeta = z.infer<typeof seoMetaSchema>;

export const createSEOMetaInputSchema = z.object({
  route: z.string().min(1),
  title_ar: z.string().nullable().optional(),
  title_en: z.string().nullable().optional(),
  desc_ar: z.string().nullable().optional(),
  desc_en: z.string().nullable().optional(),
  og_image_url: z.string().url().nullable().optional()
});
export type CreateSEOMetaInput = z.infer<typeof createSEOMetaInputSchema>;

// WhatsApp Template schema
export const whatsappTemplateSchema = z.object({
  id: z.number(),
  key: z.string(),
  body_ar: z.string(),
  body_en: z.string(),
  created_at: z.coerce.date()
});
export type WhatsAppTemplate = z.infer<typeof whatsappTemplateSchema>;

export const createWhatsAppTemplateInputSchema = z.object({
  key: z.string().min(1),
  body_ar: z.string().min(1),
  body_en: z.string().min(1)
});
export type CreateWhatsAppTemplateInput = z.infer<typeof createWhatsAppTemplateInputSchema>;

// Coupon schema
export const couponSchema = z.object({
  id: z.number(),
  code: z.string(),
  discount_type: discountTypeSchema,
  value: z.number(),
  start_at: z.coerce.date().nullable(),
  end_at: z.coerce.date().nullable(),
  usage_limit: z.number().int().nullable(),
  created_at: z.coerce.date()
});
export type Coupon = z.infer<typeof couponSchema>;

export const createCouponInputSchema = z.object({
  code: z.string().min(1),
  discount_type: discountTypeSchema,
  value: z.number().positive(),
  start_at: z.string().datetime().nullable().optional(),
  end_at: z.string().datetime().nullable().optional(),
  usage_limit: z.number().int().positive().nullable().optional()
});
export type CreateCouponInput = z.infer<typeof createCouponInputSchema>;

// Fleet Lead schema
export const fleetLeadSchema = z.object({
  id: z.number(),
  company_name: z.string(),
  contact_person: z.string(),
  phone: z.string(),
  status: fleetLeadStatusSchema,
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});
export type FleetLead = z.infer<typeof fleetLeadSchema>;

export const createFleetLeadInputSchema = z.object({
  company_name: z.string().min(1),
  contact_person: z.string().min(1),
  phone: z.string().regex(/^\+967\d{8,9}$/),
  status: fleetLeadStatusSchema.default('new'),
  notes: z.string().nullable().optional()
});
export type CreateFleetLeadInput = z.infer<typeof createFleetLeadInputSchema>;

// Daily KPIs schema
export const dailyKPISchema = z.object({
  date: z.coerce.date(),
  bookings: z.number().int(),
  aov: z.number(), // Average Order Value
  cpl: z.number(), // Cost Per Lead
  complaints_rate: z.number().min(0).max(100), // Percentage
  addons_ratio: z.number().min(0).max(100), // Percentage
  created_at: z.coerce.date()
});
export type DailyKPI = z.infer<typeof dailyKPISchema>;

export const createDailyKPIInputSchema = z.object({
  date: z.string().datetime(),
  bookings: z.number().int().nonnegative(),
  aov: z.number().nonnegative(),
  cpl: z.number().nonnegative(),
  complaints_rate: z.number().min(0).max(100),
  addons_ratio: z.number().min(0).max(100)
});
export type CreateDailyKPIInput = z.infer<typeof createDailyKPIInputSchema>;

// Booking response schema for API
export const bookingResponseSchema = z.object({
  booking_id: z.string(),
  price_total: z.number(),
  wa_message_id: z.string().nullable()
});
export type BookingResponse = z.infer<typeof bookingResponseSchema>;

// Admin overview response schema
export const adminOverviewSchema = z.object({
  today_bookings: z.number().int(),
  pending_bookings: z.number().int(),
  completed_bookings: z.number().int(),
  revenue_today: z.number(),
  avg_service_time: z.number(),
  on_time_percentage: z.number()
});
export type AdminOverview = z.infer<typeof adminOverviewSchema>;