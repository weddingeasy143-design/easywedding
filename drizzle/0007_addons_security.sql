-- Add-on prices (design_id keys are 'addon-*'; regular = launch, no fake discount)
INSERT OR IGNORE INTO prices(design_id,regular_paise,launch_paise,launch_active) VALUES('addon-personal',19900,19900,0);
INSERT OR IGNORE INTO prices(design_id,regular_paise,launch_paise,launch_active) VALUES('addon-language-hi',14900,14900,0);
INSERT OR IGNORE INTO prices(design_id,regular_paise,launch_paise,launch_active) VALUES('addon-pdf',14900,14900,0);
INSERT OR IGNORE INTO prices(design_id,regular_paise,launch_paise,launch_active) VALUES('addon-gallery',9900,9900,0);
INSERT OR IGNORE INTO prices(design_id,regular_paise,launch_paise,launch_active) VALUES('addon-shortlink',9900,9900,0);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS personal_guests(
 id TEXT PRIMARY KEY,
 invitation_id TEXT NOT NULL,
 owner TEXT NOT NULL,
 name TEXT NOT NULL,
 phone TEXT,
 token TEXT NOT NULL UNIQUE,
 viewed_at TEXT,
 rsvped_at TEXT,
 created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_personal_guests_owner ON personal_guests(owner);
CREATE INDEX IF NOT EXISTS idx_personal_guests_invitation ON personal_guests(invitation_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS short_links(
 slug TEXT PRIMARY KEY,
 invitation_id TEXT NOT NULL,
 owner TEXT NOT NULL,
 created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_short_links_owner ON short_links(owner);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS rate_limits(
 bucket TEXT PRIMARY KEY,
 count INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
