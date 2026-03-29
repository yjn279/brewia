ALTER TABLE `bean` ALTER COLUMN "region" TO "region" text;--> statement-breakpoint
ALTER TABLE `bean` ALTER COLUMN "farm" TO "farm" text;--> statement-breakpoint
ALTER TABLE `bean` ALTER COLUMN "process" TO "process" text;--> statement-breakpoint
ALTER TABLE `bean` ALTER COLUMN "variety" TO "variety" text;--> statement-breakpoint
ALTER TABLE `bean` ALTER COLUMN "roaster" TO "roaster" text;--> statement-breakpoint
ALTER TABLE `bean` ALTER COLUMN "notes" TO "notes" text;--> statement-breakpoint
ALTER TABLE `brew` ALTER COLUMN "bean_grind" TO "bean_grind" real;--> statement-breakpoint
ALTER TABLE `brew` ALTER COLUMN "water_temp" TO "water_temp" real;--> statement-breakpoint
ALTER TABLE `brew` ALTER COLUMN "notes" TO "notes" text;