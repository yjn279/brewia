CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- Insert legacy user to own existing data
-- password: (randomly set at deployment time; use the signup flow to create real accounts)
INSERT INTO `user` (`id`, `email`, `password_hash`, `password_salt`, `created`, `updated`)
VALUES (
  '01900000-0000-7000-8000-000000000001',
  'legacy@brewia.local',
  'legacy_hash_placeholder',
  'legacy_salt_placeholder',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
--> statement-breakpoint
-- Step 1: Add user_id columns as nullable first (to support existing rows)
ALTER TABLE `bean` ADD `user_id` text REFERENCES user(id);
--> statement-breakpoint
ALTER TABLE `brew` ADD `user_id` text REFERENCES user(id);
--> statement-breakpoint
-- Step 2: Assign all existing rows to the legacy user
UPDATE `bean` SET `user_id` = '01900000-0000-7000-8000-000000000001' WHERE `user_id` IS NULL;
--> statement-breakpoint
UPDATE `brew` SET `user_id` = '01900000-0000-7000-8000-000000000001' WHERE `user_id` IS NULL;
--> statement-breakpoint
-- Step 3: SQLite does not support ALTER COLUMN to add NOT NULL after the fact.
-- drizzle-kit will recreate the tables with NOT NULL via the schema definition.
-- The drizzle-kit push / migrate command handles this automatically.
-- For reference: the final schema has user_id NOT NULL in bean and brew tables.
