CREATE TABLE `prices` (
	`design_id` text PRIMARY KEY NOT NULL,
	`regular_paise` integer NOT NULL,
	`launch_paise` integer NOT NULL,
	`launch_active` integer NOT NULL DEFAULT 1
);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('premium-original',99900,79900,1);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('royal-prestige',69900,59900,1);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('mehndi',69900,59900,1);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('midnight-noor',69900,59900,1);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('haldi',69900,59900,1);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('ivory-arch',49900,39900,1);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('garden',49900,39900,1);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('sangeet',49900,39900,1);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('reception',49900,39900,1);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('blush-mehraab',49900,39900,1);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('emerald-darbar',49900,39900,1);
--> statement-breakpoint
INSERT INTO `prices` (`design_id`,`regular_paise`,`launch_paise`,`launch_active`) VALUES ('ALL',149900,119900,1);
--> statement-breakpoint
CREATE TABLE `payment_settings` (
	`gateway` text PRIMARY KEY NOT NULL,
	`enabled` integer NOT NULL DEFAULT 0,
	`mode` text NOT NULL DEFAULT 'test',
	`key_id` text,
	`key_secret` text,
	`extra` text
);
--> statement-breakpoint
INSERT INTO `payment_settings` (`gateway`,`enabled`,`mode`) VALUES ('razorpay',0,'test');
--> statement-breakpoint
INSERT INTO `payment_settings` (`gateway`,`enabled`,`mode`) VALUES ('cashfree',0,'test');
--> statement-breakpoint
INSERT INTO `payment_settings` (`gateway`,`enabled`,`mode`) VALUES ('phonepe',0,'test');
--> statement-breakpoint
INSERT INTO `payment_settings` (`gateway`,`enabled`,`mode`) VALUES ('payu',0,'test');
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`design_id` text NOT NULL,
	`amount_paise` integer NOT NULL,
	`gateway` text NOT NULL,
	`gateway_order_id` text,
	`gateway_payment_id` text,
	`status` text NOT NULL DEFAULT 'created',
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_orders_user` ON `orders` (`user_id`);
--> statement-breakpoint
CREATE TABLE `entitlements` (
	`user_id` text NOT NULL,
	`design_id` text NOT NULL,
	`order_id` text,
	`granted_at` text NOT NULL,
	PRIMARY KEY(`user_id`,`design_id`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
INSERT INTO `site_settings` (`key`,`value`) VALUES ('admin_email','chandan1692@gmail.com');
