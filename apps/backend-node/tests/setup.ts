/**
 * Test setup for omni-post backend (Node.js).
 * Mirrors: apps/backend/tests/conftest.py
 *
 * Provides test database fixtures and Express app test client.
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Create all database tables (mirrors conftest._create_database_tables)
 */
export function createTestTables(db: Database.Database): void {
    db.exec(`
    CREATE TABLE IF NOT EXISTS account_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS user_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type INTEGER NOT NULL,
      filePath TEXT NOT NULL,
      userName TEXT NOT NULL,
      status INTEGER DEFAULT 0,
      group_id INTEGER,
      created_at DATETIME,
      last_validated_at DATETIME,
      UNIQUE(type, userName),
      FOREIGN KEY (group_id) REFERENCES account_groups(id)
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS file_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      filesize REAL,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      file_path TEXT
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT,
      status TEXT DEFAULT 'waiting',
      progress REAL DEFAULT 0,
      priority INTEGER DEFAULT 1,
      platforms TEXT,
      file_list TEXT,
      account_list TEXT,
      schedule_data TEXT,
      publish_data TEXT,
      error_msg TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Create a temporary test database.
 * Returns path to temp DB file and the database instance.
 */
export function createTempDb(): { dbPath: string; db: Database.Database } {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omnipost-test-'));
    const dbPath = path.join(tmpDir, 'test.db');
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    createTestTables(db);
    return { dbPath, db };
}

/**
 * Clean up a temporary database.
 */
export function cleanupTempDb(dbPath: string, db: Database.Database): void {
    try {
        db.close();
    } catch { /* already closed */ }
    try {
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        const dir = path.dirname(dbPath);
        if (fs.existsSync(dir)) fs.rmdirSync(dir);
    } catch { /* ignore cleanup errors */ }
}
