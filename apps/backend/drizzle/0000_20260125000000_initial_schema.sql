CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`hashed_password` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer DEFAULT '"2026-01-24T23:33:14.356Z"' NOT NULL,
	`last_login_at` integer,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_username_unique` ON `admin_users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`name` text,
	`created_at` integer DEFAULT '"2026-01-24T23:33:14.356Z"' NOT NULL,
	`last_used_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE INDEX `key_idx` ON `api_keys` (`key`);--> statement-breakpoint
CREATE TABLE `license_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`license_key` text NOT NULL,
	`machine_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT '"2026-01-24T23:33:14.356Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2026-01-24T23:33:14.356Z"' NOT NULL,
	`expires_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `license_keys_license_key_unique` ON `license_keys` (`license_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `license_key_idx` ON `license_keys` (`license_key`);--> statement-breakpoint
CREATE INDEX `machine_id_idx` ON `license_keys` (`machine_id`);--> statement-breakpoint
CREATE TABLE `user_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`machine_id` text NOT NULL,
	`phone` text NOT NULL,
	`shop_name` text NOT NULL,
	`email` text NOT NULL,
	`number_of_cashiers` integer NOT NULL,
	`submission_date` integer DEFAULT '"2026-01-24T23:33:14.356Z"' NOT NULL,
	`ip_address` text,
	`license_key_id` integer,
	FOREIGN KEY (`license_key_id`) REFERENCES `license_keys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `submission_email_idx` ON `user_submissions` (`email`);--> statement-breakpoint
CREATE INDEX `submission_machine_id_idx` ON `user_submissions` (`machine_id`);--> statement-breakpoint
CREATE INDEX `submission_date_idx` ON `user_submissions` (`submission_date`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer DEFAULT '"2026-01-24T23:33:14.355Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);