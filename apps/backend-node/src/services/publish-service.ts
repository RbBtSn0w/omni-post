/**
 * Publish service for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/publish_service.py
 *
 * Orchestrates video publishing to each platform by calling uploaders.
 */

import { COOKIES_DIR } from '../core/config.js';
import { launchBrowser, launchPersistentContext, setInitScript } from '../core/browser.js';
import type { UploadOptions } from '../db/models.js';
import { generateScheduleTimeNextDay } from '../utils/files-times.js';
import { safeJoin } from '../utils/path.js';
import { browserService } from './browser_service.js';

export type { UploadOptions };

/**
 * Compute publish datetimes for scheduled publishing.
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

async function dispatchUploader(uploader: any, context: any, opts: UploadOptions, browser: any): Promise<void> {
    if (typeof uploader.postArticle === 'function' && opts.article) {
        await uploader.postArticle(context, opts, (_progress: number) => {});
        return;
    }
    if (typeof uploader.postVideo === 'function') {
        await uploader.postVideo(context, opts, (_progress: number) => {});
        return;
    }
    if (typeof uploader.upload === 'function') {
        await uploader.upload(opts, context, browser);
        return;
    }
    throw new Error('Uploader does not implement a supported publish method');
}

// ─── Platform Publish Functions ──────────────────────────────────────

async function runWithOptimizedBrowser(
    opts: UploadOptions,
    uploaderFactory: () => Promise<any>
): Promise<void> {
    const enrichedOpts = enrichOpts(opts);
    const uploader = await uploaderFactory();

    // Strategy 1: Local Session Reuse
    if (opts.browser_profile_id) {
        const profile = browserService.getProfile(opts.browser_profile_id);
        if (!profile) {
            throw new Error(`Browser profile not found for id: ${opts.browser_profile_id}`);
        }

        console.log(`[PublishService] Using local browser profile: ${profile.name}`);
        const context = await launchPersistentContext(
            profile.user_data_dir,
            profile.profile_name
        );
        try {
            await dispatchUploader(uploader, context, enrichedOpts, null);
        } finally {
            await context.close();
        }
        return;
    }

    // Strategy 2: Managed Cookies (Fallback)
    const browser = await launchBrowser();
    try {
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
                await dispatchUploader(
                    uploader,
                    context,
                    { ...enrichedOpts, accountList: [accountFile] },
                    browser
                );
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

export async function postVideoWxChannels(opts: UploadOptions): Promise<void> {
    const { WxChannelsUploader } = await import('../uploader/wx_channels/main.js');
    await runWithOptimizedBrowser(opts, async () => new WxChannelsUploader());
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

export async function postArticleZhihu(opts: UploadOptions): Promise<void> {
    const { ZhihuUploader } = await import('../uploader/zhihu/main.js');
    await runWithOptimizedBrowser(opts, async () => new ZhihuUploader());
}

export async function postArticleJuejin(opts: UploadOptions): Promise<void> {
    const { JuejinUploader } = await import('../uploader/juejin/main.js');
    await runWithOptimizedBrowser(opts, async () => new JuejinUploader());
}
