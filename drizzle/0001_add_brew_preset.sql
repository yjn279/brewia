CREATE TABLE `brew_preset` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`default_bean_weight` real,
	`default_water_temp` real,
	`steps` text NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
