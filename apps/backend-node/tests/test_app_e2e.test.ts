/**
 * App E2E and integration test.
 * Mirrors: apps/backend/tests/test_app_e2e.py
 */

import Database from 'better-sqlite3';
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

vi.mock('../src/services/publish-executor.js', () => ({
    startPublishThread: vi.fn(),
    runPublishTask: vi.fn(),
}));

vi.mock('../src/services/login-service.js', () => ({
    activeQueues: new Map(),
    runAsyncFunction: vi.fn(),
}));

vi.mock('../src/core/config.js', () => ({
    COOKIES_DIR: '/tmp',
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

const { createApp } = await import('../src/app.js');

describe('App E2E', () => {
    beforeEach(() => {
        ({ db, dbPath } = createTempDb());
    });

    afterEach(() => {
        cleanupTempDb(dbPath, db);
    });

    it('should create and configure Express app', async () => {
        const app = createApp();
        expect(app).toBeTruthy();
    });

    it('GET /api/getDashboardStats should be accessible', async () => {
        const app = createApp();
        const res = await request(app).get('/getDashboardStats');
        expect(res.status).toBe(200);
    });

    it('GET /api/getAccounts should be accessible', async () => {
        const app = createApp();
        const res = await request(app).get('/getAccounts');
        expect(res.status).toBe(200);
    });

    it('GET /api/getFiles should be accessible', async () => {
        const app = createApp();
        const res = await request(app).get('/getFiles');
        expect(res.status).toBe(200);
    });

    it('GET /api/tasks should be accessible', async () => {
        const app = createApp();
        const res = await request(app).get('/tasks');
        expect(res.status).toBe(200);
    });

    it('GET /api/getGroups should be accessible', async () => {
        const app = createApp();
        const res = await request(app).get('/getGroups');
        expect(res.status).toBe(200);
    });

    it('should return 404 for unknown routes', async () => {
        const app = createApp();
        const res = await request(app).get('/nonexistent-route-12345');
        expect(res.status).toBe(404);
    });

    it('E2E: complete account management flow', async () => {
        const app = createApp();

        // Step 1: Get accounts (empty)
        const acRes = await request(app).get('/getAccounts');
        expect(acRes.status).toBe(200);
        expect(acRes.body.data).toEqual([]);

        // Step 2: Create a group
        const grpRes = await request(app)
            .post('/createGroup')
            .send({ name: 'TestGroup' });
        expect(grpRes.status).toBe(200);
    });
});
