/**
 * Publish executor test.
 * Mirrors: apps/backend/tests/test_utils_publish_executor.py + test_publish_executor_integration.py
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupTempDb, createTempDb } from './setup.js';

let db: Database.Database;
let dbPath: string;
let tmpVideoDir: string;
let tmpCookieDir: string;

vi.mock('../src/db/database.js', () => ({
    dbManager: {
        getDb: () => db,
        getDbPath: () => dbPath,
        getDataDir: () => '/tmp',
    },
}));

vi.mock('../src/core/config.js', async () => {
    return {
        COOKIES_DIR: tmpCookieDir || '/tmp/test-cookies',
        VIDEOS_DIR: tmpVideoDir || '/tmp/test-videos',
        BASE_DIR: '/tmp',
        ROOT_DIR: '/tmp',
        DATA_DIR: '/tmp',
        LOGS_DIR: '/tmp',
        HOST: '0.0.0.0',
        PORT: 5409,
        MAX_UPLOAD_SIZE: 500 * 1024 * 1024,
        LOCAL_CHROME_PATH: '',
        DEBUG_MODE: false,
    };
});

describe('Publish Executor', () => {
    beforeEach(() => {
        ({ db, dbPath } = createTempDb());
        tmpVideoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-videos-'));
        tmpCookieDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-cookies-'));
    });

    afterEach(() => {
        cleanupTempDb(dbPath, db);
        try { fs.rmSync(tmpVideoDir, { recursive: true }); } catch { }
        try { fs.rmSync(tmpCookieDir, { recursive: true }); } catch { }
    });

    it('should validate that video files exist', async () => {
        const { runPublishTask } = await import('../src/services/publish-executor.js');
        const { taskService } = await import('../src/services/task-service.js');

        const taskId = taskService.createTask({
            title: 'Test', type: 1,
            fileList: ['nonexistent.mp4'],
            accountList: ['acc.json'],
        });

        await runPublishTask(taskId!, {
            type: 1,
            title: 'Test',
            fileList: ['nonexistent.mp4'],
            accountList: ['acc.json'],
        });

        // Task should be marked as failed
        const task = taskService.getTask(taskId!);
        expect(task?.status).toBe('failed');
    });
});
