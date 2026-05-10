PRAGMA foreign_keys=OFF;--> statement-breakpoint
-- Backfill: set default_water_weight from steps JSON max water value (or 0 if unavailable)
-- SQLite does not support JSON_EACH in all versions, so we default to 0 for existing rows.
-- Users with existing presets will see no scaling until they re-apply or re-enter values.
UPDATE brew_preset SET default_water_weight = 0 WHERE default_water_weight IS NULL;--> statement-breakpoint
CREATE TABLE `__new_brew_preset` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`default_bean_weight` real DEFAULT 0 NOT NULL,
	`default_water_temp` real DEFAULT 0 NOT NULL,
	`default_water_weight` real DEFAULT 0 NOT NULL,
	`steps` text NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_brew_preset`("id", "user_id", "name", "description", "default_bean_weight", "default_water_temp", "default_water_weight", "steps", "created", "updated") SELECT "id", "user_id", "name", "description", "default_bean_weight", "default_water_temp", COALESCE("default_water_weight", 0), "steps", "created", "updated" FROM `brew_preset`;--> statement-breakpoint
DROP TABLE `brew_preset`;--> statement-breakpoint
ALTER TABLE `__new_brew_preset` RENAME TO `brew_preset`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
