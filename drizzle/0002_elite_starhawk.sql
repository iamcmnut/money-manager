CREATE TABLE `charging_networks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`website` text,
	`phone` text,
	`brand_color` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `charging_networks_slug_unique` ON `charging_networks` (`slug`);--> statement-breakpoint
CREATE TABLE `charging_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`brand_id` text NOT NULL,
	`charging_datetime` integer NOT NULL,
	`charged_kwh` integer NOT NULL,
	`cost_thb` integer NOT NULL,
	`avg_unit_price` integer,
	`mileage_km` integer,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`brand_id`) REFERENCES `charging_networks`(`id`) ON UPDATE no action ON DELETE restrict
);
