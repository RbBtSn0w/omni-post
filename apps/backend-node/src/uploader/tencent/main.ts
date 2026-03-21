/**
 * Tencent Video (WeChat Channels) video uploader.
 * Mirrors: apps/backend/src/uploader/tencent_uploader/main.py
 */

import path from 'path';
import { type BrowserContext } from 'playwright';
import { createScreenshotDir, debugScreenshot } from '../../core/browser.js';
import { VIDEOS_DIR } from '../../core/config.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { generateScheduleTimeNextDay } from '../../utils/files-times.js';
import { safeJoin } from '../../utils/path.js';
import { BaseUploader } from '../base-uploader.js';

export class TencentUploader extends BaseUploader {
    protected platformName = 'Tencent';

    /**
     * 实现 BaseUploader 的 postVideo 接口 (SC-006)
     */
    async postVideo(
        context: BrowserContext,
        opts: UploadOptions,
        onProgress: (progress: number) => void
    ): Promise<void> {
        const {
            title, fileList, enableTimer, videosPerDay, dailyTimes, startDays, isDraft,
        } = opts;

        this.log(`开始上传 - 标题: ${title}, 文件数: ${fileList.length}`);
        const page = await this.createPage(context);
        const screenshotDir = createScreenshotDir('tencent');
        const uploadUrl = 'https://channels.weixin.qq.com/platform/post/create';

        try {
            try {
                await page.goto(uploadUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 90_000,
                });
            } catch (error: any) {
                this.log(`页面首跳超时，降级重试: ${error.message}`, 'warn');
                await page.goto(uploadUrl, {
                    waitUntil: 'commit',
                    timeout: 90_000,
                });
            }
            await debugScreenshot(page, screenshotDir, 'upload_page.png', '上传页面');

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
                    const titleInput = page.locator('.input-editor').first();
                    await titleInput.fill(title);
                }

                if (enableTimer && videosPerDay) {
                    const schedules = generateScheduleTimeNextDay(
                        fileList.length, videosPerDay, dailyTimes || null, false, startDays
                    ) as Date[];
                    if (schedules[i]) {
                        this.log(`定时发布: ${schedules[i]}`);
                    }
                }

                await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`, '发布前');
                const publishBtn = page.getByRole('button', { name: isDraft ? '存草稿' : '发表' });
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
