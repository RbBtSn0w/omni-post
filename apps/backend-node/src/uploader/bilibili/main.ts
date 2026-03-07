/**
 * Bilibili video uploader.
 * Mirrors: apps/backend/src/uploader/bilibili_uploader/main.py
 */

import path from 'path';
import { createScreenshotDir, debugScreenshot, launchBrowser, setInitScript } from '../../core/browser.js';
import { COOKIES_DIR, VIDEOS_DIR } from '../../core/config.js';
import { bilibiliLogger } from '../../core/logger.js';
import type { UploadOptions } from '../../services/publish-service.js';

export class BilibiliUploader {
    async upload(opts: UploadOptions): Promise<void> {
        const { title, fileList, tags, accountList, category, enableTimer, videosPerDay, dailyTimes, startDays } = opts;

        bilibiliLogger.info(`[Bilibili] 开始上传 - 标题: ${title}, 文件数: ${fileList.length}`);

        for (const accountFile of accountList) {
            const cookiePath = path.join(COOKIES_DIR, accountFile);
            const browser = await launchBrowser();
            const context = await setInitScript(
                await browser.newContext({ storageState: cookiePath })
            );
            const page = await context.newPage();
            const screenshotDir = createScreenshotDir('bilibili');

            try {
                await page.goto('https://member.bilibili.com/platform/upload/video/frame', {
                    waitUntil: 'networkidle',
                });

                for (let i = 0; i < fileList.length; i++) {
                    const videoPath = path.join(VIDEOS_DIR, fileList[i]);
                    bilibiliLogger.info(`[Bilibili] 上传视频 ${i + 1}/${fileList.length}`);

                    const fileInput = page.locator('input[type="file"]').first();
                    await fileInput.setInputFiles(videoPath);
                    await page.waitForTimeout(5000);

                    if (title) {
                        const titleInput = page.locator('.ql-editor, [placeholder*="标题"]').first();
                        await titleInput.fill(title);
                    }

                    if (tags && tags.length > 0) {
                        const tagInput = page.locator('.tag-input-wrp input, [placeholder*="标签"]').first();
                        for (const tag of tags) {
                            await tagInput.fill(tag);
                            await page.keyboard.press('Enter');
                            await page.waitForTimeout(300);
                        }
                    }

                    // Select category/zone if provided
                    if (category) {
                        bilibiliLogger.info(`[Bilibili] 设置分区: ${category}`);
                    }

                    await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`, '发布前');
                    const publishBtn = page.getByRole('button', { name: '立即投稿' }).or(
                        page.getByRole('button', { name: '投稿' })
                    );
                    await publishBtn.click();
                    bilibiliLogger.info(`[Bilibili] 视频 ${i + 1} 投稿成功`);
                    await page.waitForTimeout(3000);
                }
            } catch (error: any) {
                bilibiliLogger.error(`[Bilibili] 上传失败: ${error.message}`);
                throw error;
            } finally {
                await page.close();
                await context.close();
                await browser.close();
            }
        }
    }
}
