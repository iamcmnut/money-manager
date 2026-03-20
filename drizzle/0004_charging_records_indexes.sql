CREATE INDEX `charging_records_user_id_idx` ON `charging_records` (`user_id`);
--> statement-breakpoint
CREATE INDEX `charging_records_brand_id_idx` ON `charging_records` (`brand_id`);
--> statement-breakpoint
CREATE INDEX `charging_records_charging_datetime_idx` ON `charging_records` (`charging_datetime` DESC);
--> statement-breakpoint
CREATE INDEX `charging_records_user_datetime_idx` ON `charging_records` (`user_id`, `charging_datetime` DESC);
