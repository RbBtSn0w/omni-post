/**
 * Account route test.
 * Mirrors: apps/backend/tests/test_account.py + test_routes_account.py
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

const { router } = await import('../src/routes/account.js');

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api', router);
    return app;
}

describe('Account Route', () => {
    beforeEach(() => {
        ({ db, dbPath } = createTempDb());
    });

    afterEach(() => {
        cleanupTempDb(dbPath, db);
    });

    it('GET /api/getAccounts should return empty array initially', async () => {
        const app = createTestApp();
        const res = await request(app).get('/api/getAccounts');
        expect(res.status).toBe(200);
        expect(res.body.code).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    it('GET /api/getAccounts should return accounts after insert', async () => {
        db.prepare('INSERT INTO user_info (type, filePath, userName, status) VALUES (?, ?, ?, ?)')
            .run(1, 'user1.json', 'user1', 1);

        const app = createTestApp();
        const res = await request(app).get('/api/getAccounts');
        expect(res.body.code).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].userName).toBe('user1');
    });

    it('POST /api/updateUserinfo should update user info', async () => {
        db.prepare('INSERT INTO user_info (type, filePath, userName, status) VALUES (?, ?, ?, ?)')
            .run(1, 'user1.json', 'user1', 1);

        const app = createTestApp();
        const row = db.prepare('SELECT id FROM user_info WHERE userName = ?').get('user1') as any;
        const res = await request(app)
            .post('/api/updateUserinfo')
            .send({ id: row.id, userName: 'user1_updated' });
        expect(res.status).toBe(200);
    });

    it('GET /api/deleteAccount should delete account', async () => {
        db.prepare('INSERT INTO user_info (type, filePath, userName, status) VALUES (?, ?, ?, ?)')
            .run(1, 'user1.json', 'user1', 1);

        const row = db.prepare('SELECT id FROM user_info WHERE userName = ?').get('user1') as any;
        const app = createTestApp();
        const res = await request(app).get(`/api/deleteAccount?id=${row.id}`);
        expect(res.status).toBe(200);

        const remaining = db.prepare('SELECT COUNT(*) as cnt FROM user_info').get() as any;
        expect(remaining.cnt).toBe(0);
    });
});
