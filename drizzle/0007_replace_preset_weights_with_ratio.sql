PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_brew_preset` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`brew_ratio` real DEFAULT 0 NOT NULL,
	`steps` text NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_brew_preset`("id", "user_id", "name", "description", "brew_ratio", "steps", "created", "updated") SELECT "id", "user_id", "name", "description", CASE WHEN "default_bean_weight" > 0 AND "default_water_weight" > 0 THEN "default_water_weight" / "default_bean_weight" ELSE 0 END, "steps", "created", "updated" FROM `brew_preset`;--> statement-breakpoint
DROP TABLE `brew_preset`;--> statement-breakpoint
ALTER TABLE `__new_brew_preset` RENAME TO `brew_preset`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
