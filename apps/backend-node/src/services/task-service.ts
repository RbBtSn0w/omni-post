/**
 * Task service for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/task_service.py
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../core/logger.js';
import { dbManager } from '../db/database.js';

export interface Task {
    id: string;
    title: string | null;
    status: string;
    progress: number;
    priority: number;
    platforms: number[];
    file_list: string[];
    account_list: string[];
    schedule_data: any;
    error_msg: string | null;
    publish_data: any;
    created_at: string;
    updated_at: string;
}

/**
 * Task service class for managing task lifecycle.
 */
class TaskService {
    /**
     * Create a new publishing task.
     */
    createTask(publishData: any): string {
        const db = dbManager.getDb();
        const taskId = `task_${Date.now()}_${uuidv4().slice(0, 8)}`;

        const stmt = db.prepare(`
      INSERT INTO tasks (id, title, status, progress, priority, platforms, file_list, account_list, schedule_data, publish_data)
      VALUES (?, ?, 'waiting', 0, 1, ?, ?, ?, ?, ?)
    `);

        // Build schedule_data from top-level fields (matching Python's route-layer assembly)
        const scheduleData = {
            enableTimer: publishData.enableTimer ?? null,
            videosPerDay: publishData.videosPerDay ?? null,
            dailyTimes: publishData.dailyTimes ?? null,
            startDays: publishData.startDays ?? null,
        };

        stmt.run(
            taskId,
            publishData.title || null,
            JSON.stringify(publishData.platforms || [publishData.type]),
            JSON.stringify(publishData.fileList || []),
            JSON.stringify(publishData.accountList || []),
            JSON.stringify(scheduleData),
            JSON.stringify(publishData)
        );

        return taskId;
    }

    /**
     * Update task status and progress.
     * Includes protection logic: 'uploading' updates won't overwrite 'completed' or 'failed' status.
     */
    updateTaskStatus(
        taskId: string,
        status: string,
        progress?: number,
        errorMsg?: string | null
    ): void {
        const db = dbManager.getDb();

        // 1. Fetch current status to decide if transition is allowed
        const current = db.prepare('SELECT status, progress FROM tasks WHERE id = ?').get(taskId) as { status: string, progress: number } | undefined;
        if (!current) {
            logger.warn(`[TaskService] Attempted to update status for non-existent task: ${taskId}`);
            return;
        }

        // 2. Protection: Transition from terminal states ('completed', 'failed') back to intermediate states is NOT allowed
        // unless it's a manual status reset (not handled here) or a complete task failure.
        if (['completed', 'failed'].includes(current.status) && (status === 'uploading' || status === 'waiting')) {
            return;
        }

        // 3. Progress Guard: Avoid overwriting higher progress with lower progress for same status
        if (status === current.status && progress !== undefined && progress < current.progress) {
            return;
        }

        if (progress !== undefined && errorMsg !== undefined) {
            db.prepare(
                `UPDATE tasks SET status = ?, progress = ?, error_msg = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).run(status, progress, errorMsg, taskId);
        } else if (progress !== undefined) {
            db.prepare(
                `UPDATE tasks SET status = ?, progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).run(status, progress, taskId);
        } else if (errorMsg !== undefined) {
            db.prepare(
                `UPDATE tasks SET status = ?, error_msg = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).run(status, errorMsg, taskId);
        } else {
            db.prepare(
                `UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).run(status, taskId);
        }
    }

    /**
     * Get all tasks, sorted by creation time (newest first).
     */
    getAllTasks(): Task[] {
        const db = dbManager.getDb();
        const rows = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as any[];

        return rows.map(row => ({
            ...row,
            platforms: this._parseJson(row.platforms, []),
            file_list: this._parseJson(row.file_list, []),
            account_list: this._parseJson(row.account_list, []),
            schedule_data: this._parseJson(row.schedule_data, null),
            publish_data: this._parseJson(row.publish_data, null),
        }));
    }

    /**
     * Get a task by ID.
     */
    getTask(taskId: string): Task | null {
        const db = dbManager.getDb();
        const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;

        if (!row) return null;

        return {
            ...row,
            platforms: this._parseJson(row.platforms, []),
            file_list: this._parseJson(row.file_list, []),
            account_list: this._parseJson(row.account_list, []),
            schedule_data: this._parseJson(row.schedule_data, null),
            publish_data: this._parseJson(row.publish_data, null),
        };
    }

    /**
     * Delete a task by ID.
     */
    deleteTask(taskId: string): boolean {
        const db = dbManager.getDb();
        const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
        return result.changes > 0;
    }

    /**
     * Safe JSON parsing with fallback.
     */
    private _parseJson(value: string | null, fallback: any): any {
        if (!value) return fallback;
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }
}

// Global singleton instance
export const taskService = new TaskService();
