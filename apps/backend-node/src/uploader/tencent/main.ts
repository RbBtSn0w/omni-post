/**
 * Tencent Video (WeChat Channels) video uploader.
 * Mirrors: apps/backend/src/uploader/tencent_uploader/main.py
 */

import path from 'path';
import { createScreenshotDir, debugScreenshot, launchBrowser, setInitScript } from '../../core/browser.js';
import { COOKIES_DIR, VIDEOS_DIR } from '../../core/config.js';
import { tencentLogger } from '../../core/logger.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { generateScheduleTimeNextDay } from '../../utils/files-times.js';

export class TencentUploader {
    async upload(opts: UploadOptions): Promise<void> {
        const {
            title, fileList, tags, accountList, category,
            enableTimer, videosPerDay, dailyTimes, startDays, isDraft,
        } = opts;

        tencentLogger.info(`[Tencent] 开始上传 - 标题: ${title}, 文件数: ${fileList.length}`);

        for (const accountFile of accountList) {
            const cookiePath = path.join(COOKIES_DIR, accountFile);
            const browser = await launchBrowser();
            const context = await setInitScript(
                await browser.newContext({ storageState: cookiePath })
            );
            const page = await context.newPage();
            const screenshotDir = createScreenshotDir('tencent');

            try {
                await page.goto('https://channels.weixin.qq.com/platform/post/create', {
                    waitUntil: 'networkidle',
                });
                await debugScreenshot(page, screenshotDir, 'upload_page.png', '上传页面');

                for (let i = 0; i < fileList.length; i++) {
                    const videoPath = path.join(VIDEOS_DIR, fileList[i]);
                    tencentLogger.info(`[Tencent] 上传视频 ${i + 1}/${fileList.length}`);

                    const fileInput = page.locator('input[type="file"]').first();
                    await fileInput.setInputFiles(videoPath);
                    await page.waitForTimeout(5000);

                    if (title) {
                        const titleInput = page.locator('.input-editor').first();
                        await titleInput.fill(title);
                    }

                    if (enableTimer && videosPerDay) {
                        const schedules = generateScheduleTimeNextDay(
                            fileList.length, videosPerDay, dailyTimes, false, startDays
                        ) as Date[];
                        if (schedules[i]) {
                            tencentLogger.info(`[Tencent] 定时发布: ${schedules[i]}`);
                        }
                    }

                    await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`, '发布前');
                    const publishBtn = page.getByRole('button', { name: isDraft ? '存草稿' : '发表' });
                    await publishBtn.click();
                    tencentLogger.info(`[Tencent] 视频 ${i + 1} 发布成功`);

                    await page.waitForTimeout(3000);
                }
            } catch (error: any) {
                tencentLogger.error(`[Tencent] 上传失败: ${error.message}`);
                throw error;
            } finally {
                await page.close();
                await context.close();
                await browser.close();
            }
        }
    }
}
