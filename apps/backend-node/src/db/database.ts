/**
 * Database manager for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/db/db_manager.py
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { DATA_DIR } from '../core/config.js';

/**
 * Database file path manager.
 * Centralizes database file path management.
 */
class DatabaseManager {
    public readonly dataDir: string;
    public readonly dbFile: string;
    private _db: Database.Database | null = null;

    constructor() {
        this.dataDir = DATA_DIR;
        this.dbFile = path.join(this.dataDir, 'database.db');
        this._initialize();
    }

    private _initialize(): void {
        fs.mkdirSync(this.dataDir, { recursive: true });
    }

    /**
     * Get the absolute path to the database file.
     */
    getDbPath(): string {
        return this.dbFile;
    }

    /**
     * Get the absolute path to the data directory.
     */
    getDataDir(): string {
        return this.dataDir;
    }

    /**
     * Get a database connection (singleton).
     * Creates the database file if it doesn't exist.
     */
    getDb(): Database.Database {
        if (!this._db) {
            this._db = new Database(this.dbFile);
            // Enable WAL mode for better concurrency
            this._db.pragma('journal_mode = WAL');
            // Enable foreign keys
            this._db.pragma('foreign_keys = ON');
        }
        return this._db;
    }

    /**
     * Close the database connection.
     */
    close(): void {
        if (this._db) {
            this._db.close();
            this._db = null;
        }
    }
}

// Global singleton instance
export const dbManager = new DatabaseManager();
