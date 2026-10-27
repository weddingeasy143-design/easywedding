CREATE TABLE `invitation_owners` (
	`invitation_id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`partner1` text,
	`partner2` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_invitation_owners_owner` ON `invitation_owners` (`owner`);
--> statement-breakpoint
CREATE TABLE `rsvps` (
	`id` text PRIMARY KEY NOT NULL,
	`invitation_id` text NOT NULL,
	`name` text NOT NULL,
	`attendance` text NOT NULL,
	`guests` integer NOT NULL DEFAULT 1,
	`message` text,
	`song` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rsvps_invitation` ON `rsvps` (`invitation_id`);
