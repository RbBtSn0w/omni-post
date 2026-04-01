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
import type { Browser, BrowserContext } from 'playwright';

export type { UploadOptions };
type ProgressHandler = (progress: number) => void;
type UploaderLike = {
    postArticle?: (context: BrowserContext | null, options: UploadOptions, onProgress: ProgressHandler) => Promise<void>;
    postVideo?: (context: BrowserContext | null, options: UploadOptions, onProgress: ProgressHandler) => Promise<void>;
    upload?: (options: UploadOptions, context: BrowserContext | null, browser: Browser | null) => Promise<void>;
};

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

async function dispatchUploader(
    uploader: UploaderLike,
    context: BrowserContext | null,
    opts: UploadOptions,
    browser: Browser | null,
    onProgress?: ProgressHandler
): Promise<void> {
    const progressHandler: ProgressHandler = onProgress || (() => {});
    if (typeof uploader.postArticle === 'function' && opts.article) {
        await uploader.postArticle(context, opts, progressHandler);
        return;
    }
    if (typeof uploader.postVideo === 'function') {
        await uploader.postVideo(context, opts, progressHandler);
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
    uploaderFactory: () => Promise<UploaderLike>,
    onProgress?: ProgressHandler
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
            await dispatchUploader(uploader, context, enrichedOpts, null, onProgress);
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
                    browser,
                    onProgress
                );
            } finally {
                await context.close();
            }
        }
    } finally {
        await browser.close();
    }
}

export async function postVideoDouyin(opts: UploadOptions, onProgress?: ProgressHandler): Promise<void> {
    const { DouyinUploader } = await import('../uploader/douyin/main.js');
    await runWithOptimizedBrowser(opts, async () => new DouyinUploader(), onProgress);
}

export async function postVideoWxChannels(opts: UploadOptions, onProgress?: ProgressHandler): Promise<void> {
    const { WxChannelsUploader } = await import('../uploader/wx_channels/main.js');
    await runWithOptimizedBrowser(opts, async () => new WxChannelsUploader(), onProgress);
}

export async function postVideoXhs(opts: UploadOptions, onProgress?: ProgressHandler): Promise<void> {
    const { XiaohongshuUploader } = await import('../uploader/xiaohongshu/main.js');
    await runWithOptimizedBrowser(opts, async () => new XiaohongshuUploader(), onProgress);
}

export async function postVideoKs(opts: UploadOptions, onProgress?: ProgressHandler): Promise<void> {
    const { KuaishouUploader } = await import('../uploader/kuaishou/main.js');
    await runWithOptimizedBrowser(opts, async () => new KuaishouUploader(), onProgress);
}

export async function postVideoBilibili(opts: UploadOptions, onProgress?: ProgressHandler): Promise<void> {
    const { BilibiliUploader } = await import('../uploader/bilibili/main.js');
    await runWithOptimizedBrowser(opts, async () => new BilibiliUploader(), onProgress);
}

export async function postArticleZhihu(opts: UploadOptions, onProgress?: ProgressHandler): Promise<void> {
    const { ZhihuUploader } = await import('../uploader/zhihu/main.js');
    await runWithOptimizedBrowser(opts, async () => new ZhihuUploader(), onProgress);
}

export async function postArticleJuejin(opts: UploadOptions, onProgress?: ProgressHandler): Promise<void> {
    const { JuejinUploader } = await import('../uploader/juejin/main.js');
    await runWithOptimizedBrowser(opts, async () => new JuejinUploader(), onProgress);
}

/**
 * Entry point for any OpenCLI-based dynamic platform.
 */
export async function postOpenCLI(opts: UploadOptions, onProgress?: ProgressHandler): Promise<void> {
    const { OpenCLIUploader } = await import('../uploader/opencli/main.js');
    const uploader = new OpenCLIUploader();
    const enrichedOpts = enrichOpts(opts);
    
    // Bypasses runWithOptimizedBrowser as CLI tools don't need Playwright contexts
    await dispatchUploader(uploader, null, enrichedOpts, null, onProgress);
}
