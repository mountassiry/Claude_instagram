/**
 * Local SQLite database — all data stays on the device.
 * No data is ever written to any cloud service.
 *
 * Uses expo-sqlite v13 synchronous API (openDatabaseSync).
 */
import * as SQLite from 'expo-sqlite';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

const db = SQLite.openDatabaseSync('nexus_p2p.db');

/** Run a SELECT and return all matching rows (Promise wrapper over sync API). */
export function query<T extends Row = Row>(
  sql: string,
  args: SQLite.SQLiteBindValue[] = [],
): Promise<T[]> {
  return Promise.resolve(db.getAllSync<T>(sql, args));
}

/** Run a SELECT and return the first row (or null). */
export function queryFirst<T extends Row = Row>(
  sql: string,
  args: SQLite.SQLiteBindValue[] = [],
): Promise<T | null> {
  return Promise.resolve(db.getFirstSync<T>(sql, args) ?? null);
}

/** Run an INSERT / UPDATE / DELETE. */
export function mutate(
  sql: string,
  args: SQLite.SQLiteBindValue[] = [],
): Promise<SQLite.SQLiteRunResult> {
  return Promise.resolve(db.runSync(sql, args));
}

/** Run multiple SQL statements as a batch. */
export function runTransaction(statements: { sql: string; args?: SQLite.SQLiteBindValue[] }[]): Promise<void> {
  db.withTransactionSync(() => {
    for (const { sql, args = [] } of statements) {
      db.runSync(sql, args);
    }
  });
  return Promise.resolve();
}

/** Create all tables on first launch. Safe to call every startup (IF NOT EXISTS). */
export function initDatabase(): Promise<void> {
  db.withTransactionSync(() => {
    // My own profile (always 1 row, id = 'me')
    db.execSync(`
      CREATE TABLE IF NOT EXISTS profile (
        id TEXT PRIMARY KEY DEFAULT 'me',
        peer_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        bio TEXT DEFAULT '',
        avatar_uri TEXT,
        signing_public_key TEXT NOT NULL,
        encryption_public_key TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    // Contacts — other users we've scanned / been scanned by
    db.execSync(`
      CREATE TABLE IF NOT EXISTS contacts (
        peer_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        bio TEXT DEFAULT '',
        avatar_uri TEXT,
        signing_public_key TEXT NOT NULL,
        encryption_public_key TEXT NOT NULL,
        added_at INTEGER NOT NULL,
        last_seen INTEGER
      )
    `);

    // Conversations (direct or group)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'direct',
        name TEXT,
        participant_ids TEXT NOT NULL,
        last_message_text TEXT,
        last_message_at INTEGER,
        unread_count INTEGER NOT NULL DEFAULT 0,
        is_archived INTEGER NOT NULL DEFAULT 0,
        is_pinned INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `);

    // Messages
    db.execSync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text',
        text TEXT,
        media_uri TEXT,
        mime_type TEXT,
        status TEXT NOT NULL DEFAULT 'sending',
        created_at INTEGER NOT NULL
      )
    `);

    // Feed posts (own + received from contacts)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'photo',
        caption TEXT DEFAULT '',
        media_uris TEXT NOT NULL DEFAULT '[]',
        likes_count INTEGER NOT NULL DEFAULT 0,
        comments_count INTEGER NOT NULL DEFAULT 0,
        is_liked INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `);

    // Post comments
    db.execSync(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    // Post likes (local tracking)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id TEXT NOT NULL,
        peer_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (post_id, peer_id)
      )
    `);

    // Outgoing message queue for when peers are offline
    db.execSync(`
      CREATE TABLE IF NOT EXISTS pending_outbox (
        id TEXT PRIMARY KEY,
        recipient_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0
      )
    `);
  });
  return Promise.resolve();
}
