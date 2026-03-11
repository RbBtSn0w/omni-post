/**
 * Xiaohongshu (Little Red Book) video uploader.
 * Mirrors: apps/backend/src/uploader/xiaohongshu_uploader/main.py
 */

import path from 'path';
import { type BrowserContext } from 'playwright';
import { createScreenshotDir, debugScreenshot } from '../../core/browser.js';
import { VIDEOS_DIR } from '../../core/config.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { safeJoin } from '../../utils/path.js';
import { BaseUploader } from '../base-uploader.js';

export class XiaohongshuUploader extends BaseUploader {
    protected platformName = 'Xiaohongshu';

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
        const screenshotDir = createScreenshotDir('xiaohongshu');

        try {
            await page.goto('https://creator.xiaohongshu.com/publish/publish', {
                waitUntil: 'networkidle',
            });

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
                await page.waitForTimeout(5000);

                if (title) {
                    const titleInput = page.locator('#composerTitleInput, .title input').first();
                    await titleInput.fill(title);
                }

                if (tags && tags.length > 0) {
                    const descInput = page.locator('#composerDescInput, .desc-input').first();
                    for (const tag of tags) {
                        await descInput.type(`#${tag} `);
                        await page.waitForTimeout(500);
                    }
                }

                await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`, '发布前');
                const publishBtn = page.getByRole('button', { name: '发布' });
                await publishBtn.click();
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
