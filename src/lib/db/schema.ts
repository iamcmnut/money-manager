import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'), // Hashed password for credentials auth
  name: text('name'),
  image: text('image'),
  role: text('role', { enum: ['user', 'admin'] }).default('user').notNull(),
  isPreApproved: integer('is_pre_approved', { mode: 'boolean' }).default(false).notNull(),
  emailVerified: integer('email_verified', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Auth.js accounts table
export const accounts = sqliteTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

// Auth.js sessions table
export const sessions = sqliteTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

// Auth.js verification tokens table
export const verificationTokens = sqliteTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// EV Charging Networks (Brands)
export const chargingNetworks = sqliteTable('charging_networks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  website: text('website'),
  phone: text('phone'),
  brandColor: text('brand_color'),
  couponOgImageEn: text('coupon_og_image_en'),
  couponOgImageTh: text('coupon_og_image_th'),
  referralCode: text('referral_code'), // @deprecated — use coupons table instead
  referralCaptionEn: text('referral_caption_en'), // @deprecated — use coupons table instead
  referralCaptionTh: text('referral_caption_th'), // @deprecated — use coupons table instead
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Charging Records
export const chargingRecords = sqliteTable('charging_records', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  brandId: text('brand_id')
    .notNull()
    .references(() => chargingNetworks.id, { onDelete: 'restrict' }),
  chargingDatetime: integer('charging_datetime', { mode: 'timestamp' }).notNull(),
  chargedKwh: real('charged_kwh').notNull(),
  costThb: real('cost_thb').notNull(),
  avgUnitPrice: real('avg_unit_price'),
  chargingPowerKw: real('charging_power_kw'),
  chargingFinishDatetime: integer('charging_finish_datetime', { mode: 'timestamp' }),
  mileageKm: real('mileage_km'),
  notes: text('notes'),
  approvalStatus: text('approval_status', { enum: ['pending', 'approved', 'rejected'] }).default('approved').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Coupons (multiple per network, with date-based validity)
export const coupons = sqliteTable('coupons', {
  id: text('id').primaryKey(),
  networkId: text('network_id')
    .notNull()
    .references(() => chargingNetworks.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  descriptionEn: text('description_en'),
  descriptionTh: text('description_th'),
  conditionEn: text('condition_en'),
  conditionTh: text('condition_th'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Login attempts tracking for brute force protection
export const loginAttempts = sqliteTable('login_attempts', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(), // email or IP address
  attemptType: text('attempt_type', { enum: ['login', 'register'] }).notNull(),
  success: integer('success', { mode: 'boolean' }).notNull().default(false),
  ipAddress: text('ip_address'),
  attemptedAt: integer('attempted_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type ChargingNetwork = typeof chargingNetworks.$inferSelect;
export type NewChargingNetwork = typeof chargingNetworks.$inferInsert;
export type ChargingRecord = typeof chargingRecords.$inferSelect;
export type NewChargingRecord = typeof chargingRecords.$inferInsert;
export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type NewLoginAttempt = typeof loginAttempts.$inferInsert;
