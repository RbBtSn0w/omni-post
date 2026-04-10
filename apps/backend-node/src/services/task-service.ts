/**
 * Task service for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/task_service.py
 */

import { v4 as uuidv4 } from 'uuid';
import { SpanStatusCode } from '@opentelemetry/api';
import { logger } from '../core/logger.js';
import { getTracer } from '../core/telemetry.js';
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
        const tracer = getTracer();
        return tracer.startActiveSpan('task.create', (span) => {
            try {
                const db = dbManager.getDb();
                const taskId = `task_${Date.now()}_${uuidv4().slice(0, 8)}`;
                span.setAttribute('task.id', taskId);

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
            } catch (error: unknown) {
                const exception = error instanceof Error ? error : new Error(String(error));
                span.recordException(exception);
                span.setStatus({ code: SpanStatusCode.ERROR, message: exception.message });
                throw exception;
            } finally {
                span.end();
            }
        }); // end startActiveSpan
    }

    /**
     * Update task status and progress.
     * Includes protection logic: 'uploading' updates won't overwrite 'completed' or 'failed' status.
     */
    updateTaskStatus(
        taskId: string,
        status: string,
        progress?: number,
        errorMsg?: string | null,
        force = false
    ): void {
        const tracer = getTracer();
        tracer.startActiveSpan('task.updateStatus', (span) => {
            try {
                span.setAttribute('task.id', taskId);
                span.setAttribute('task.status', status);
                if (progress !== undefined) span.setAttribute('task.progress', progress);

                const db = dbManager.getDb();
                const forceNum = force ? 1 : 0;

                // Use a single UPDATE with conditional WHERE to enforce guards:
                // 1. Force bypass (? = 1)
                // 2. Restart guard: ((status NOT IN ('completed', 'failed') OR (? = 0 AND ? IN ('waiting', 'uploading'))))
                //    Allows moving out of terminal states ONLY for explicit restarts (progress 0 + non-terminal status)
                // 3. Progress guard: (status != ? OR ? >= progress)
                //    Prevents progress regression when status remains the same

                let stmt;
                let params: (string | number | null)[];

                if (progress !== undefined && errorMsg !== undefined) {
                    stmt = db.prepare(`
                UPDATE tasks
                SET status = ?, progress = ?, error_msg = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND (
                    ? = 1 OR (
                        (status NOT IN ('completed', 'failed') OR (? = 0 AND ? IN ('waiting', 'uploading'))) AND
                        (status != ? OR ? >= progress)
                    )
                )
            `);
                    params = [status, progress, errorMsg, taskId, forceNum, progress, status, status, progress];
                } else if (progress !== undefined) {
                    stmt = db.prepare(`
                UPDATE tasks
                SET status = ?, progress = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND (
                    ? = 1 OR (
                        (status NOT IN ('completed', 'failed') OR (? = 0 AND ? IN ('waiting', 'uploading'))) AND
                        (status != ? OR ? >= progress)
                    )
                )
            `);
                    params = [status, progress, taskId, forceNum, progress, status, status, progress];
                } else if (errorMsg !== undefined) {
                    stmt = db.prepare(`
                UPDATE tasks
                SET status = ?, error_msg = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND (
                    ? = 1 OR (status NOT IN ('completed', 'failed'))
                )
            `);
                    params = [status, errorMsg, taskId, forceNum];
                } else {
                    stmt = db.prepare(`
                UPDATE tasks
                SET status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND (
                    ? = 1 OR (status NOT IN ('completed', 'failed'))
                )
            `);
                    params = [status, taskId, forceNum];
                }

                const info = stmt.run(...params);
                if (info.changes === 0) {
                    // Either ID doesn't exist OR it was blocked by guards
                    // We can't easily distinguish without another SELECT, but we can log that it was skipped
                    const progressInfo = progress !== undefined ? ` (${progress}%)` : '';
                    logger.debug(`[TaskService] Task update skipped (guarded or non-existent): ${taskId} -> ${status}${progressInfo}`);
                }
            } catch (error: unknown) {
                const exception = error instanceof Error ? error : new Error(String(error));
                span.recordException(exception);
                span.setStatus({ code: SpanStatusCode.ERROR, message: exception.message });
                throw exception;
            } finally {
                span.end();
            }
        }); // end startActiveSpan
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
