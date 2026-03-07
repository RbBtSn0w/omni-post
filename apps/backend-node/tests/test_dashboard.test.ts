/**
 * Dashboard route test.
 * Mirrors: apps/backend/tests/test_dashboard.py
 */

import Database from 'better-sqlite3';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupTempDb, createTempDb } from './setup.js';

let db: Database.Database;
let dbPath: string;

vi.mock('../src/db/database.js', () => ({
    dbManager: {
        getDb: () => db,
        getDbPath: () => dbPath,
        getDataDir: () => '/tmp',
    },
}));

const { router } = await import('../src/routes/dashboard.js');

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api', router);
    return app;
}

describe('Dashboard Route', () => {
    beforeEach(() => {
        ({ db, dbPath } = createTempDb());
    });

    afterEach(() => {
        cleanupTempDb(dbPath, db);
    });

    it('GET /api/getDashboardStats should return stats', async () => {
        const app = createTestApp();
        const res = await request(app).get('/api/getDashboardStats');
        expect(res.status).toBe(200);
        expect(res.body.code).toBe(200);
        expect(res.body.data).toHaveProperty('accountStats');
        expect(res.body.data).toHaveProperty('taskStats');
        expect(res.body.data).toHaveProperty('contentStats');
    });

    it('should return correct counts with data', async () => {
        // Insert test data
        db.prepare('INSERT INTO user_info (type, filePath, userName, status) VALUES (?, ?, ?, ?)')
            .run(1, 'test.json', 'user1', 1);
        db.prepare('INSERT INTO file_records (filename, filesize, file_path) VALUES (?, ?, ?)')
            .run('video.mp4', 10.5, '/videos/video.mp4');

        const app = createTestApp();
        const res = await request(app).get('/api/getDashboardStats');
        expect(res.body.data.accountStats.total).toBe(1);
        expect(res.body.data.contentStats.total).toBe(1);
    });
});
