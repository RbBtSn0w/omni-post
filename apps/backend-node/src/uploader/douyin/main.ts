/**
 * Douyin (TikTok China) video uploader.
 * Mirrors: apps/backend/src/uploader/douyin_uploader/main.py
 */

import path from 'path';
import { createScreenshotDir, debugScreenshot, launchBrowser, setInitScript } from '../../core/browser.js';
import { COOKIES_DIR, VIDEOS_DIR } from '../../core/config.js';
import { douyinLogger } from '../../core/logger.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { generateScheduleTimeNextDay } from '../../utils/files-times.js';

export class DouyinUploader {
    async upload(opts: UploadOptions): Promise<void> {
        const {
            title, fileList, tags, accountList, category,
            enableTimer, videosPerDay, dailyTimes, startDays,
            thumbnailPath, productLink, productTitle,
        } = opts;

        douyinLogger.info(`[Douyin] 开始上传 - 标题: ${title}, 文件数: ${fileList.length}, 账号数: ${accountList.length}`);

        for (const accountFile of accountList) {
            const cookiePath = path.join(COOKIES_DIR, accountFile);
            douyinLogger.info(`[Douyin] 使用账号: ${accountFile}`);

            const browser = await launchBrowser();
            const context = await setInitScript(
                await browser.newContext({ storageState: cookiePath })
            );
            const page = await context.newPage();
            const screenshotDir = createScreenshotDir('douyin');

            try {
                await page.goto('https://creator.douyin.com/creator-micro/content/upload', {
                    waitUntil: 'networkidle',
                });
                await debugScreenshot(page, screenshotDir, 'upload_page.png', '上传页面');

                for (let i = 0; i < fileList.length; i++) {
                    const videoFile = fileList[i];
                    const videoPath = path.join(VIDEOS_DIR, videoFile);
                    douyinLogger.info(`[Douyin] 上传视频 ${i + 1}/${fileList.length}: ${videoFile}`);

                    // Upload video file
                    const fileInput = page.locator('input[type="file"]').first();
                    await fileInput.setInputFiles(videoPath);
                    douyinLogger.info(`[Douyin] 文件已选择，等待上传完成...`);

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
                            fileList.length, videosPerDay, dailyTimes, false, startDays
                        ) as Date[];
                        if (schedules[i]) {
                            douyinLogger.info(`[Douyin] 定时发布: ${schedules[i]}`);
                        }
                    }

                    await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`, '发布前');

                    // Click publish button
                    const publishBtn = page.getByRole('button', { name: '发布' });
                    await publishBtn.click();
                    douyinLogger.info(`[Douyin] 视频 ${i + 1} 发布成功`);

                    await page.waitForTimeout(3000);
                }
            } catch (error: any) {
                douyinLogger.error(`[Douyin] 上传失败: ${error.message}`);
                throw error;
            } finally {
                await page.close();
                await context.close();
                await browser.close();
            }
        }

        douyinLogger.info(`[Douyin] 全部上传完成`);
    }
}
