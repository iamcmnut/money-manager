-- Create new table with updated column types
CREATE TABLE `charging_records_new` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `brand_id` text NOT NULL REFERENCES `charging_networks`(`id`) ON DELETE RESTRICT,
  `charging_datetime` integer NOT NULL,
  `charged_kwh` real NOT NULL,
  `cost_thb` real NOT NULL,
  `avg_unit_price` real,
  `charging_power_kw` real,
  `charging_finish_datetime` integer,
  `mileage_km` real,
  `notes` text,
  `created_at` integer,
  `updated_at` integer
);

-- Migrate data: convert integer cents back to decimal values
INSERT INTO `charging_records_new` (
  `id`, `user_id`, `brand_id`, `charging_datetime`,
  `charged_kwh`, `cost_thb`, `avg_unit_price`,
  `mileage_km`, `notes`, `created_at`, `updated_at`
)
SELECT
  `id`, `user_id`, `brand_id`, `charging_datetime`,
  CAST(`charged_kwh` AS REAL) / 100.0,
  CAST(`cost_thb` AS REAL) / 100.0,
  CAST(`avg_unit_price` AS REAL) / 100.0,
  CAST(`mileage_km` AS REAL),
  `notes`, `created_at`, `updated_at`
FROM `charging_records`;

-- Swap tables
DROP TABLE `charging_records`;
ALTER TABLE `charging_records_new` RENAME TO `charging_records`;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS `idx_charging_records_user_id` ON `charging_records` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_charging_records_brand_id` ON `charging_records` (`brand_id`);
CREATE INDEX IF NOT EXISTS `idx_charging_records_datetime` ON `charging_records` (`charging_datetime`);