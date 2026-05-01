import { sqliteTable, text, integer, real, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'), // Hashed password for credentials auth
  name: text('name'),
  image: text('image'),
  role: text('role', { enum: ['user', 'admin'] }).default('user').notNull(),
  isPreApproved: integer('is_pre_approved', { mode: 'boolean' }).default(false).notNull(),
  // Crowd data: case-insensitive unique enforced via raw migration index
  publicSlug: text('public_slug'),
  displayName: text('display_name'),
  defaultRecordVisibility: text('default_record_visibility', { enum: ['public', 'private'] }).default('private').notNull(),
  expTotal: integer('exp_total').default(0).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
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
export const chargingRecords = sqliteTable(
  'charging_records',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    brandId: text('brand_id')
      .notNull()
      .references(() => chargingNetworks.id, { onDelete: 'restrict' }),
    userCarId: text('user_car_id').references(() => userCars.id, { onDelete: 'set null' }),
    chargingDatetime: integer('charging_datetime', { mode: 'timestamp' }).notNull(),
    chargedKwh: real('charged_kwh').notNull(),
    costThb: real('cost_thb').notNull(),
    avgUnitPrice: real('avg_unit_price'),
    chargingPowerKw: real('charging_power_kw'),
    chargingFinishDatetime: integer('charging_finish_datetime', { mode: 'timestamp' }),
    mileageKm: real('mileage_km'),
    notes: text('notes'),
    approvalStatus: text('approval_status', { enum: ['pending', 'approved', 'rejected'] }).default('approved').notNull(),
    isShared: integer('is_shared', { mode: 'boolean' }).default(false).notNull(),
    photoKey: text('photo_key'),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
    reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    rejectionReason: text('rejection_reason'),
    expAwarded: integer('exp_awarded').default(0).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (t) => [index('idx_records_shared_approved').on(t.isShared, t.approvalStatus, t.chargingDatetime)],
);

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

// Car brands (admin-managed catalog)
export const carBrands = sqliteTable('car_brands', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Car models (admin-managed catalog, FK to brand)
export const carModels = sqliteTable(
  'car_models',
  {
    id: text('id').primaryKey(),
    brandId: text('brand_id')
      .notNull()
      .references(() => carBrands.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    modelYear: integer('model_year'),
    batteryKwh: real('battery_kwh'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (t) => [index('idx_car_models_brand').on(t.brandId)],
);

// User cars (a user owns one or more catalog models; one is default)
// Partial unique on (user_id) WHERE is_default = 1 created in raw migration.
export const userCars = sqliteTable('user_cars', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  carModelId: text('car_model_id')
    .notNull()
    .references(() => carModels.id, { onDelete: 'restrict' }),
  nickname: text('nickname'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Versioned legal documents (terms, privacy) per locale
export const legalDocuments = sqliteTable(
  'legal_documents',
  {
    id: text('id').primaryKey(),
    type: text('type', { enum: ['terms', 'privacy'] }).notNull(),
    locale: text('locale', { enum: ['en', 'th'] }).notNull(),
    version: integer('version').notNull(),
    content: text('content').notNull(),
    effectiveAt: integer('effective_at', { mode: 'timestamp' }).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(),
  },
  (t) => [uniqueIndex('idx_legal_unique').on(t.type, t.locale, t.version)],
);

// User consent acceptances per legal document version
export const userConsents = sqliteTable(
  'user_consents',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    documentType: text('document_type', { enum: ['terms', 'privacy'] }).notNull(),
    version: integer('version').notNull(),
    acceptedAt: integer('accepted_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex('idx_consent_unique').on(t.userId, t.documentType, t.version)],
);

// EXP audit ledger — every award and reversal
export const expEvents = sqliteTable(
  'exp_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recordId: text('record_id').references(() => chargingRecords.id, { onDelete: 'cascade' }),
    source: text('source', { enum: ['record_approved', 'photo_bonus', 'first_network', 'admin_grant'] }).notNull(),
    delta: integer('delta').notNull(),
    brandId: text('brand_id').references(() => chargingNetworks.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (t) => [index('idx_exp_user').on(t.userId)],
);

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
export type CarBrand = typeof carBrands.$inferSelect;
export type NewCarBrand = typeof carBrands.$inferInsert;
export type CarModel = typeof carModels.$inferSelect;
export type NewCarModel = typeof carModels.$inferInsert;
export type UserCar = typeof userCars.$inferSelect;
export type NewUserCar = typeof userCars.$inferInsert;
export type LegalDocument = typeof legalDocuments.$inferSelect;
export type NewLegalDocument = typeof legalDocuments.$inferInsert;
export type UserConsent = typeof userConsents.$inferSelect;
export type NewUserConsent = typeof userConsents.$inferInsert;
export type ExpEvent = typeof expEvents.$inferSelect;
export type NewExpEvent = typeof expEvents.$inferInsert;
