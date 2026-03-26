CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`network_id` text NOT NULL REFERENCES `charging_networks`(`id`) ON DELETE CASCADE,
	`code` text NOT NULL,
	`description_en` text,
	`description_th` text,
	`condition_en` text,
	`condition_th` text,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_coupons_network_id` ON `coupons` (`network_id`);
--> statement-breakpoint
CREATE INDEX `idx_coupons_active_dates` ON `coupons` (`is_active`, `start_date`, `end_date`);
