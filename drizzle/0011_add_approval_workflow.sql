ALTER TABLE `charging_records` ADD COLUMN `approval_status` text NOT NULL DEFAULT 'approved';
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `is_pre_approved` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE INDEX `idx_records_approval_status` ON `charging_records` (`approval_status`);
