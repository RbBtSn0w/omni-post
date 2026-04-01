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
    CREATE TABLE IF NOT EXISTS browser_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      browser_type TEXT NOT NULL DEFAULT 'chrome',
      user_data_dir TEXT NOT NULL,
      profile_name TEXT NOT NULL DEFAULT 'Default',
      is_default INTEGER DEFAULT 0,
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
      session_source TEXT DEFAULT 'managed',
      browser_profile_id TEXT,
      credentials TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_validated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, userName),
      FOREIGN KEY (group_id) REFERENCES account_groups(id),
      FOREIGN KEY (browser_profile_id) REFERENCES browser_profiles(id)
    )
  `);

  // Ensure columns exist for user_info
  try {
    const tableInfo = db.prepare("PRAGMA table_info(user_info)").all() as any[];
    if (!tableInfo.some(col => col.name === 'last_validated_at')) {
      db.exec("ALTER TABLE user_info ADD COLUMN last_validated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    }
    if (!tableInfo.some(col => col.name === 'session_source')) {
      db.exec("ALTER TABLE user_info ADD COLUMN session_source TEXT DEFAULT 'managed'");
    }
    if (!tableInfo.some(col => col.name === 'browser_profile_id')) {
      db.exec("ALTER TABLE user_info ADD COLUMN browser_profile_id TEXT");
    }
    if (!tableInfo.some(col => col.name === 'credentials')) {
      db.exec("ALTER TABLE user_info ADD COLUMN credentials TEXT");
    }
  } catch (error: any) {
    logger.error(`Error updating user_info table: ${error.message}`);
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
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      cover_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT,
      status TEXT DEFAULT 'waiting',
      progress REAL DEFAULT 0,
      priority INTEGER DEFAULT 1,
      content_type TEXT DEFAULT 'video',
      content_id TEXT,
      platforms TEXT,
      file_list TEXT,
      account_list TEXT,
      browser_profile_id TEXT,
      schedule_data TEXT,
      error_msg TEXT,
      publish_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (browser_profile_id) REFERENCES browser_profiles(id)
    )
  `);

  // Ensure columns exist for tasks
  try {
    const tableInfo = db.prepare("PRAGMA table_info(tasks)").all() as any[];
    if (!tableInfo.some(col => col.name === 'content_type')) {
      db.exec("ALTER TABLE tasks ADD COLUMN content_type TEXT DEFAULT 'video'");
    }
    if (!tableInfo.some(col => col.name === 'content_id')) {
      db.exec("ALTER TABLE tasks ADD COLUMN content_id TEXT");
    }
    if (!tableInfo.some(col => col.name === 'browser_profile_id')) {
      db.exec("ALTER TABLE tasks ADD COLUMN browser_profile_id TEXT");
    }
  } catch (error: any) {
    logger.error(`Error updating tasks table: ${error.message}`);
  }

  // Create system_extensions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_extensions (
      id TEXT PRIMARY KEY,
      platform_id INTEGER,
      name TEXT NOT NULL,
      manifest TEXT NOT NULL,
      executable TEXT NOT NULL,
      source_type TEXT NOT NULL,
      last_synced DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// If run directly, create tables
if (process.argv[1]?.includes('migrations')) {
  createTables();
  logger.info('✅ Database tables created successfully.');
  dbManager.close();
}
