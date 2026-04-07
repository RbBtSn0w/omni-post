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
import { capabilityService } from '../services/capability-service.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const router = Router();

interface AccountTypeRow {
    type: number;
}

function normalizeCapabilityPayload(raw: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = { ...raw };
    const inputs = raw.inputs;
    if (inputs && typeof inputs === 'object' && !Array.isArray(inputs)) {
        Object.assign(normalized, inputs as Record<string, unknown>);
    }

    const accountList = raw.accountList;
    if (!Array.isArray(accountList) && Array.isArray(raw.account_file_list)) {
        normalized.accountList = raw.account_file_list;
    }

    const fileList = normalized.fileList;
    if (!Array.isArray(fileList) && typeof normalized.fileList === 'string') {
        normalized.fileList = String(normalized.fileList)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (!Array.isArray(normalized.fileList) && Array.isArray(normalized.files)) {
        normalized.fileList = normalized.files;
    }

    if (!Array.isArray(normalized.tags) && typeof normalized.tags === 'string') {
        normalized.tags = String(normalized.tags)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return normalized;
}

function resolveTypeByCapability(data: Record<string, unknown>): { type: number; kind: 'publish.video' | 'publish.article' } | null {
    const capabilityId = typeof data.capability_id === 'string' ? data.capability_id : '';
    if (!capabilityId) {
        const fallbackType = Number(data.type);
        if (Number.isInteger(fallbackType) && fallbackType > 0) {
            return { type: fallbackType, kind: (data.content_type === 'article' ? 'publish.article' : 'publish.video') };
        }
        return null;
    }

    const capability = capabilityService.getCapabilityById(capabilityId);
    if (!capability) return null;
    return { type: capability.platform_id, kind: capability.kind };
}

function filterValidAccountsByType(platformType: number, accountList: string[]): string[] {
    const db = dbManager.getDb();
    const validAccounts: string[] = [];
    for (const accountFile of accountList) {
        const row = db.prepare('SELECT type FROM user_info WHERE filePath = ?').get(accountFile) as AccountTypeRow | undefined;
        if (row && row.type === platformType) {
            validAccounts.push(accountFile);
        }
    }
    return validAccounts;
}

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
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        sendError(res, 500, message);
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
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        sendError(res, 500, message);
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
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        sendError(res, 500, message);
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
            const row = db.prepare('SELECT type FROM user_info WHERE filePath = ?').get(accountFile) as { type: number } | undefined;
            if (row && row.type === platformType) {
                validAccounts.push(accountFile);
            }
        }

        if (validAccounts.length === 0) {
            // [IMPROVEMENT] If no valid accounts from task, try to find ANY valid account for this platform
            logger.warn(`[PUBLISH] Task ${taskId} has no valid assigned accounts. Searching for substitutes...`);
            const substitutes = db.prepare('SELECT filePath FROM user_info WHERE type = ?').all(platformType) as { filePath: string }[];
            if (substitutes.length > 0) {
                const subAccount = substitutes[0].filePath;
                logger.info(`[PUBLISH] Found substitute account for platform ${platformType}: ${subAccount}`);
                validAccounts.push(subAccount);
            } else {
                sendError(res, 400, `平台 ${platformType} 未发现已登录的有效账号 (无可用 cookie 文件)`);
                return;
            }
        }

        publishData.accountList = validAccounts;

        // Start async execution
        startPublishThread(taskId, publishData);
        sendSuccess(res, null, 'Task started');
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        sendError(res, 500, message);
    }
});

/**
 * POST /postVideo
 * Create and start a single video publish task.
 */
router.post('/postVideo', async (req: Request, res: Response) => {
    try {
        const data = normalizeCapabilityPayload(req.body as Record<string, unknown>);
        const resolved = resolveTypeByCapability(data);
        if (!resolved) {
            sendError(res, 400, '缺少有效的 type 或 capability_id');
            return;
        }
        data.type = resolved.type;
        data.content_type = resolved.kind === 'publish.article' ? 'article' : 'video';
        const platformType = resolved.type;
        const accountList = Array.isArray(data.accountList) ? data.accountList.map((item) => String(item)) : [];

        if (resolved.kind === 'publish.article') {
            const articleTitle = typeof data.title === 'string' ? data.title : '';
            const articleContent = typeof data.content === 'string' ? data.content : '';
            const tags = Array.isArray(data.tags) ? data.tags.map((item) => String(item)) : [];
            data.article = {
                title: articleTitle,
                content: articleContent,
                tags
            };
        }

        // Filter accounts by platform type
        const validAccounts = filterValidAccountsByType(platformType, accountList);
        const invalidCount = accountList.length - validAccounts.length;

        if (invalidCount > 0) {
            logger.warn(
                `[PUBLISH] Filtered ${invalidCount} mismatched accounts for platform ${platformType}`
            );
        }

        if (validAccounts.length === 0) {
            sendError(res, 400, `没有匹配平台 ${platformType} 的有效账号`);
            return;
        }

        data.accountList = validAccounts;

        const taskId = taskService.createTask(data as Record<string, unknown>);
        if (taskId) {
            startPublishThread(taskId, data as Record<string, unknown>);
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

        for (const raw of dataList) {
            const data = normalizeCapabilityPayload((raw || {}) as Record<string, unknown>);
            const resolved = resolveTypeByCapability(data);
            if (resolved) {
                data.type = resolved.type;
                data.content_type = resolved.kind === 'publish.article' ? 'article' : 'video';
            }
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

/**
 * POST /publish/capability
 * Generic entrypoint for capability-based publishing (video/article).
 */
router.post('/publish/capability', async (req: Request, res: Response) => {
    try {
        const data = normalizeCapabilityPayload(req.body as Record<string, unknown>);
        const resolved = resolveTypeByCapability(data);
        if (!resolved) {
            sendError(res, 400, 'capability_id 不存在或 type 无效');
            return;
        }

        data.type = resolved.type;
        data.content_type = resolved.kind === 'publish.article' ? 'article' : 'video';
        const accountList = Array.isArray(data.accountList) ? data.accountList.map((item) => String(item)) : [];
        const validAccounts = filterValidAccountsByType(resolved.type, accountList);

        if (validAccounts.length === 0) {
            sendError(res, 400, '没有匹配平台的有效账号');
            return;
        }

        data.accountList = validAccounts;
        if (resolved.kind === 'publish.article') {
            const tags = Array.isArray(data.tags) ? data.tags.map((item) => String(item)) : [];
            data.article = {
                title: typeof data.title === 'string' ? data.title : '',
                content: typeof data.content === 'string' ? data.content : '',
                tags
            };
        }

        const taskId = taskService.createTask(data);
        startPublishThread(taskId, data);
        sendSuccess(res, { taskId }, 'Task started');
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        sendError(res, 500, message);
    }
});
