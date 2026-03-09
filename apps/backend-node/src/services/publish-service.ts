/**
 * Publish service for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/publish_service.py
 *
 * Orchestrates video publishing to each platform by calling uploaders.
 */

import type { UploadOptions } from '../db/models.js';
import { generateScheduleTimeNextDay } from '../utils/files-times.js';
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

export async function postVideoDouyin(opts: UploadOptions): Promise<void> {
    const { DouyinUploader } = await import('../uploader/douyin/main.js');
    const uploader = new DouyinUploader();
    await uploader.upload(enrichOpts(opts));
}

export async function postVideoTencent(opts: UploadOptions): Promise<void> {
    const { TencentUploader } = await import('../uploader/tencent/main.js');
    const uploader = new TencentUploader();
    await uploader.upload(enrichOpts(opts));
}

export async function postVideoXhs(opts: UploadOptions): Promise<void> {
    const { XiaohongshuUploader } = await import('../uploader/xiaohongshu/main.js');
    const uploader = new XiaohongshuUploader();
    await uploader.upload(enrichOpts(opts));
}

export async function postVideoKs(opts: UploadOptions): Promise<void> {
    const { KuaishouUploader } = await import('../uploader/kuaishou/main.js');
    const uploader = new KuaishouUploader();
    await uploader.upload(enrichOpts(opts));
}

export async function postVideoBilibili(opts: UploadOptions): Promise<void> {
    const { BilibiliUploader } = await import('../uploader/bilibili/main.js');
    const uploader = new BilibiliUploader();
    await uploader.upload(enrichOpts(opts));
}

