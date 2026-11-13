import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { tags as tagRegistry } from '../data/tags';
import initSql from './migrations/001_init.sql?raw';
import adminSql from './migrations/002_admin.sql?raw';
import versionsSql from './migrations/003_versions.sql?raw';

export const DEFAULT_DB_PATH = '.data/blog.db';
export const SCHEMA_VERSION = 3;

const MIGRATIONS = [
  { version: 1, sql: initSql },
  { version: 2, sql: adminSql },
  { version: 3, sql: versionsSql },
];

let singleton: DatabaseSync | undefined;

function appliedVersions(db: DatabaseSync): number[] {
  const rows = db
    .prepare('SELECT version FROM schema_migrations ORDER BY version')
    .all() as Array<{ version: number }>;

  return rows.map((row) => row.version);
}

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = new Set(appliedVersions(db));

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;

    db.exec('BEGIN');

    try {
      db.exec(migration.sql);
      db.prepare(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
      ).run(migration.version, new Date().toISOString());
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

function seedTags(db: DatabaseSync): void {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO tags (slug, name, description)
     VALUES (?, ?, ?)`,
  );

  for (const tag of tagRegistry) {
    insert.run(tag.slug, tag.name, tag.description);
  }
}

export function openDb(path = process.env.BLOG_DB_PATH ?? DEFAULT_DB_PATH): DatabaseSync {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }

  const db = new DatabaseSync(path);

  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');

  runMigrations(db);
  seedTags(db);

  return db;
}

export function getDb(): DatabaseSync {
  singleton ??= openDb();
  return singleton;
}

export function schemaVersion(db: DatabaseSync = getDb()): number {
  const row = db
    .prepare('SELECT MAX(version) AS version FROM schema_migrations')
    .get() as { version: number | null } | undefined;

  return row?.version ?? 0;
}
