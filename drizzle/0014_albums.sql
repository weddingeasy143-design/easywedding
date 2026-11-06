CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`partner1` text,
	`partner2` text,
	`wedding_date` text,
	`storage` text NOT NULL DEFAULT 'draft',
	`expires_at` text,
	`is_public` integer NOT NULL DEFAULT 0,
	`share_token` text,
	`storage_order_id` text,
	`storage_price_paise` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_albums_user` ON `albums` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_albums_share_token` ON `albums` (`share_token`);
--> statement-breakpoint
CREATE TABLE `album_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`album_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`position` integer NOT NULL DEFAULT 0,
	`caption` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_album_photos_album` ON `album_photos` (`album_id`);
--> statement-breakpoint
ALTER TABLE `orders` ADD COLUMN `ref_id` text;
--> statement-breakpoint
INSERT OR IGNORE INTO `site_settings` (`key`,`value`) VALUES ('album_storage','{"price_paise":49900,"draft_days":7}');
