PRAGMA foreign_keys=OFF;--> statement-breakpoint
-- Backfill: bean user_id NULL → first user
UPDATE bean SET user_id = (SELECT id FROM "user" ORDER BY rowid LIMIT 1) WHERE user_id IS NULL;--> statement-breakpoint
-- Backfill: bean text nullable → ''
UPDATE bean SET region = '' WHERE region IS NULL;--> statement-breakpoint
UPDATE bean SET farm = '' WHERE farm IS NULL;--> statement-breakpoint
UPDATE bean SET process = '' WHERE process IS NULL;--> statement-breakpoint
UPDATE bean SET variety = '' WHERE variety IS NULL;--> statement-breakpoint
UPDATE bean SET roaster = '' WHERE roaster IS NULL;--> statement-breakpoint
UPDATE bean SET notes = '' WHERE notes IS NULL;--> statement-breakpoint
-- Backfill: bean numeric nullable → 0
UPDATE bean SET price_jpy = 0 WHERE price_jpy IS NULL;--> statement-breakpoint
CREATE TABLE `__new_bean` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL,
	`region` text DEFAULT '' NOT NULL,
	`farm` text DEFAULT '' NOT NULL,
	`process` text DEFAULT '' NOT NULL,
	`variety` text DEFAULT '' NOT NULL,
	`roast` text NOT NULL,
	`roaster` text DEFAULT '' NOT NULL,
	`price_jpy` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_bean`("id", "user_id", "name", "country", "region", "farm", "process", "variety", "roast", "roaster", "price_jpy", "notes", "created", "updated") SELECT "id", "user_id", "name", "country", "region", "farm", "process", "variety", "roast", "roaster", "price_jpy", "notes", "created", "updated" FROM `bean`;--> statement-breakpoint
DROP TABLE `bean`;--> statement-breakpoint
ALTER TABLE `__new_bean` RENAME TO `bean`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
-- Backfill: brew_preset user_id NULL → first user
UPDATE brew_preset SET user_id = (SELECT id FROM "user" ORDER BY rowid LIMIT 1) WHERE user_id IS NULL;--> statement-breakpoint
-- Backfill: brew_preset text nullable → ''
UPDATE brew_preset SET description = '' WHERE description IS NULL;--> statement-breakpoint
-- Backfill: brew_preset numeric nullable → 0
UPDATE brew_preset SET default_bean_weight = 0 WHERE default_bean_weight IS NULL;--> statement-breakpoint
UPDATE brew_preset SET default_water_temp = 0 WHERE default_water_temp IS NULL;--> statement-breakpoint
CREATE TABLE `__new_brew_preset` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`default_bean_weight` real DEFAULT 0 NOT NULL,
	`default_water_temp` real DEFAULT 0 NOT NULL,
	`steps` text NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_brew_preset`("id", "user_id", "name", "description", "default_bean_weight", "default_water_temp", "steps", "created", "updated") SELECT "id", "user_id", "name", "description", "default_bean_weight", "default_water_temp", "steps", "created", "updated" FROM `brew_preset`;--> statement-breakpoint
DROP TABLE `brew_preset`;--> statement-breakpoint
ALTER TABLE `__new_brew_preset` RENAME TO `brew_preset`;--> statement-breakpoint
-- Backfill: brew user_id NULL → first user
UPDATE brew SET user_id = (SELECT id FROM "user" ORDER BY rowid LIMIT 1) WHERE user_id IS NULL;--> statement-breakpoint
-- Backfill: brew numeric nullable → 0
UPDATE brew SET bean_grind = 0 WHERE bean_grind IS NULL;--> statement-breakpoint
UPDATE brew SET water_temp = 0 WHERE water_temp IS NULL;--> statement-breakpoint
-- Backfill: brew text nullable → ''
UPDATE brew SET notes = '' WHERE notes IS NULL;--> statement-breakpoint
CREATE TABLE `__new_brew` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bean_id` text NOT NULL,
	`bean_weight` real NOT NULL,
	`bean_grind` real DEFAULT 0 NOT NULL,
	`water_weight` real NOT NULL,
	`water_temp` real DEFAULT 0 NOT NULL,
	`steps` text NOT NULL,
	`aroma` integer NOT NULL,
	`acidity` integer NOT NULL,
	`sweetness` integer NOT NULL,
	`body` integer NOT NULL,
	`overall` integer NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bean_id`) REFERENCES `bean`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_brew`("id", "user_id", "bean_id", "bean_weight", "bean_grind", "water_weight", "water_temp", "steps", "aroma", "acidity", "sweetness", "body", "overall", "notes", "created", "updated") SELECT "id", "user_id", "bean_id", "bean_weight", "bean_grind", "water_weight", "water_temp", "steps", "aroma", "acidity", "sweetness", "body", "overall", "notes", "created", "updated" FROM `brew`;--> statement-breakpoint
DROP TABLE `brew`;--> statement-breakpoint
ALTER TABLE `__new_brew` RENAME TO `brew`;