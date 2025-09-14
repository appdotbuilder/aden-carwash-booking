import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean,
  json,
  date,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const carTypeEnum = pgEnum('car_type', ['sedan', 'suv', 'pickup']);
export const bookingStatusEnum = pgEnum('booking_status', [
  'confirmed',
  'on_the_way', 
  'started',
  'finished',
  'postponed',
  'canceled'
]);
export const discountTypeEnum = pgEnum('discount_type', ['fixed', 'percentage']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'preview', 'published']);
export const fleetLeadStatusEnum = pgEnum('fleet_lead_status', ['new', 'contacted', 'trial', 'converted', 'rejected']);

// Core tables
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  whatsapp_verified: boolean('whatsapp_verified').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const zonesTable = pgTable('zones', {
  id: serial('id').primaryKey(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  polygon_or_center: text('polygon_or_center').notNull(), // GeoJSON as string
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Catalog/Pricing tables
export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  desc_ar: text('desc_ar'),
  desc_en: text('desc_en'),
  base_price_team: numeric('base_price_team', { precision: 10, scale: 2 }).notNull(),
  base_price_solo: numeric('base_price_solo', { precision: 10, scale: 2 }).notNull(),
  est_minutes: integer('est_minutes').notNull(),
  order: integer('order').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const addonsTable = pgTable('addons', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  desc_ar: text('desc_ar'),
  desc_en: text('desc_en'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  est_minutes: integer('est_minutes').notNull(),
  order: integer('order').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const plansTable = pgTable('plans', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  desc_ar: text('desc_ar'),
  desc_en: text('desc_en'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  benefits_ar: json('benefits_ar').$type<string[]>().notNull().default([]),
  benefits_en: json('benefits_en').$type<string[]>().notNull().default([]),
  visible: boolean('visible').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').notNull().references(() => customersTable.id),
  service_id: integer('service_id').notNull().references(() => servicesTable.id),
  addons: json('addons').$type<number[]>().notNull().default([]),
  car_type: carTypeEnum('car_type').notNull(),
  zone_id: integer('zone_id').notNull().references(() => zonesTable.id),
  address_text: text('address_text').notNull(),
  geo_point: text('geo_point').notNull(), // GeoJSON as string
  scheduled_window_start: timestamp('scheduled_window_start').notNull(),
  scheduled_window_end: timestamp('scheduled_window_end').notNull(),
  status: bookingStatusEnum('status').notNull().default('confirmed'),
  price_total: numeric('price_total', { precision: 10, scale: 2 }).notNull(),
  is_solo: boolean('is_solo').notNull().default(false),
  distance_fee: numeric('distance_fee', { precision: 10, scale: 2 }),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const pricingRulesTable = pgTable('pricing_rules', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value_json: text('value_json').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Content CMS tables
export const contentBlocksTable = pgTable('content_blocks', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  ar_value: text('ar_value'),
  en_value: text('en_value'),
  status: contentStatusEnum('status').notNull().default('draft'),
  updated_by: integer('updated_by'),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const faqsTable = pgTable('faqs', {
  id: serial('id').primaryKey(),
  q_ar: text('q_ar').notNull(),
  q_en: text('q_en').notNull(),
  a_ar: text('a_ar').notNull(),
  a_en: text('a_en').notNull(),
  order: integer('order').notNull().default(0),
  tags: json('tags').$type<string[]>().notNull().default([]),
  visible: boolean('visible').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const testimonialsTable = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  district: text('district').notNull(),
  stars: integer('stars').notNull(),
  text_ar: text('text_ar').notNull(),
  text_en: text('text_en').notNull(),
  order: integer('order').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const galleryMediaTable = pgTable('gallery_media', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  alt_ar: text('alt_ar'),
  alt_en: text('alt_en'),
  tags: json('tags').$type<string[]>().notNull().default([]),
  service_filter: text('service_filter'),
  district_filter: text('district_filter'),
  order: integer('order').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const serviceAreasTable = pgTable('service_areas', {
  id: serial('id').primaryKey(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  polygon_or_center: text('polygon_or_center').notNull(), // GeoJSON as string
  order: integer('order').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const popupsTable = pgTable('popups', {
  id: serial('id').primaryKey(),
  location_name_ar: text('location_name_ar').notNull(),
  location_name_en: text('location_name_en').notNull(),
  zone_id: integer('zone_id').notNull().references(() => zonesTable.id),
  day_of_week: integer('day_of_week').notNull(), // 0=Sunday, 6=Saturday
  start_time: text('start_time').notNull(), // HH:MM format
  end_time: text('end_time').notNull(), // HH:MM format
  partner_share_pct: numeric('partner_share_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  visible: boolean('visible').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const seoMetaTable = pgTable('seo_meta', {
  id: serial('id').primaryKey(),
  route: text('route').notNull().unique(),
  title_ar: text('title_ar'),
  title_en: text('title_en'),
  desc_ar: text('desc_ar'),
  desc_en: text('desc_en'),
  og_image_url: text('og_image_url'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const whatsappTemplatesTable = pgTable('whatsapp_templates', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  body_ar: text('body_ar').notNull(),
  body_en: text('body_en').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Marketing/Ops tables
export const couponsTable = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discount_type: discountTypeEnum('discount_type').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  start_at: timestamp('start_at'),
  end_at: timestamp('end_at'),
  usage_limit: integer('usage_limit'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const fleetLeadsTable = pgTable('fleet_leads', {
  id: serial('id').primaryKey(),
  company_name: text('company_name').notNull(),
  contact_person: text('contact_person').notNull(),
  phone: text('phone').notNull(),
  status: fleetLeadStatusEnum('status').notNull().default('new'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const dailyKPIsTable = pgTable('daily_kpis', {
  date: date('date').primaryKey(),
  bookings: integer('bookings').notNull().default(0),
  aov: numeric('aov', { precision: 10, scale: 2 }).notNull().default('0'),
  cpl: numeric('cpl', { precision: 10, scale: 2 }).notNull().default('0'),
  complaints_rate: numeric('complaints_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  addons_ratio: numeric('addons_ratio', { precision: 5, scale: 2 }).notNull().default('0'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const customersRelations = relations(customersTable, ({ many }) => ({
  bookings: many(bookingsTable)
}));

export const zonesRelations = relations(zonesTable, ({ many }) => ({
  bookings: many(bookingsTable),
  popups: many(popupsTable)
}));

export const servicesRelations = relations(servicesTable, ({ many }) => ({
  bookings: many(bookingsTable)
}));

export const bookingsRelations = relations(bookingsTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [bookingsTable.customer_id],
    references: [customersTable.id]
  }),
  service: one(servicesTable, {
    fields: [bookingsTable.service_id],
    references: [servicesTable.id]
  }),
  zone: one(zonesTable, {
    fields: [bookingsTable.zone_id],
    references: [zonesTable.id]
  })
}));

export const popupsRelations = relations(popupsTable, ({ one }) => ({
  zone: one(zonesTable, {
    fields: [popupsTable.zone_id],
    references: [zonesTable.id]
  })
}));

// TypeScript types for the table schemas
export type Customer = typeof customersTable.$inferSelect;
export type NewCustomer = typeof customersTable.$inferInsert;

export type Zone = typeof zonesTable.$inferSelect;
export type NewZone = typeof zonesTable.$inferInsert;

export type Service = typeof servicesTable.$inferSelect;
export type NewService = typeof servicesTable.$inferInsert;

export type Addon = typeof addonsTable.$inferSelect;
export type NewAddon = typeof addonsTable.$inferInsert;

export type Plan = typeof plansTable.$inferSelect;
export type NewPlan = typeof plansTable.$inferInsert;

export type Booking = typeof bookingsTable.$inferSelect;
export type NewBooking = typeof bookingsTable.$inferInsert;

export type PricingRule = typeof pricingRulesTable.$inferSelect;
export type NewPricingRule = typeof pricingRulesTable.$inferInsert;

export type ContentBlock = typeof contentBlocksTable.$inferSelect;
export type NewContentBlock = typeof contentBlocksTable.$inferInsert;

export type FAQ = typeof faqsTable.$inferSelect;
export type NewFAQ = typeof faqsTable.$inferInsert;

export type Testimonial = typeof testimonialsTable.$inferSelect;
export type NewTestimonial = typeof testimonialsTable.$inferInsert;

export type GalleryMedia = typeof galleryMediaTable.$inferSelect;
export type NewGalleryMedia = typeof galleryMediaTable.$inferInsert;

export type ServiceArea = typeof serviceAreasTable.$inferSelect;
export type NewServiceArea = typeof serviceAreasTable.$inferInsert;

export type Popup = typeof popupsTable.$inferSelect;
export type NewPopup = typeof popupsTable.$inferInsert;

export type SEOMeta = typeof seoMetaTable.$inferSelect;
export type NewSEOMeta = typeof seoMetaTable.$inferInsert;

export type WhatsAppTemplate = typeof whatsappTemplatesTable.$inferSelect;
export type NewWhatsAppTemplate = typeof whatsappTemplatesTable.$inferInsert;

export type Coupon = typeof couponsTable.$inferSelect;
export type NewCoupon = typeof couponsTable.$inferInsert;

export type FleetLead = typeof fleetLeadsTable.$inferSelect;
export type NewFleetLead = typeof fleetLeadsTable.$inferInsert;

export type DailyKPI = typeof dailyKPIsTable.$inferSelect;
export type NewDailyKPI = typeof dailyKPIsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  customers: customersTable,
  zones: zonesTable,
  services: servicesTable,
  addons: addonsTable,
  plans: plansTable,
  bookings: bookingsTable,
  pricingRules: pricingRulesTable,
  contentBlocks: contentBlocksTable,
  faqs: faqsTable,
  testimonials: testimonialsTable,
  galleryMedia: galleryMediaTable,
  serviceAreas: serviceAreasTable,
  popups: popupsTable,
  seoMeta: seoMetaTable,
  whatsappTemplates: whatsappTemplatesTable,
  coupons: couponsTable,
  fleetLeads: fleetLeadsTable,
  dailyKPIs: dailyKPIsTable
};