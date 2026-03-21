/**
 * Kuaishou video uploader.
 * Mirrors: apps/backend/src/uploader/ks_uploader/main.py
 */

import { type BrowserContext, type Page } from 'playwright';
import { createScreenshotDir, debugScreenshot } from '../../core/browser.js';
import { VIDEOS_DIR } from '../../core/config.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { safeJoin } from '../../utils/path.js';
import { BaseUploader } from '../base-uploader.js';

export class KuaishouUploader extends BaseUploader {
    protected platformName = 'Kuaishou';

    private async gotoUploadPageWithRetry(page: Page, uploadUrl: string): Promise<void> {
        const attempts = [
            { waitUntil: 'domcontentloaded' as const, timeout: 90_000 },
            { waitUntil: 'commit' as const, timeout: 90_000 },
            { waitUntil: 'domcontentloaded' as const, timeout: 120_000 },
        ];

        let lastError: any;
        for (let i = 0; i < attempts.length; i++) {
            try {
                await page.goto(uploadUrl, attempts[i]);
                const currentUrl = page.url();
                if (currentUrl.startsWith('chrome-error://')) {
                    throw new Error(`页面进入浏览器错误页: ${currentUrl}`);
                }
                return;
            } catch (error: any) {
                lastError = error;
                this.log(`快手页面打开失败(第 ${i + 1} 次): ${error.message}`, 'warn');
                await page.goto('about:blank', { waitUntil: 'commit', timeout: 10_000 }).catch(() => {});
                await page.waitForTimeout(1500);
            }
        }

        throw new Error(`快手页面连续打开失败: ${lastError?.message || 'unknown error'}`);
    }

    private async waitForUploadComplete(page: Page): Promise<void> {
        const maxRetries = 90;
        for (let i = 0; i < maxRetries; i++) {
            const uploading = await page.locator('text=上传中').count();
            if (uploading === 0) {
                return;
            }
            if (i % 5 === 0) {
                this.log('检测到上传中，继续等待...');
            }
            await page.waitForTimeout(2000);
        }
        this.log('等待上传完成超时，尝试继续发布流程', 'warn');
    }

    /**
     * 实现 BaseUploader 的 postVideo 接口 (SC-006)
     */
    async postVideo(
        context: BrowserContext,
        opts: UploadOptions,
        onProgress: (progress: number) => void
    ): Promise<void> {
        const { title, fileList, tags } = opts;

        this.log(`开始上传 - 标题: ${title}, 文件数: ${fileList.length}`);
        const page = await this.createPage(context);
        const screenshotDir = createScreenshotDir('kuaishou');
        const uploadUrl = 'https://cp.kuaishou.com/article/publish/video';

        try {
            await this.gotoUploadPageWithRetry(page, uploadUrl);

            for (let i = 0; i < fileList.length; i++) {
                let videoPath: string;
                try {
                    videoPath = safeJoin(VIDEOS_DIR, fileList[i]);
                } catch (error) {
                    this.log(`非法的文件路径: ${fileList[i]}`, 'error');
                    continue;
                }
                this.log(`上传视频 ${i + 1}/${fileList.length}: ${fileList[i]}`);

                const fileInput = page.locator('input[type="file"]').first();
                await fileInput.setInputFiles(videoPath);
                await this.waitForUploadComplete(page);
                await page.waitForTimeout(1000);

                if (title) {
                    const titleContainer = page.locator('.clipped-content, [placeholder*="描述"]').first();
                    await titleContainer.fill(title);
                }

                if (tags && tags.length > 0) {
                    const tagInput = page.locator('.clipped-content, [placeholder*="描述"]').first();
                    for (const tag of tags) {
                        await tagInput.type(`#${tag} `);
                        await page.waitForTimeout(500);
                    }
                }

                await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`, '发布前');
                let publishBtn = page.getByRole('button', { name: '发布' }).first();
                if (!(await publishBtn.count())) {
                    publishBtn = page.getByText('发布', { exact: true }).first();
                }
                await publishBtn.waitFor({ state: 'visible', timeout: 60_000 });
                await publishBtn.click();

                const confirmBtn = page.getByText('确认发布');
                if (await confirmBtn.count()) {
                    await confirmBtn.first().click();
                }
                this.log(`视频 ${i + 1} 发布成功`);
                
                onProgress(Math.floor(((i + 1) / fileList.length) * 100));
                await page.waitForTimeout(3000);
            }
        } catch (error: any) {
            this.log(`上传失败: ${error.message}`, 'error');
            throw error;
        } finally {
            await page.close();
        }
    }

    /**
     * 兼容性方法
     */
    async upload(opts: UploadOptions): Promise<void> {
        this.log('Legacy upload() called, but browser management should be handled by PublishService.');
        throw new Error('Please use postVideo(context, opts) instead.');
    }
}
