/**
 * Publish route test.
 * Mirrors: apps/backend/tests/test_routes_publish.py + test_postVideo.py
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

vi.mock('../src/services/publish-executor.js', () => ({
    startPublishThread: vi.fn(),
    runPublishTask: vi.fn(),
}));

vi.mock('../src/services/login-service.js', () => ({
    activeQueues: new Map(),
    runAsyncFunction: vi.fn(),
}));

const { router } = await import('../src/routes/publish.js');
const { taskService } = await import('../src/services/task-service.js');

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/publish', router);
    return app;
}

describe('Publish Route', () => {
    beforeEach(() => {
        ({ db, dbPath } = createTempDb());
    });

    afterEach(() => {
        cleanupTempDb(dbPath, db);
    });

    it('GET /api/publish/tasks should return tasks', async () => {
        const app = createTestApp();
        const res = await request(app).get('/api/publish/tasks');
        expect(res.status).toBe(200);
        expect(res.body.code).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    it('DELETE /api/publish/tasks/:taskId should delete task', async () => {
        const taskId = taskService.createTask({ title: 'T1', type: 1 });
        const app = createTestApp();
        const res = await request(app).delete(`/api/publish/tasks/${taskId}`);
        expect(res.status).toBe(200);
        expect(res.body.code).toBe(200);
    });

    it('PATCH /api/publish/tasks/:taskId should update status', async () => {
        const taskId = taskService.createTask({ title: 'T1', type: 1 });
        const app = createTestApp();
        const res = await request(app)
            .patch(`/api/publish/tasks/${taskId}`)
            .send({ status: 'completed', progress: 100 });
        expect(res.status).toBe(200);
        expect(res.body.msg).toBe('Updated');
    });

    it('PATCH /api/publish/tasks/:taskId should reject without status', async () => {
        const taskId = taskService.createTask({ title: 'T1', type: 1 });
        const app = createTestApp();
        const res = await request(app)
            .patch(`/api/publish/tasks/${taskId}`)
            .send({ progress: 50 });
        expect(res.status).toBe(400);
        expect(res.body.msg).toContain('Status required');
    });

    it('POST /api/publish/postVideo should create task with valid accounts', async () => {
        // Insert matching account
        db.prepare('INSERT INTO user_info (type, filePath, userName, status) VALUES (?, ?, ?, ?)')
            .run(3, 'acc1.json', 'TestUser', 1);

        const app = createTestApp();
        const res = await request(app)
            .post('/api/publish/postVideo')
            .send({
                title: 'Test Video',
                type: 3,
                fileList: ['f1.mp4'],
                accountList: ['acc1.json'],
            });
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('taskId');
    });

    it('POST /api/publish/postVideo should reject no valid accounts', async () => {
        const app = createTestApp();
        const res = await request(app)
            .post('/api/publish/postVideo')
            .send({
                title: 'Test Video',
                type: 3,
                fileList: ['f1.mp4'],
                accountList: ['nonexistent.json'],
            });
        expect(res.status).toBe(400);
    });

    it('POST /api/publish/postVideoBatch should reject non-array', async () => {
        const app = createTestApp();
        const res = await request(app)
            .post('/api/publish/postVideoBatch')
            .send({ not: 'list' });
        expect(res.status).toBe(400);
    });

    it('POST /api/publish/postVideoBatch should create multiple tasks', async () => {
        const app = createTestApp();
        const res = await request(app)
            .post('/api/publish/postVideoBatch')
            .send([
                { title: 'V1', type: 1 },
                { title: 'V2', type: 2 },
            ]);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
    });
});
