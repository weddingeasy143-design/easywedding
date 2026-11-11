-- Visitor Intelligence (2026-11): first-party, anonymous visitor analytics.
-- One row per visitor (random first-party cookie id; a light device
-- fingerprint hash only re-links a visitor whose cookie was cleared).
-- The raw IP is NEVER stored — only a SHA-256 hash. Behaviour events feed
-- a simple lead score (hot >= 60). Bots/datacenter traffic is flagged and
-- kept out of the boss headline counts. orders.visitor_id attributes a
-- purchase to the visitor (and therefore to its first source).
CREATE TABLE IF NOT EXISTS vi_visitors (
  vid TEXT PRIMARY KEY,
  fp TEXT,
  ip_hash TEXT,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  visits INTEGER NOT NULL DEFAULT 1,
  last_session TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  asn INTEGER,
  network TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  screen TEXT,
  timezone TEXT,
  language TEXT,
  first_source TEXT NOT NULL DEFAULT 'direct',
  last_source TEXT NOT NULL DEFAULT 'direct',
  first_touch TEXT,
  last_touch TEXT,
  interest TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  is_bot INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vi_visitors_last_seen_idx ON vi_visitors(last_seen);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vi_visitors_score_idx ON vi_visitors(score);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vi_visitors_fp_idx ON vi_visitors(fp);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS vi_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vid TEXT NOT NULL,
  type TEXT NOT NULL,
  path TEXT,
  template TEXT,
  detail TEXT,
  ts TEXT NOT NULL,
  day TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vi_events_vid_idx ON vi_events(vid, ts);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vi_events_day_idx ON vi_events(day, type);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vi_events_template_idx ON vi_events(template);
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN visitor_id TEXT;
