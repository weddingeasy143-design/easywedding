-- Security pass + vendor identity (2026-11): random vendor codes, the
-- vendor agreement snapshot, album share PINs, real reviews, the boss
-- audit log and boss two-step login challenges.
ALTER TABLE vendors ADD COLUMN vendor_code TEXT;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS vendors_vendor_code_idx ON vendors(vendor_code);
--> statement-breakpoint
ALTER TABLE vendors ADD COLUMN agreement_accepted_at TEXT;
--> statement-breakpoint
ALTER TABLE vendors ADD COLUMN agreement_version TEXT;
--> statement-breakpoint
ALTER TABLE vendors ADD COLUMN agreement_text TEXT;
--> statement-breakpoint
ALTER TABLE albums ADD COLUMN share_pin_hash TEXT;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS vendor_reviews (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE,
  vendor_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  stars INTEGER NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vendor_reviews_vendor_idx ON vendor_reviews(vendor_id, hidden);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS admin_audit (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS admin_login_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
