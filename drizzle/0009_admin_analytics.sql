CREATE TABLE `visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ts` text NOT NULL,
	`day` text NOT NULL,
	`hour` integer NOT NULL,
	`path` text NOT NULL,
	`source` text NOT NULL,
	`ref_host` text,
	`device` text NOT NULL,
	`country` text,
	`visitor` text NOT NULL,
	`session_start` integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX `idx_visits_day` ON `visits` (`day`);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`code` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`value` integer NOT NULL,
	`max_uses` integer NOT NULL DEFAULT 0,
	`used` integer NOT NULL DEFAULT 0,
	`expires_on` text,
	`active` integer NOT NULL DEFAULT 1,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `coupon` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `discount_paise` integer NOT NULL DEFAULT 0;
