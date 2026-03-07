/**
 * Publish executor for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/publish_executor.py
 *
 * Handles task execution lifecycle: validates files, dispatches to uploader, updates status.
 */

import fs from 'fs';
import path from 'path';
import { COOKIES_DIR, VIDEOS_DIR } from '../core/config.js';
import { PlatformType, getPlatformName } from '../core/constants.js';
import {
    postVideoBilibili,
    postVideoDouyin,
    postVideoKs,
    postVideoTencent,
    postVideoXhs,
    type UploadOptions,
} from './publish-service.js';
import { taskService } from './task-service.js';

/**
 * Execute publish task. Updates task status in DB.
 */
export async function runPublishTask(taskId: string, publishData: any): Promise<void> {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`[PUBLISH] Starting task ${taskId}`);
    console.log(`${'='.repeat(50)}`);
    taskService.updateTaskStatus(taskId, 'uploading', 0);

    try {
        // Extract data
        const type = publishData.type;
        const title = publishData.title || '';
        const tags = publishData.tags || [];
        const fileList: string[] = publishData.fileList || [];
        const accountList: string[] = publishData.accountList || [];
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

        // Debug logging
        console.log(`[PUBLISH] Platform: ${getPlatformName(type)}`);
        console.log(`[PUBLISH] Title: ${title}`);
        console.log(`[PUBLISH] Tags: ${tags}`);
        console.log(`[PUBLISH] File list: ${fileList}`);
        console.log(`[PUBLISH] Account list: ${accountList}`);
        console.log(`[PUBLISH] Enable timer: ${enableTimer}`);

        // Validate files exist
        console.log(`\n[VALIDATE] Checking video files in: ${VIDEOS_DIR}`);
        for (const f of fileList) {
            const filePath = path.join(VIDEOS_DIR, f);
            if (fs.existsSync(filePath)) {
                console.log(`  ✓ Video exists: ${f}`);
            } else {
                console.log(`  ✗ Video MISSING: ${f}`);
                throw new Error(`Video file not found: ${filePath}`);
            }
        }

        console.log(`\n[VALIDATE] Checking cookie files in: ${COOKIES_DIR}`);
        for (const acc of accountList) {
            const accPath = path.join(COOKIES_DIR, acc);
            if (fs.existsSync(accPath)) {
                console.log(`  ✓ Cookie exists: ${acc}`);
            } else {
                console.log(`  ✗ Cookie MISSING: ${acc}`);
                throw new Error(`Cookie file not found: ${accPath}`);
            }
        }

        console.log('\n[PUBLISH] All validations passed. Starting upload...');

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
        };

        // Dispatch to appropriate uploader
        switch (type) {
            case PlatformType.XIAOHONGSHU: await postVideoXhs(opts); break;
            case PlatformType.TENCENT: await postVideoTencent(opts); break;
            case PlatformType.DOUYIN: await postVideoDouyin(opts); break;
            case PlatformType.KUAISHOU: await postVideoKs(opts); break;
            case PlatformType.BILIBILI: await postVideoBilibili(opts); break;
            default: throw new Error(`Unknown platform type: ${type}`);
        }

        console.log(`\n[PUBLISH] Task ${taskId} completed successfully!`);
        taskService.updateTaskStatus(taskId, 'completed', 100);
    } catch (error: any) {
        console.error(`\n[PUBLISH] Task ${taskId} FAILED: ${error.message}`);
        console.error(error.stack);
        taskService.updateTaskStatus(taskId, 'failed', undefined, error.message);
    }
}

/**
 * Start publish task in background (non-blocking).
 * Uses setImmediate to not block the event loop.
 */
export function startPublishThread(taskId: string, publishData: any): void {
    setImmediate(() => {
        runPublishTask(taskId, publishData).catch(err => {
            console.error(`[PUBLISH] Unhandled error in task ${taskId}: ${err.message}`);
        });
    });
}
