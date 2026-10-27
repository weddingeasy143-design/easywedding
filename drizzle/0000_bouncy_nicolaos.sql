CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_assets_owner` ON `assets` (`owner`);--> statement-breakpoint
CREATE TABLE `studio_drafts` (
	`owner` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`owner` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
