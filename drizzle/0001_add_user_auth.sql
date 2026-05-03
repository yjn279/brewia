-- Migration: add user auth tables and user_id columns to bean/brew
-- Step 1: Create user and session tables
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Step 2: Add user_id column (nullable first) to bean and brew
ALTER TABLE `bean` ADD COLUMN `user_id` text;
--> statement-breakpoint
ALTER TABLE `brew` ADD COLUMN `user_id` text;
--> statement-breakpoint

-- Step 3: Insert seed user (INSERT OR IGNORE to be idempotent)
INSERT OR IGNORE INTO `user` (`id`, `email`, `password_hash`, `created`)
VALUES (
  '00000000-0000-7000-8000-000000000001',
  'seed@brewia.app',
  'SEED_USER_NO_LOGIN',
  CURRENT_TIMESTAMP
);
--> statement-breakpoint

-- Step 4: Update existing rows to point at seed user
UPDATE `bean` SET `user_id` = '00000000-0000-7000-8000-000000000001' WHERE `user_id` IS NULL;
--> statement-breakpoint
UPDATE `brew` SET `user_id` = '00000000-0000-7000-8000-000000000001' WHERE `user_id` IS NULL;
--> statement-breakpoint

-- Step 5: Rebuild bean table with NOT NULL + FK on user_id
-- (SQLite does not support ADD CONSTRAINT after the fact, so we use table-rebuild idiom)
CREATE TABLE `bean_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL,
	`region` text,
	`farm` text,
	`process` text,
	`variety` text,
	`roast` text NOT NULL,
	`roaster` text,
	`notes` text,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `bean_new` SELECT `id`, `user_id`, `name`, `country`, `region`, `farm`, `process`, `variety`, `roast`, `roaster`, `notes`, `created`, `updated` FROM `bean`;
--> statement-breakpoint
DROP TABLE `bean`;
--> statement-breakpoint
ALTER TABLE `bean_new` RENAME TO `bean`;
--> statement-breakpoint

-- Step 6: Rebuild brew table with NOT NULL + FK on user_id
CREATE TABLE `brew_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bean_id` text NOT NULL,
	`bean_weight` real NOT NULL,
	`bean_grind` real,
	`water_weight` real NOT NULL,
	`water_temp` real,
	`steps` text NOT NULL,
	`aroma` integer NOT NULL,
	`acidity` integer NOT NULL,
	`sweetness` integer NOT NULL,
	`body` integer NOT NULL,
	`overall` integer NOT NULL,
	`notes` text,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bean_id`) REFERENCES `bean`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `brew_new` SELECT `id`, `user_id`, `bean_id`, `bean_weight`, `bean_grind`, `water_weight`, `water_temp`, `steps`, `aroma`, `acidity`, `sweetness`, `body`, `overall`, `notes`, `created`, `updated` FROM `brew`;
--> statement-breakpoint
DROP TABLE `brew`;
--> statement-breakpoint
ALTER TABLE `brew_new` RENAME TO `brew`;
