-- Crowd EV charging data: schema additions
-- New tables: car_brands, car_models, user_cars, legal_documents, user_consents, exp_events
-- New columns on users and charging_records

-- New columns on users (slug nullable; backfilled by scripts/backfill-slugs.ts)
ALTER TABLE `users` ADD COLUMN `public_slug` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `display_name` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `default_record_visibility` text NOT NULL DEFAULT 'private';
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `exp_total` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `deleted_at` integer;
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_public_slug` ON `users` (`public_slug`);
--> statement-breakpoint

-- Car brands (admin-managed catalog)
CREATE TABLE IF NOT EXISTS `car_brands` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `logo` text,
  `created_at` integer
);
--> statement-breakpoint

-- Car models
CREATE TABLE IF NOT EXISTS `car_models` (
  `id` text PRIMARY KEY NOT NULL,
  `brand_id` text NOT NULL REFERENCES `car_brands`(`id`) ON DELETE RESTRICT,
  `name` text NOT NULL,
  `model_year` integer,
  `battery_kwh` real,
  `is_active` integer NOT NULL DEFAULT 1,
  `created_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_car_models_brand` ON `car_models` (`brand_id`);
--> statement-breakpoint

-- User cars
CREATE TABLE IF NOT EXISTS `user_cars` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `car_model_id` text NOT NULL REFERENCES `car_models`(`id`) ON DELETE RESTRICT,
  `nickname` text,
  `is_default` integer NOT NULL DEFAULT 0,
  `created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_cars_default` ON `user_cars` (`user_id`) WHERE `is_default` = 1;
--> statement-breakpoint
CREATE INDEX `idx_user_cars_user` ON `user_cars` (`user_id`);
--> statement-breakpoint

-- New columns on charging_records
ALTER TABLE `charging_records` ADD COLUMN `user_car_id` text REFERENCES `user_cars`(`id`) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE `charging_records` ADD COLUMN `is_shared` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `charging_records` ADD COLUMN `photo_key` text;
--> statement-breakpoint
ALTER TABLE `charging_records` ADD COLUMN `reviewed_at` integer;
--> statement-breakpoint
ALTER TABLE `charging_records` ADD COLUMN `reviewed_by` text REFERENCES `users`(`id`) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE `charging_records` ADD COLUMN `rejection_reason` text;
--> statement-breakpoint
ALTER TABLE `charging_records` ADD COLUMN `exp_awarded` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE INDEX `idx_records_shared_approved` ON `charging_records` (`is_shared`, `approval_status`, `charging_datetime`);
--> statement-breakpoint

-- Versioned legal documents
CREATE TABLE IF NOT EXISTS `legal_documents` (
  `id` text PRIMARY KEY NOT NULL,
  `type` text NOT NULL,
  `locale` text NOT NULL,
  `version` integer NOT NULL,
  `content` text NOT NULL,
  `effective_at` integer NOT NULL,
  `is_active` integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_legal_unique` ON `legal_documents` (`type`, `locale`, `version`);
--> statement-breakpoint
CREATE INDEX `idx_legal_active` ON `legal_documents` (`type`, `locale`, `is_active`);
--> statement-breakpoint

-- User consent acceptances
CREATE TABLE IF NOT EXISTS `user_consents` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `document_type` text NOT NULL,
  `version` integer NOT NULL,
  `accepted_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_consent_unique` ON `user_consents` (`user_id`, `document_type`, `version`);
--> statement-breakpoint

-- EXP audit ledger
CREATE TABLE IF NOT EXISTS `exp_events` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `record_id` text REFERENCES `charging_records`(`id`) ON DELETE CASCADE,
  `source` text NOT NULL,
  `delta` integer NOT NULL,
  `brand_id` text REFERENCES `charging_networks`(`id`) ON DELETE SET NULL,
  `created_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_exp_user` ON `exp_events` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_exp_record` ON `exp_events` (`record_id`);
--> statement-breakpoint
CREATE INDEX `idx_exp_user_brand_source` ON `exp_events` (`user_id`, `brand_id`, `source`);
