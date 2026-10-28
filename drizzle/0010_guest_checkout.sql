ALTER TABLE `orders` ADD COLUMN `signup_name` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `signup_email` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `signup_hash` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `claimed` integer NOT NULL DEFAULT 0;
