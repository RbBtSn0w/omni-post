/**
 * Cookie route test.
 * Mirrors: apps/backend/tests/test_cookie.py
 */

import Database from 'better-sqlite3';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupTempDb, createTempDb } from './setup.js';

let db: Database.Database;
let dbPath: string;
let tmpCookieDir: string;

vi.mock('../src/db/database.js', () => ({
    dbManager: {
        getDb: () => db,
        getDbPath: () => dbPath,
        getDataDir: () => '/tmp',
    },
}));

vi.mock('../src/core/config.js', () => ({
    COOKIES_DIR: tmpCookieDir || '/tmp/test-cookies',
    VIDEOS_DIR: '/tmp',
    BASE_DIR: '/tmp',
    ROOT_DIR: '/tmp',
    DATA_DIR: '/tmp',
    LOGS_DIR: '/tmp',
    HOST: '0.0.0.0',
    PORT: 5409,
    MAX_UPLOAD_SIZE: 500 * 1024 * 1024,
    LOCAL_CHROME_PATH: '',
    DEBUG_MODE: false,
}));

const { router } = await import('../src/routes/cookie.js');

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api', router);
    return app;
}

describe('Cookie Route', () => {
    beforeEach(() => {
        ({ db, dbPath } = createTempDb());
        tmpCookieDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-cookies-'));
    });

    afterEach(() => {
        cleanupTempDb(dbPath, db);
        try { fs.rmSync(tmpCookieDir, { recursive: true }); } catch { }
    });

    it('POST /api/uploadCookie should fail without file', async () => {
        const app = createTestApp();
        const res = await request(app).post('/api/uploadCookie').send({});
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/uploadCookie should fail without params', async () => {
        const app = createTestApp();
        const res = await request(app)
            .post('/api/uploadCookie')
            .field('id', '1');
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('GET /api/downloadCookie should fail without filePath', async () => {
        const app = createTestApp();
        const res = await request(app).get('/api/downloadCookie');
        expect(res.status).toBe(400);
    });

    it('GET /api/downloadCookie should fail for non-existent file', async () => {
        const app = createTestApp();
        const res = await request(app).get('/api/downloadCookie?filePath=nonexistent.json');
        expect(res.status).toBe(404);
    });
});
