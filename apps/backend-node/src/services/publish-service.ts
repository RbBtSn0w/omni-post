/**
 * Publish service for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/publish_service.py
 *
 * Orchestrates video publishing to each platform by calling uploaders.
 */


// ─── Upload Interface ────────────────────────────────────────────────

export interface UploadOptions {
    title: string;
    fileList: string[];
    tags: string[];
    accountList: string[];
    category?: number | null;
    enableTimer?: boolean;
    videosPerDay?: number;
    dailyTimes?: number[];
    startDays?: number;
    thumbnailPath?: string;
    productLink?: string;
    productTitle?: string;
    isDraft?: boolean;
}

// ─── Platform Publish Functions ──────────────────────────────────────

export async function postVideoDouyin(opts: UploadOptions): Promise<void> {
    const { DouyinUploader } = await import('../uploader/douyin/main.js');
    const uploader = new DouyinUploader();
    await uploader.upload(opts);
}

export async function postVideoTencent(opts: UploadOptions): Promise<void> {
    const { TencentUploader } = await import('../uploader/tencent/main.js');
    const uploader = new TencentUploader();
    await uploader.upload(opts);
}

export async function postVideoXhs(opts: UploadOptions): Promise<void> {
    const { XiaohongshuUploader } = await import('../uploader/xiaohongshu/main.js');
    const uploader = new XiaohongshuUploader();
    await uploader.upload(opts);
}

export async function postVideoKs(opts: UploadOptions): Promise<void> {
    const { KuaishouUploader } = await import('../uploader/kuaishou/main.js');
    const uploader = new KuaishouUploader();
    await uploader.upload(opts);
}

export async function postVideoBilibili(opts: UploadOptions): Promise<void> {
    const { BilibiliUploader } = await import('../uploader/bilibili/main.js');
    const uploader = new BilibiliUploader();
    await uploader.upload(opts);
}
