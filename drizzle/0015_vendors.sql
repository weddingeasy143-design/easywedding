CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`business_name` text NOT NULL,
	`owner_name` text NOT NULL,
	`category` text NOT NULL,
	`city` text NOT NULL,
	`phone` text NOT NULL,
	`whatsapp` text NOT NULL,
	`email` text NOT NULL,
	`starting_price_paise` integer NOT NULL DEFAULT 0,
	`about` text,
	`payout_holder` text,
	`payout_account` text,
	`payout_ifsc` text,
	`payout_upi` text,
	`payout_pan` text,
	`status` text NOT NULL DEFAULT 'pending',
	`status_reason` text,
	`verified` integer NOT NULL DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vendors_user` ON `vendors` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_vendors_status` ON `vendors` (`status`);
--> statement-breakpoint
CREATE TABLE `vendor_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`position` integer NOT NULL DEFAULT 0,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_vendor_photos_vendor` ON `vendor_photos` (`vendor_id`);
--> statement-breakpoint
CREATE TABLE `vendor_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`customer_name` text,
	`event_date` text,
	`event_type` text,
	`city` text,
	`phone` text NOT NULL,
	`message` text,
	`budget_paise` integer,
	`status` text NOT NULL DEFAULT 'requested',
	`settlement_mode` text NOT NULL DEFAULT 'manual',
	`final_paise` integer,
	`commission_percent` real,
	`commission_paise` integer,
	`net_paise` integer,
	`payout_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_vendor_bookings_vendor` ON `vendor_bookings` (`vendor_id`);
--> statement-breakpoint
CREATE INDEX `idx_vendor_bookings_customer` ON `vendor_bookings` (`customer_id`);
--> statement-breakpoint
CREATE TABLE `vendor_payouts` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`kind` text NOT NULL DEFAULT 'vendor_payout',
	`amount_paise` integer NOT NULL,
	`reference` text,
	`booking_count` integer NOT NULL DEFAULT 0,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_vendor_payouts_vendor` ON `vendor_payouts` (`vendor_id`);
--> statement-breakpoint
INSERT OR IGNORE INTO `site_settings` (`key`,`value`) VALUES ('vendor_commission','{"percent":10}');
--> statement-breakpoint
INSERT OR IGNORE INTO `site_settings` (`key`,`value`) VALUES ('vendor_categories','[{"id":"photographer","label":"Photographer"},{"id":"videographer","label":"Videographer"},{"id":"makeup","label":"Makeup Artist"},{"id":"mehndi","label":"Mehndi Artist"},{"id":"decorator","label":"Decorator"},{"id":"caterer","label":"Caterer"},{"id":"dj","label":"DJ & Music"},{"id":"venue","label":"Wedding Venue"},{"id":"pandit","label":"Pandit"},{"id":"car","label":"Car Rental"}]');
