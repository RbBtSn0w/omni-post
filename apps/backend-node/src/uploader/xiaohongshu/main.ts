/**
 * Xiaohongshu (Little Red Book) video uploader.
 * Mirrors: apps/backend/src/uploader/xiaohongshu_uploader/main.py
 */

import path from 'path';
import { createScreenshotDir, debugScreenshot, launchBrowser, setInitScript } from '../../core/browser.js';
import { COOKIES_DIR, VIDEOS_DIR } from '../../core/config.js';
import { xiaohongshuLogger } from '../../core/logger.js';
import type { UploadOptions } from '../../services/publish-service.js';

export class XiaohongshuUploader {
    async upload(opts: UploadOptions): Promise<void> {
        const { title, fileList, tags, accountList, enableTimer, videosPerDay, dailyTimes, startDays } = opts;

        xiaohongshuLogger.info(`[XHS] 开始上传 - 标题: ${title}, 文件数: ${fileList.length}`);

        for (const accountFile of accountList) {
            const cookiePath = path.join(COOKIES_DIR, accountFile);
            const browser = await launchBrowser();
            const context = await setInitScript(
                await browser.newContext({ storageState: cookiePath })
            );
            const page = await context.newPage();
            const screenshotDir = createScreenshotDir('xiaohongshu');

            try {
                await page.goto('https://creator.xiaohongshu.com/publish/publish', {
                    waitUntil: 'networkidle',
                });

                for (let i = 0; i < fileList.length; i++) {
                    const videoPath = path.join(VIDEOS_DIR, fileList[i]);
                    xiaohongshuLogger.info(`[XHS] 上传视频 ${i + 1}/${fileList.length}`);

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
                    xiaohongshuLogger.info(`[XHS] 视频 ${i + 1} 发布成功`);
                    await page.waitForTimeout(3000);
                }
            } catch (error: any) {
                xiaohongshuLogger.error(`[XHS] 上传失败: ${error.message}`);
                throw error;
            } finally {
                await page.close();
                await context.close();
                await browser.close();
            }
        }
    }
}
