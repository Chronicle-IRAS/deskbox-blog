ALTER TABLE sessions ADD COLUMN csrf_token TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS sessions_expires
  ON sessions(expires_at);
