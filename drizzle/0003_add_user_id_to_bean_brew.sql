ALTER TABLE `bean` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `brew` ADD `user_id` text REFERENCES user(id);
