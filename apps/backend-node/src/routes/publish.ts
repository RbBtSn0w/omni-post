/**
 * Publish route for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/routes/publish.py
 *
 * Includes both SSE login endpoints (US2) and task/publish endpoints (US3).
 */

import { EventEmitter } from 'events';
import { Router, type Request, type Response } from 'express';
import { logger } from '../core/logger.js';
import { dbManager } from '../db/database.js';
import { activeQueues, runAsyncFunction } from '../services/login-service.js';
import { startPublishThread } from '../services/publish-executor.js';
import { taskService } from '../services/task-service.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const router = Router();

// ─── SSE Login Endpoint (US2) ─────────────────────────────────────────

/**
 * GET /login
 * SSE endpoint for platform login.
 * Query params: type (1-5), id (account name), group (optional group name)
 */
router.get('/login', (req: Request, res: Response) => {
    const type = req.query.type as string;
    const id = req.query.id as string;
    const groupName = (req.query.group as string) || undefined;

    if (!type || !id) {
        sendError(res, 400, '缺少 type 或 id 参数');
        return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Create communication and cancellation tokens (FR-005)
    const emitter = new EventEmitter();
    const abortController = new AbortController();
    activeQueues.set(id, { emitter, abortController });

    // Listen for messages and send as SSE
    emitter.on('message', (msg: string) => {
        if (!res.writableEnded) {
            res.write(`data: ${msg}\n\n`);
        }
    });

    emitter.on('end', () => {
        logger.info(`任务结束，关闭 SSE: ${id}`);
        activeQueues.delete(id);
        emitter.removeAllListeners();
        if (!res.writableEnded) {
            res.end();
        }
    });

    // Handle client disconnect
    req.on('close', () => {
        const handle = activeQueues.get(id);
        if (handle) {
            logger.info(`客户端断开连接，中止任务: ${id}`);
            handle.abortController.abort();
            activeQueues.delete(id);
            handle.emitter.removeAllListeners();
        }
    });

    // Start login in background
    runAsyncFunction(type, id, emitter, abortController.signal, groupName);
});

// ─── Task Management Endpoints (US3) ──────────────────────────────────

/**
 * GET /tasks
 * Get all tasks.
 */
router.get('/tasks', (_req: Request, res: Response) => {
    try {
        const tasks = taskService.getAllTasks();
        sendSuccess(res, tasks, '获取成功');
    } catch (error: any) {
        sendError(res, 500, error.message);
    }
});

/**
 * DELETE /tasks/:taskId
 * Delete a task.
 */
router.delete('/tasks/:taskId', (req: Request, res: Response) => {
    try {
        const success = taskService.deleteTask(req.params.taskId as string);
        sendSuccess(res, null, success ? 'Deleted' : 'Failed');
    } catch (error: any) {
        sendError(res, 500, error.message);
    }
});

/**
 * PATCH /tasks/:taskId
 * Update task status.
 */
router.patch('/tasks/:taskId', (req: Request, res: Response) => {
    try {
        const { status, progress } = req.body;
        if (status) {
            taskService.updateTaskStatus(req.params.taskId as string, status, progress);
            sendSuccess(res, null, 'Updated');
        } else {
            sendError(res, 400, 'Status required');
        }
    } catch (error: any) {
        sendError(res, 500, error.message);
    }
});

/**
 * POST /tasks/:taskId/start
 * Start (or restart) a task.
 */
router.post('/tasks/:taskId/start', async (req: Request, res: Response) => {
    try {
        const taskId = req.params.taskId as string;
        const task = taskService.getTask(taskId);

        if (!task) {
            sendError(res, 404, 'Task not found');
            return;
        }

        let publishData = task.publish_data;
        if (!publishData) {
            publishData = {
                type: task.platforms[0] || 1,
                title: task.title,
                fileList: task.file_list,
                accountList: task.account_list,
                enableTimer: task.schedule_data?.enableTimer,
                videosPerDay: task.schedule_data?.videosPerDay,
                dailyTimes: task.schedule_data?.dailyTimes,
                startDays: task.schedule_data?.startDays,
            };
        }

        // Filter accounts by platform type
        const platformType = task.platforms[0];
        const accountList: string[] = publishData.accountList || [];
        const db = dbManager.getDb();
        const validAccounts: string[] = [];

        for (const accountFile of accountList) {
            const row = db.prepare('SELECT type FROM user_info WHERE filePath = ?').get(accountFile) as any;
            if (row && row.type === platformType) {
                validAccounts.push(accountFile);
            }
        }

        if (validAccounts.length === 0) {
            sendError(res, 400, `Task has no valid accounts for platform ${platformType}`);
            return;
        }

        publishData.accountList = validAccounts;

        // Start async execution
        startPublishThread(taskId, publishData);
        sendSuccess(res, null, 'Task started');
    } catch (error: any) {
        sendError(res, 500, error.message);
    }
});

/**
 * POST /postVideo
 * Create and start a single video publish task.
 */
router.post('/postVideo', async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const platformType = data.type;
        const accountList: string[] = data.accountList || [];

        // Filter accounts by platform type
        const db = dbManager.getDb();
        const validAccounts: string[] = [];
        const invalidAccounts: string[] = [];

        for (const accountFile of accountList) {
            const row = db.prepare('SELECT type FROM user_info WHERE filePath = ?').get(accountFile) as any;
            if (row && row.type === platformType) {
                validAccounts.push(accountFile);
            } else {
                invalidAccounts.push(accountFile);
            }
        }

        if (invalidAccounts.length > 0) {
            logger.warn(
                `[PUBLISH] Filtered ${invalidAccounts.length} mismatched accounts for platform ${platformType}`
            );
        }

        if (validAccounts.length === 0) {
            sendError(res, 400, `没有匹配平台 ${platformType} 的有效账号`);
            return;
        }

        data.accountList = validAccounts;

        const taskId = taskService.createTask(data);
        if (taskId) {
            startPublishThread(taskId, data);
            sendSuccess(res, { taskId }, 'Task started');
        } else {
            sendError(res, 500, 'Failed to create task');
        }
    } catch (error: any) {
        sendError(res, 500, error.message);
    }
});

/**
 * POST /postVideoBatch
 * Create and start multiple video publish tasks.
 */
router.post('/postVideoBatch', async (req: Request, res: Response) => {
    try {
        const dataList = req.body;
        if (!Array.isArray(dataList)) {
            sendError(res, 400, 'Expected a JSON array');
            return;
        }

        const createdTasks: string[] = [];

        for (const data of dataList) {
            const taskId = taskService.createTask(data);
            if (taskId) {
                startPublishThread(taskId, data);
                createdTasks.push(taskId);
            }
        }

        sendSuccess(res, createdTasks, `Created ${createdTasks.length} tasks`);
    } catch (error: any) {
        sendError(res, 500, error.message);
    }
});
