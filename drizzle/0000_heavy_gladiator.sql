CREATE TABLE `bean` (
	`id` text PRIMARY KEY NOT NULL,
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
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `brew_flavor` (
	`id` text PRIMARY KEY NOT NULL,
	`brew_id` text NOT NULL,
	`flavor_id` text NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`brew_id`) REFERENCES `brew`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`flavor_id`) REFERENCES `flavor`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `brew` (
	`id` text PRIMARY KEY NOT NULL,
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
	FOREIGN KEY (`bean_id`) REFERENCES `bean`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `flavor` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`subcategory` text NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
