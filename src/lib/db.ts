/**
 * The app's own database: one SQLite file per app, outside the source tree.
 *
 * Use it for data the app itself creates (bookings, notes, settings, states).
 * Data from Sesame is NOT stored here — read it through `@/lib/sesame`.
 *
 * Server-only: import it from Server Components, Server Actions and route
 * handlers, never from a Client Component.
 *
 * Schema changes are SQL files in `db/migrations/` (`0001_create_bookings.sql`,
 * `0002_add_room_color.sql`, ...), applied in name order, each once. Never edit
 * or delete one that already ran: add a new file instead. The database file is
 * not part of the app's version history, so restoring an older version of the
 * code leaves the data — and the applied migrations — where they are.
 */
import { chmodSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const DATABASE_PATH = process.env.DATABASE_PATH ?? '/data/app.db'
const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations')
const MIGRATIONS_TABLE = '_migrations'
const BUSY_TIMEOUT_MS = 5000
const IS_DEV = process.env.NODE_ENV !== 'production'
// Group-writable: the app and the Studio agent share the file through their group.
const DATABASE_FILE_MODE = 0o664

// Survives hot reload in development: one connection per server process.
const holder = globalThis as unknown as { __appDatabase?: DatabaseSync }

/** The app's database connection, with every pending migration applied. */
export function db(): DatabaseSync {
  let connection = holder.__appDatabase
  if (!connection) {
    prepareDatabaseFile()
    connection = new DatabaseSync(DATABASE_PATH)
    connection.exec(
      `PRAGMA journal_mode = WAL; PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS}; PRAGMA foreign_keys = ON;`,
    )
    applyMigrations(connection)
    holder.__appDatabase = connection
  } else if (IS_DEV) {
    // The agent adds migrations while the dev server runs: pick them up.
    applyMigrations(connection)
  }
  return connection
}

/** Run `work` atomically: every write inside commits together or not at all. */
export function transaction<T>(work: (connection: DatabaseSync) => T): T {
  const connection = db()
  connection.exec('BEGIN IMMEDIATE')
  try {
    const result = work(connection)
    connection.exec('COMMIT')
    return result
  } catch (error) {
    connection.exec('ROLLBACK')
    throw error
  }
}

// SQLite gives its -wal and -shm files the database file's own mode, so creating
// that file group-writable up front makes all three writable by the group. An
// empty file is a valid empty database.
function prepareDatabaseFile(): void {
  mkdirSync(path.dirname(DATABASE_PATH), { recursive: true })
  try {
    writeFileSync(DATABASE_PATH, '', { flag: 'wx', mode: DATABASE_FILE_MODE })
  } catch {
    // Already there.
  }
  try {
    chmodSync(DATABASE_PATH, DATABASE_FILE_MODE)
  } catch {
    // Not ours to change (another user created it): leave it as it is.
  }
}

function applyMigrations(connection: DatabaseSync): void {
  connection.exec(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`,
  )
  const applied = new Set(
    connection
      .prepare(`SELECT name FROM ${MIGRATIONS_TABLE}`)
      .all()
      .map((row) => String(row.name)),
  )
  for (const name of pendingMigrations(applied)) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8')
    connection.exec('BEGIN IMMEDIATE')
    try {
      connection.exec(sql)
      connection
        .prepare(`INSERT INTO ${MIGRATIONS_TABLE} (name, applied_at) VALUES (?, ?)`)
        .run(name, new Date().toISOString())
      connection.exec('COMMIT')
    } catch (error) {
      connection.exec('ROLLBACK')
      throw new Error(`Migration ${name} failed: ${(error as Error).message}`)
    }
  }
}

function pendingMigrations(applied: Set<string>): string[] {
  let names: string[]
  try {
    names = readdirSync(MIGRATIONS_DIR)
  } catch {
    return [] // No migrations folder yet: the app has no tables of its own.
  }
  return names.filter((name) => name.endsWith('.sql') && !applied.has(name)).sort()
}
