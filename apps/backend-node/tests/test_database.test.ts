/**
 * Database operations test.
 * Mirrors: apps/backend/tests/test_database.py
 */

import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanupTempDb, createTempDb } from './setup.js';

describe('Database', () => {
    let db: Database.Database;
    let dbPath: string;

    beforeEach(() => {
        ({ db, dbPath } = createTempDb());
    });

    afterEach(() => {
        cleanupTempDb(dbPath, db);
    });

    it('should create all required tables', () => {
        const tables = db
            .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            .all()
            .map((row: any) => row.name);

        expect(tables).toContain('user_info');
        expect(tables).toContain('file_records');
        expect(tables).toContain('account_groups');
        expect(tables).toContain('tasks');
    });

    it('should have correct user_info table structure', () => {
        const columns = db.prepare('PRAGMA table_info(user_info)').all().map((c: any) => c.name);
        const expected = ['id', 'type', 'filePath', 'userName', 'status'];
        for (const col of expected) {
            expect(columns).toContain(col);
        }
    });

    it('should have correct file_records table structure', () => {
        const columns = db.prepare('PRAGMA table_info(file_records)').all().map((c: any) => c.name);
        const expected = ['id', 'filename', 'filesize', 'upload_time', 'file_path'];
        for (const col of expected) {
            expect(columns).toContain(col);
        }
    });

    it('should write and read data correctly', () => {
        db.prepare('INSERT INTO user_info (userName, type, filePath, status) VALUES (?, ?, ?, ?)')
            .run('test_user', 1, '/test/path', 0);

        const row = db.prepare('SELECT * FROM user_info WHERE userName = ?').get('test_user') as any;
        expect(row).not.toBeNull();
        expect(row.userName).toBe('test_user');
        expect(row.type).toBe(1);
        expect(row.filePath).toBe('/test/path');

        // Cleanup
        db.prepare('DELETE FROM user_info WHERE userName = ?').run('test_user');
    });

    it('should support creating tables in a new database', () => {
        const { db: db2, dbPath: dbPath2 } = createTempDb();
        const tables = db2
            .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            .all()
            .map((row: any) => row.name);

        expect(tables).toContain('user_info');
        expect(tables).toContain('file_records');
        cleanupTempDb(dbPath2, db2);
    });

    it('should handle concurrent connections', () => {
        const db2 = new Database(dbPath);

        db.prepare('INSERT INTO user_info (userName, type, filePath, status) VALUES (?, ?, ?, ?)')
            .run('isolation_test', 1, '/test/path', 0);

        const row = db2.prepare('SELECT * FROM user_info WHERE userName = ?').get('isolation_test') as any;
        expect(row).not.toBeNull();

        db.prepare('DELETE FROM user_info WHERE userName = ?').run('isolation_test');
        db2.close();
    });
});
