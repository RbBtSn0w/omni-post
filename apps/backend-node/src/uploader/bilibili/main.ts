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
                        const titleInput = page.locator('input[placeholder*="标题"], .video-title input').first();
                        await titleInput.waitFor({ state: 'visible', timeout: 30000 });
                        await titleInput.fill(title);
                    }

                    if (tags && tags.length > 0) {
                        const tagInput = page.locator('.tag-container input, .video-tag input, input[placeholder*="标签"]').first();
                        if (await tagInput.count() > 0) {
                            for (const tag of tags) {
                                await tagInput.fill(tag);
                                await page.keyboard.press('Enter');
                                await page.waitForTimeout(500);
                            }
                        }
                    }

                    // Fill description (Python parity)
                    const descArea = page.locator('.desc-container .ql-editor, .video-desc textarea, textarea[placeholder*="简介"]').first();
                    if (await descArea.count() > 0) {
                        const descText = `${title}\n${tags.map(t => '#' + t).join(' ')}`;
                        await descArea.click();
                        await page.keyboard.press('Control+KeyA');
                        await page.keyboard.press('Backspace');
                        await descArea.fill(descText);
                    }

                    // Select category/zone if provided
                    if (category) {
                        bilibiliLogger.info(`[Bilibili] 设置分区: ${category}`);
                        // TODO: Implement category selection if needed
                    }

                    await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`);

                    // Ensure '自制' (Self-produced) is selected (Type)
                    const selfCreatedRadio = page.locator('span:text("自制"), label:has-text("自制")').first();
                    if (await selfCreatedRadio.count() > 0) {
                        await selfCreatedRadio.click();
                        await page.waitForTimeout(500);
                    }

                    // Attempt to click publish button
                    bilibiliLogger.info(`[Bilibili] 尝试点击发布按钮...`);
                    // Scroll to bottom to ensure UI renders submit container
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                    await page.waitForTimeout(2000);

                    // Include generic button:has-text / div:has-text in case of DOM changes
                    const publishBtn = page.locator('.submit-container .cc-btn, .submit-btn, .submit-add, button:has-text("立即投稿"), div:has-text("立即投稿"), button:has-text("发布")').first();

                    try {
                        await publishBtn.waitFor({ state: 'attached', timeout: 30000 });
                        await publishBtn.scrollIntoViewIfNeeded();
                        await publishBtn.click({ force: true });
                    } catch (e) {
                        bilibiliLogger.error(`[Bilibili] 无法点击发布按钮: ${e}`);
                        await debugScreenshot(page, screenshotDir, `submit_failed_${i}.png`);
                        throw e;
                    }

                    bilibiliLogger.info(`[Bilibili] 视频 ${i + 1} 投稿成功`);
                    await page.waitForTimeout(5000);
                    await debugScreenshot(page, screenshotDir, `after_publish_${i}.png`);
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
