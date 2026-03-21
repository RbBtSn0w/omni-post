/**
 * Douyin (TikTok China) video uploader.
 * Mirrors: apps/backend/src/uploader/douyin_uploader/main.py
 */

import { type BrowserContext, type Page } from 'playwright';
import { createScreenshotDir, debugScreenshot } from '../../core/browser.js';
import { VIDEOS_DIR } from '../../core/config.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { generateScheduleTimeNextDay } from '../../utils/files-times.js';
import { safeJoin } from '../../utils/path.js';
import { BaseUploader } from '../base-uploader.js';

export class DouyinUploader extends BaseUploader {
    protected platformName = 'Douyin';

    private async waitForPublishPageReady(page: Page): Promise<void> {
        const maxRetries = 30;
        for (let i = 0; i < maxRetries; i++) {
            const url = page.url();
            if (
                url.includes('/creator-micro/content/publish') ||
                url.includes('/creator-micro/content/post/video')
            ) {
                return;
            }
            await page.waitForTimeout(1000);
        }
        this.log('未检测到发布页 URL，继续尝试后续流程', 'warn');
    }

    private getDouyinTitleInput(page: Page) {
        const primary = page
            .getByText('作品标题')
            .locator('..')
            .locator('xpath=following-sibling::div[1]')
            .locator('input')
            .first();
        const fallback = page.locator('.notranslate').first();
        return { primary, fallback };
    }

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
        const uploadUrl = 'https://creator.douyin.com/creator-micro/content/upload';

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

                // 抖音上传后会切到发布页，先等待页面进入可编辑状态
                await this.waitForPublishPageReady(page);
                await page.waitForTimeout(1500);

                // Fill title
                if (title) {
                    const { primary, fallback } = this.getDouyinTitleInput(page);
                    if (await primary.count()) {
                        await primary.fill(title.slice(0, 30));
                    } else {
                        await fallback.click();
                        await page.keyboard.press('Control+KeyA');
                        await page.keyboard.press('Delete');
                        await page.keyboard.type(title);
                        await page.keyboard.press('Enter');
                    }
                }

                // Add tags
                if (tags && tags.length > 0) {
                    const zoneInput = page.locator('.zone-container').first();
                    if (await zoneInput.count()) {
                        for (const tag of tags.slice(0, 5)) {
                            await zoneInput.type(`#${tag}`);
                            await page.keyboard.press('Space');
                            await page.waitForTimeout(300);
                        }
                    } else {
                        const { fallback } = this.getDouyinTitleInput(page);
                        for (const tag of tags.slice(0, 5)) {
                            await fallback.type(` #${tag}`);
                            await page.waitForTimeout(300);
                        }
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

                // Click publish button. Use exact match to avoid "高清发布" ambiguity.
                const publishBtn = page.getByRole('button', { name: '发布', exact: true }).first();
                await publishBtn.waitFor({ state: 'visible', timeout: 60_000 });
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
