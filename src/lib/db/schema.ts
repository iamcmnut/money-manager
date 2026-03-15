import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'), // Hashed password for credentials auth
  name: text('name'),
  image: text('image'),
  role: text('role', { enum: ['user', 'admin'] }).default('user').notNull(),
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
  chargedKwh: integer('charged_kwh').notNull(), // Store as cents (value * 100)
  costThb: integer('cost_thb').notNull(), // Store as satang (value * 100)
  avgUnitPrice: integer('avg_unit_price'), // Computed: costThb / chargedKwh
  mileageKm: integer('mileage_km'), // Optional
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
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
