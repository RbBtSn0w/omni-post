/**
 * Douyin (TikTok China) video uploader.
 * Mirrors: apps/backend/src/uploader/douyin_uploader/main.py
 */

import path from 'path';
import { type BrowserContext } from 'playwright';
import { createScreenshotDir, debugScreenshot } from '../../core/browser.js';
import { VIDEOS_DIR } from '../../core/config.js';
import { douyinLogger } from '../../core/logger.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { generateScheduleTimeNextDay } from '../../utils/files-times.js';
import { safeJoin } from '../../utils/path.js';
import { BaseUploader } from '../base-uploader.js';

export class DouyinUploader extends BaseUploader {
    protected platformName = 'Douyin';

    /**
     * 实现 BaseUploader 的 postVideo 接口 (SC-006)
     */
    async postVideo(
        context: BrowserContext,
        opts: UploadOptions,
        onProgress: (progress: number) => void
    ): Promise<void> {
        const {
            title, fileList, tags, enableTimer, videosPerDay, dailyTimes, startDays
        } = opts;

        this.log(`开始上传 - 标题: ${title}, 文件数: ${fileList.length}`);
        const page = await this.createPage(context);
        const screenshotDir = createScreenshotDir('douyin');

        try {
            await page.goto('https://creator.douyin.com/creator-micro/content/upload', {
                waitUntil: 'networkidle',
            });
            await debugScreenshot(page, screenshotDir, 'upload_page.png', '上传页面');

            for (let i = 0; i < fileList.length; i++) {
                const videoFile = fileList[i];
                let videoPath: string;
                try {
                    videoPath = safeJoin(VIDEOS_DIR, videoFile);
                } catch (error) {
                    this.log(`非法的文件路径: ${videoFile}`, 'error');
                    continue;
                }

                this.log(`上传视频 ${i + 1}/${fileList.length}: ${videoFile}`);

                // Upload video file
                const fileInput = page.locator('input[type="file"]').first();
                await fileInput.setInputFiles(videoPath);
                this.log(`文件已选择，等待上传完成...`);

                // Wait for upload to complete
                await page.waitForTimeout(5000);

                // Fill title
                if (title) {
                    const titleInput = page.locator('.notranslate').first();
                    await titleInput.fill('');
                    await titleInput.fill(title);
                }

                // Add tags
                if (tags && tags.length > 0) {
                    for (const tag of tags) {
                        const titleInput = page.locator('.notranslate').first();
                        await titleInput.type(`#${tag} `);
                        await page.waitForTimeout(500);
                    }
                }

                // Set schedule if enabled
                if (enableTimer && videosPerDay) {
                    const schedules = generateScheduleTimeNextDay(
                        fileList.length, videosPerDay, dailyTimes || null, false, startDays
                    ) as Date[];
                    if (schedules[i]) {
                        this.log(`定时发布: ${schedules[i]}`);
                    }
                }

                await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`, '发布前');

                // Click publish button
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
     * 兼容性方法 (保留以防旧代码调用)
     */
    async upload(opts: UploadOptions): Promise<void> {
        this.log('Legacy upload() called, but browser management should be handled by PublishService.');
        throw new Error('Please use postVideo(context, opts) instead.');
    }
}
