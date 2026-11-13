CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  body_md TEXT NOT NULL,
  html TEXT NOT NULL,
  headings_json TEXT NOT NULL DEFAULT '[]',
  tags_json TEXT NOT NULL DEFAULT '[]',
  series_name TEXT,
  series_order INTEGER,
  draft INTEGER NOT NULL DEFAULT 1,
  pub_date TEXT NOT NULL,
  updated_date TEXT,
  canonical TEXT,
  cover_path TEXT,
  cover_alt TEXT,
  og_path TEXT,
  reading_minutes INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  slug TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_slug TEXT NOT NULL REFERENCES tags(slug),
  PRIMARY KEY (post_id, tag_slug)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS posts_published
  ON posts(draft, pub_date DESC);

CREATE INDEX IF NOT EXISTS posts_updated
  ON posts(updated_at DESC);

CREATE INDEX IF NOT EXISTS posts_deleted
  ON posts(deleted_at);

CREATE INDEX IF NOT EXISTS posts_series
  ON posts(series_name, series_order);

CREATE UNIQUE INDEX IF NOT EXISTS posts_series_order
  ON posts(series_name, series_order)
  WHERE series_name IS NOT NULL AND deleted_at IS NULL;
