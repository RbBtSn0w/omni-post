/**
 * Publish executor for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/publish_executor.py
 *
 * Handles task execution lifecycle: validates files, dispatches to uploader, updates status.
 */

import fs from 'fs';
import { COOKIES_DIR, VIDEOS_DIR } from '../core/config.js';
import { PlatformType, getPlatformName } from '../core/constants.js';
import { logger } from '../core/logger.js';
import { lockManager } from './lock-manager.js';
import {
    postVideoBilibili,
    postVideoDouyin,
    postVideoKs,
    postVideoWxChannels,
    postVideoXhs,
    postArticleZhihu,
    postArticleJuejin,
    type UploadOptions,
} from './publish-service.js';
import { taskService } from './task-service.js';
import { safeJoin } from '../utils/path.js';

/**
 * Concurrency Limit (资源并发限制)
 * 限制同时运行的浏览器实例数量，防止内存溢出。
 */
let activeTasks = 0;
const MAX_CONCURRENT_TASKS = 5; 
const taskQueue: (() => void)[] = [];

async function acquireSlot(taskId: string): Promise<void> {
    if (activeTasks < MAX_CONCURRENT_TASKS) {
        activeTasks++;
        logger.info(`[PUBLISH] Slot acquired for ${taskId}. Active jobs: ${activeTasks}`);
        return;
    }
    logger.info(`[PUBLISH] Max concurrency (${MAX_CONCURRENT_TASKS}) reached. Task ${taskId} queuing...`);
    return new Promise((resolve) => {
        taskQueue.push(resolve);
    });
}

function releaseSlot(taskId: string): void {
    activeTasks--;
    if (taskQueue.length > 0) {
        const next = taskQueue.shift();
        if (next) {
            activeTasks++;
            next();
        }
    }
}

/**
 * Execute publish task. Updates task status in DB.
 */
export async function runPublishTask(taskId: string, publishData: any): Promise<void> {
    // 等待并发槽位分配
    await acquireSlot(taskId);

    const accountList: string[] = publishData.accountList || [];
    const contentType: 'video' | 'article' = publishData.content_type || 'video';
    const browser_profile_id = publishData.browser_profile_id || null;
    const lockKeys: string[] = [];

    try {
        const resourcesToLock = [...accountList];
        if (browser_profile_id) {
            resourcesToLock.push(`profile:${browser_profile_id}`);
        }

        // 尝试锁定所有涉及资源（账号、浏览器 profile）
        for (const key of resourcesToLock) {
            if (!lockManager.lock(key)) {
                throw new Error('账号或浏览器配置正在使用中，请稍后再试');
            }
            lockKeys.push(key);
        }

        logger.info(`\n${'='.repeat(50)}`);
        logger.info(`[PUBLISH] Starting task ${taskId}`);
        logger.info(`${'='.repeat(50)}`);
        taskService.updateTaskStatus(taskId, 'uploading', 0);

        // Extract data
        const type = publishData.type;
        const title = publishData.title || '';
        const tags = publishData.tags || [];
        const fileList: string[] = publishData.fileList || [];
        let category = publishData.category;
        if (category === 0) category = null;
        const enableTimer = publishData.enableTimer;
        const videosPerDay = publishData.videosPerDay;
        const dailyTimes = publishData.dailyTimes;
        const startDays = publishData.startDays;
        const productLink = publishData.productLink || '';
        const productTitle = publishData.productTitle || '';
        const thumbnailPath = publishData.thumbnail || '';
        const isDraft = publishData.isDraft || false;
        const article = publishData.article;

        // Debug logging
        logger.info(`[PUBLISH] Platform: ${getPlatformName(type)}`);
        logger.info(`[PUBLISH] Title: ${title}`);
        logger.info(`[PUBLISH] Tags: ${tags}`);
        logger.info(`[PUBLISH] File list: ${fileList}`);
        logger.info(`[PUBLISH] Account list: ${accountList}`);
        logger.info(`[PUBLISH] Browser Profile ID: ${browser_profile_id}`);

        // Validate files exist
        if (contentType === 'video') {
            logger.info(`\n[VALIDATE] Checking video files in: ${VIDEOS_DIR}`);
            for (const f of fileList) {
                let filePath: string;
                try {
                    filePath = safeJoin(VIDEOS_DIR, f);
                } catch (error: any) {
                    logger.error(`  ✗ Video Path Invalid: ${f}`);
                    throw new Error(`非法的文件路径: ${f}`);
                }

                if (fs.existsSync(filePath)) {
                    logger.info(`  ✓ Video exists: ${f}`);
                } else {
                    logger.error(`  ✗ Video MISSING: ${f}`);
                    throw new Error(`Video file not found: ${filePath}`);
                }
            }
        } else {
            logger.info('\n[VALIDATE] Skipping video file checks (article task).');
        }

        // Managed cookies check only if NOT using local profile
        if (!browser_profile_id) {
            logger.info(`\n[VALIDATE] Checking cookie files in: ${COOKIES_DIR}`);
            for (const acc of accountList) {
                let accPath: string;
                try {
                    accPath = safeJoin(COOKIES_DIR, acc);
                } catch (error: any) {
                    logger.error(`  ✗ Cookie Path Invalid: ${acc}`);
                    throw new Error(`非法的文件路径: ${acc}`);
                }

                if (fs.existsSync(accPath)) {
                    logger.info(`  ✓ Cookie exists: ${acc}`);
                } else {
                    logger.error(`  ✗ Cookie MISSING: ${acc}`);
                    throw new Error(`Cookie file not found: ${accPath}`);
                }
            }
        } else {
            logger.info('\n[VALIDATE] Skipping cookie check (using local browser profile).');
        }

        logger.info('\n[PUBLISH] All validations passed. Starting upload...');

        const opts: UploadOptions = {
            title,
            fileList,
            tags,
            accountList,
            category,
            enableTimer,
            videosPerDay,
            dailyTimes,
            startDays,
            thumbnailPath,
            productLink,
            productTitle,
            isDraft,
            browser_profile_id,
            article,
        };

        // Dispatch to appropriate uploader
        switch (type) {
            case PlatformType.XIAOHONGSHU: await postVideoXhs(opts); break;
            case PlatformType.WX_CHANNELS: await postVideoWxChannels(opts); break;
            case PlatformType.DOUYIN: await postVideoDouyin(opts); break;
            case PlatformType.KUAISHOU: await postVideoKs(opts); break;
            case PlatformType.BILIBILI: await postVideoBilibili(opts); break;
            case PlatformType.ZHIHU: await postArticleZhihu(opts); break;
            case PlatformType.JUEJIN: await postArticleJuejin(opts); break;
            default: throw new Error(`Unknown platform type: ${type}`);
        }

        logger.info(`\n[PUBLISH] Task ${taskId} completed successfully!`);
        taskService.updateTaskStatus(taskId, 'completed', 100, null);
    } catch (error: any) {
        logger.error(`\n[PUBLISH] Task ${taskId} FAILED: ${error.message}`);
        logger.error(error.stack);
        taskService.updateTaskStatus(taskId, 'failed', undefined, error.message);
    } finally {
        // 释放所有已持有的账号锁
        for (const key of lockKeys) {
            lockManager.unlock(key);
        }
        releaseSlot(taskId);
    }
}

/**
 * Start publish task in background (non-blocking).
 */
export function startPublishThread(taskId: string, publishData: any): void {
    setImmediate(() => {
        runPublishTask(taskId, publishData).catch(err => {
            logger.error(`[PUBLISH] Unhandled error in task ${taskId}: ${err.message}`);
        });
    });
}
