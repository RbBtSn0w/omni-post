/**
 * Publish service for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/publish_service.py
 *
 * Orchestrates video publishing to each platform by calling uploaders.
 */

import path from 'path';
import { COOKIES_DIR } from '../core/config.js';
import { launchBrowser, setInitScript } from '../core/browser.js';
import type { UploadOptions } from '../db/models.js';
import { generateScheduleTimeNextDay } from '../utils/files-times.js';
import { safeJoin } from '../utils/path.js';

export type { UploadOptions };

// ─── Upload Interface ────────────────────────────────────────────────
// Interface moved to src/db/models.ts

/**
 * Compute publish datetimes for scheduled publishing.
 * Mirrors Python's DefaultPublishService._get_publish_datetimes()
 */
function getPublishDatetimes(
    fileCount: number,
    enableTimer?: boolean,
    videosPerDay?: number,
    dailyTimes?: number[] | null,
    startDays?: number,
): (Date | number | 0)[] {
    if (enableTimer) {
        return generateScheduleTimeNextDay(
            fileCount, videosPerDay || 1, dailyTimes || null, false, startDays || 0
        );
    }
    return Array(fileCount).fill(0);
}

/**
 * Enrich options with computed publish datetimes before dispatching to uploaders.
 */
function enrichOpts(opts: UploadOptions): UploadOptions {
    const publishDatetimes = getPublishDatetimes(
        opts.fileList.length,
        opts.enableTimer,
        opts.videosPerDay,
        opts.dailyTimes,
        opts.startDays,
    );
    return { ...opts, publishDatetimes };
}

// ─── Platform Publish Functions ──────────────────────────────────────

async function runWithOptimizedBrowser(
    opts: UploadOptions,
    uploaderFactory: () => Promise<any>
): Promise<void> {
    const browser = await launchBrowser();
    const enrichedOpts = enrichOpts(opts);
    
    try {
        const uploader = await uploaderFactory();
        
        for (const accountFile of opts.accountList) {
            let cookiePath: string;
            try {
                cookiePath = safeJoin(COOKIES_DIR, accountFile);
            } catch (error) {
                console.error(`[PublishService] Invalid account path: ${accountFile}`);
                continue;
            }

            const context = await setInitScript(
                await browser.newContext({ storageState: cookiePath })
            );
            
            try {
                // Use the standardized postVideo method if available, fallback to upload
                if (typeof uploader.postVideo === 'function') {
                    await uploader.postVideo(context, enrichedOpts, (_progress: number) => {
                        // Progress logging can be added here
                    });
                } else if (typeof uploader.upload === 'function') {
                    // Fallback for non-refactored uploaders
                    await uploader.upload({ ...enrichedOpts, accountList: [accountFile] }, context, browser);
                }
            } finally {
                await context.close();
            }
        }
    } finally {
        await browser.close();
    }
}

export async function postVideoDouyin(opts: UploadOptions): Promise<void> {
    const { DouyinUploader } = await import('../uploader/douyin/main.js');
    await runWithOptimizedBrowser(opts, async () => new DouyinUploader());
}

export async function postVideoTencent(opts: UploadOptions): Promise<void> {
    const { TencentUploader } = await import('../uploader/tencent/main.js');
    await runWithOptimizedBrowser(opts, async () => new TencentUploader());
}

export async function postVideoXhs(opts: UploadOptions): Promise<void> {
    const { XiaohongshuUploader } = await import('../uploader/xiaohongshu/main.js');
    await runWithOptimizedBrowser(opts, async () => new XiaohongshuUploader());
}

export async function postVideoKs(opts: UploadOptions): Promise<void> {
    const { KuaishouUploader } = await import('../uploader/kuaishou/main.js');
    await runWithOptimizedBrowser(opts, async () => new KuaishouUploader());
}

export async function postVideoBilibili(opts: UploadOptions): Promise<void> {
    const { BilibiliUploader } = await import('../uploader/bilibili/main.js');
    await runWithOptimizedBrowser(opts, async () => new BilibiliUploader());
}
