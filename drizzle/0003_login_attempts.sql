CREATE TABLE `login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`attempt_type` text NOT NULL,
	`success` integer DEFAULT false NOT NULL,
	`ip_address` text,
	`attempted_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_attempts_identifier_idx` ON `login_attempts` (`identifier`, `attempt_type`, `attempted_at`);
