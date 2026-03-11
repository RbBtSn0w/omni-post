/**
 * Database migrations (table creation) for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/db/createTable.py
 *
 * SQL statements are identical to the Python version.
 */

import { logger } from '../core/logger.js';
import { dbManager } from './database.js';

/**
 * Create all required tables if they don't exist.
 */
export function createTables(): void {
  const db = dbManager.getDb();

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_validated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, userName),
      FOREIGN KEY (group_id) REFERENCES account_groups(id)
    )
  `);

  // Ensure last_validated_at column exists for existing databases
  try {
    const tableInfo = db.prepare("PRAGMA table_info(user_info)").all() as any[];
    const columnExists = tableInfo.some(col => col.name === 'last_validated_at');
    if (!columnExists) {
      db.exec("ALTER TABLE user_info ADD COLUMN last_validated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
      logger.info('Added last_validated_at column to user_info table.');
    }
  } catch (error: any) {
    logger.error(`Error checking/adding last_validated_at column: ${error.message}`);
  }

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
      error_msg TEXT,
      publish_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// If run directly, create tables
if (process.argv[1]?.includes('migrations')) {
  createTables();
  logger.info('✅ Database tables created successfully.');
  dbManager.close();
}
