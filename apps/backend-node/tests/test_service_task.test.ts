/**
 * TaskService test.
 * Mirrors: apps/backend/tests/test_service_task.py
 */

import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupTempDb, createTempDb } from './setup.js';

// We need to mock the dbManager before importing taskService
let db: Database.Database;
let dbPath: string;

vi.mock('../src/db/database.js', () => ({
    dbManager: {
        getDb: () => db,
        getDbPath: () => dbPath,
        getDataDir: () => '/tmp',
    },
}));

// Import after mock setup
const { taskService } = await import('../src/services/task-service.js');

describe('TaskService', () => {
    beforeEach(() => {
        ({ db, dbPath } = createTempDb());
    });

    afterEach(() => {
        cleanupTempDb(dbPath, db);
    });

    it('should create a task', () => {
        const taskId = taskService.createTask({
            title: 'Test Task',
            type: 1,
            fileList: ['file1'],
            accountList: ['acc1'],
        });

        expect(taskId).toBeTruthy();
        expect(taskId).toMatch(/^task_/);

        const tasks = taskService.getAllTasks();
        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toBe('Test Task');
    });

    it('should parse JSON fields correctly', () => {
        taskService.createTask({
            title: 'T1', type: 1,
            fileList: ['f1'], accountList: ['a1'],
            enableTimer: true,
        });

        const tasks = taskService.getAllTasks();
        expect(Array.isArray(tasks[0].platforms)).toBe(true);
    });

    it('should update task status', () => {
        const taskId = taskService.createTask({ title: 'T1', type: 1 });

        taskService.updateTaskStatus(taskId!, 'uploading', 50);
        let task = taskService.getTask(taskId!);
        expect(task?.status).toBe('uploading');
        expect(task?.progress).toBe(50);

        taskService.updateTaskStatus(taskId!, 'failed', undefined, 'Some error');
        task = taskService.getTask(taskId!);
        expect(task?.status).toBe('failed');
        expect(task?.error_msg).toBe('Some error');
    });

    it('should delete a task', () => {
        const taskId = taskService.createTask({ title: 'T1', type: 1 });
        expect(taskService.deleteTask(taskId!)).toBe(true);
        expect(taskService.getAllTasks()).toHaveLength(0);
    });
});
