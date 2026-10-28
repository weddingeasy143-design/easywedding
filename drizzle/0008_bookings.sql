CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`vendor_name` text NOT NULL,
	`phone` text,
	`category` text NOT NULL DEFAULT 'other',
	`event_date` text,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bookings_user` ON `bookings` (`user_id`);
--> statement-breakpoint
CREATE TABLE `booking_items` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`service` text NOT NULL,
	`amount_paise` integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX `idx_booking_items_booking` ON `booking_items` (`booking_id`);
--> statement-breakpoint
CREATE TABLE `booking_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`amount_paise` integer NOT NULL,
	`paid_on` text NOT NULL,
	`mode` text,
	`note` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_booking_payments_booking` ON `booking_payments` (`booking_id`);
