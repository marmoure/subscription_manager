PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`hashed_password` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`created_at` integer DEFAULT '"2026-01-25T17:07:38.026Z"' NOT NULL,
	`last_login_at` integer,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_admin_users`("id", "username", "hashed_password", "email", "role", "created_at", "last_login_at", "is_active") SELECT "id", "username", "hashed_password", "email", "role", "created_at", "last_login_at", "is_active" FROM `admin_users`;--> statement-breakpoint
DROP TABLE `admin_users`;--> statement-breakpoint
ALTER TABLE `__new_admin_users` RENAME TO `admin_users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_username_unique` ON `admin_users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `__new_api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`name` text,
	`created_at` integer DEFAULT '"2026-01-25T17:07:38.025Z"' NOT NULL,
	`last_used_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_api_keys`("id", "key", "name", "created_at", "last_used_at", "is_active", "usage_count") SELECT "id", "key", "name", "created_at", "last_used_at", "is_active", "usage_count" FROM `api_keys`;--> statement-breakpoint
DROP TABLE `api_keys`;--> statement-breakpoint
ALTER TABLE `__new_api_keys` RENAME TO `api_keys`;--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE INDEX `key_idx` ON `api_keys` (`key`);--> statement-breakpoint
CREATE TABLE `__new_license_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`license_key` text NOT NULL,
	`machine_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT '"2026-01-25T17:07:38.025Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2026-01-25T17:07:38.025Z"' NOT NULL,
	`expires_at` integer,
	`revoked_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_license_keys`("id", "license_key", "machine_id", "status", "created_at", "updated_at", "expires_at", "revoked_at") SELECT "id", "license_key", "machine_id", "status", "created_at", "updated_at", "expires_at", "revoked_at" FROM `license_keys`;--> statement-breakpoint
DROP TABLE `license_keys`;--> statement-breakpoint
ALTER TABLE `__new_license_keys` RENAME TO `license_keys`;--> statement-breakpoint
CREATE UNIQUE INDEX `license_keys_license_key_unique` ON `license_keys` (`license_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `license_key_idx` ON `license_keys` (`license_key`);--> statement-breakpoint
CREATE INDEX `machine_id_idx` ON `license_keys` (`machine_id`);--> statement-breakpoint
CREATE TABLE `__new_license_status_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`license_key_id` integer NOT NULL,
	`old_status` text,
	`new_status` text NOT NULL,
	`admin_id` integer NOT NULL,
	`reason` text,
	`timestamp` integer DEFAULT '"2026-01-25T17:07:38.026Z"' NOT NULL,
	FOREIGN KEY (`license_key_id`) REFERENCES `license_keys`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`admin_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_license_status_logs`("id", "license_key_id", "old_status", "new_status", "admin_id", "reason", "timestamp") SELECT "id", "license_key_id", "old_status", "new_status", "admin_id", "reason", "timestamp" FROM `license_status_logs`;--> statement-breakpoint
DROP TABLE `license_status_logs`;--> statement-breakpoint
ALTER TABLE `__new_license_status_logs` RENAME TO `license_status_logs`;--> statement-breakpoint
CREATE INDEX `license_status_logs_license_key_id_idx` ON `license_status_logs` (`license_key_id`);--> statement-breakpoint
CREATE INDEX `license_status_logs_admin_id_idx` ON `license_status_logs` (`admin_id`);--> statement-breakpoint
CREATE INDEX `license_status_logs_timestamp_idx` ON `license_status_logs` (`timestamp`);--> statement-breakpoint
CREATE TABLE `__new_user_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`machine_id` text NOT NULL,
	`phone` text NOT NULL,
	`shop_name` text NOT NULL,
	`email` text NOT NULL,
	`number_of_cashiers` integer NOT NULL,
	`submission_date` integer DEFAULT '"2026-01-25T17:07:38.025Z"' NOT NULL,
	`ip_address` text,
	`license_key_id` integer,
	FOREIGN KEY (`license_key_id`) REFERENCES `license_keys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_submissions`("id", "name", "machine_id", "phone", "shop_name", "email", "number_of_cashiers", "submission_date", "ip_address", "license_key_id") SELECT "id", "name", "machine_id", "phone", "shop_name", "email", "number_of_cashiers", "submission_date", "ip_address", "license_key_id" FROM `user_submissions`;--> statement-breakpoint
DROP TABLE `user_submissions`;--> statement-breakpoint
ALTER TABLE `__new_user_submissions` RENAME TO `user_submissions`;--> statement-breakpoint
CREATE INDEX `submission_name_idx` ON `user_submissions` (`name`);--> statement-breakpoint
CREATE INDEX `submission_email_idx` ON `user_submissions` (`email`);--> statement-breakpoint
CREATE INDEX `submission_shop_name_idx` ON `user_submissions` (`shop_name`);--> statement-breakpoint
CREATE INDEX `submission_machine_id_idx` ON `user_submissions` (`machine_id`);--> statement-breakpoint
CREATE INDEX `submission_date_idx` ON `user_submissions` (`submission_date`);--> statement-breakpoint
CREATE INDEX `submission_cashiers_idx` ON `user_submissions` (`number_of_cashiers`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer DEFAULT '"2026-01-25T17:07:38.024Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "email", "created_at") SELECT "id", "name", "email", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `__new_verification_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`license_key_id` integer NOT NULL,
	`machine_id` text NOT NULL,
	`status` text NOT NULL,
	`message` text,
	`ip_address` text,
	`timestamp` integer DEFAULT '"2026-01-25T17:07:38.026Z"' NOT NULL,
	FOREIGN KEY (`license_key_id`) REFERENCES `license_keys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_verification_logs`("id", "license_key_id", "machine_id", "status", "message", "ip_address", "timestamp") SELECT "id", "license_key_id", "machine_id", "status", "message", "ip_address", "timestamp" FROM `verification_logs`;--> statement-breakpoint
DROP TABLE `verification_logs`;--> statement-breakpoint
ALTER TABLE `__new_verification_logs` RENAME TO `verification_logs`;--> statement-breakpoint
CREATE INDEX `verification_logs_license_key_id_idx` ON `verification_logs` (`license_key_id`);--> statement-breakpoint
CREATE INDEX `verification_logs_machine_id_idx` ON `verification_logs` (`machine_id`);--> statement-breakpoint
CREATE INDEX `verification_logs_timestamp_idx` ON `verification_logs` (`timestamp`);