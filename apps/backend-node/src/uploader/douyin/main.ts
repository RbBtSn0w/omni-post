/**
 * Douyin (TikTok China) video uploader.
 * Mirrors: apps/backend/src/uploader/douyin_uploader/main.py
 */

import * as fs from 'node:fs';
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
        this.log('等待发布详情页就绪 (监听 VOD Commit 信号)...');
        try {
            await Promise.any([
                // 核心信号：字节跳动标准的 VOD 入库确认接口
                page.waitForResponse(
                    (response) => 
                        response.url().includes('CommitUploadInner') && 
                        response.status() === 200,
                    { timeout: 90000 }
                ),
                // 兜底信号：URL 已经成功跳转到详情页 (兼容新旧两种 URL 变体)
                page.waitForURL(url => 
                    url.pathname.includes('/creator-micro/content/post/video') || 
                    url.pathname.includes('/creator-micro/content/publish'), 
                    { timeout: 60000 }
                )
            ]);
            
            // 二次确认：等待关键 UI 元素可见，确保非反爬拦截页面
            await this.getDouyinTitleInput(page).primary.waitFor({ state: 'visible', timeout: 10000 })
                .catch(() => this.log('详情页 UI 元素未完全就位，可能降级到了通用编辑器', 'warn'));

            this.log('发布详情页已就绪');
        } catch (error) {
            this.log('未检测到明确的就绪信号，尝试通过页面稳定状态继续...', 'warn');
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        }
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

                // 方案 2：基于分片统计实现实时进度监听
                const stats = fs.statSync(videoPath);
                const totalSizeBytes = stats.size;
                let uploadedBytes = 0;

                const uploadProgressListener = (request: any) => {
                    if (
                        (request.url().includes('bytedance.com') || request.url().includes('vod')) &&
                        request.method() === 'POST'
                    ) {
                        const buffer = request.postDataBuffer();
                        if (buffer) {
                            uploadedBytes += buffer.length;
                            // 修正进度算法，Cap at 99%，防止重试导致超过 100%
                            const percent = Math.min(99, Math.floor((uploadedBytes / totalSizeBytes) * 100));
                            onProgress(percent);
                        }
                    }
                };

                try {
                    page.on('request', uploadProgressListener);

                    // Upload video file
                    const fileInput = page.locator('input[type="file"]').first();
                    await fileInput.setInputFiles(videoPath);
                    this.log(`文件已选择，后台正在进行分片上传...`);

                    // 抖音上传后会切到发布页，先等待页面进入可编辑状态 (这代表 100% 上传完成并由后端解析)
                    await this.waitForPublishPageReady(page);
                } finally {
                    // 核心修复：无论成功失败，必须移除监听器防止内存泄漏
                    page.removeListener('request', uploadProgressListener);
                }
                
                onProgress(Math.floor(((i + i + 1) / (fileList.length * 2)) * 100)); // 该视频阶段完成 (占总进度的权重)
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
                
                this.log(`正在点击发布并等待后端确认...`);
                try {
                    // 核心修复：先声明 Promise 再点击，消除竞态风险
                    const responsePromise = page.waitForResponse(
                        (resp) => (resp.url().includes('/web/api/media/aweme/create') || resp.url().includes('/item/commit')) && resp.status() === 200,
                        { timeout: 90000 }
                    );
                    
                    await publishBtn.click();
                    await responsePromise;
                    
                    this.log(`视频 ${i + 1} 发布成功 (后端已确认)`);
                } catch (error: any) {
                    this.log(`发布响应监听超时，尝试通过页面跳转判定结果: ${error.message}`, 'warn');
                    // 降级：如果没捕获到响应，但页面跳转到了内容管理页，也视为成功
                    await page.waitForURL(url => url.pathname.includes('/content/manage'), { timeout: 10000 });
                    this.log(`视频 ${i + 1} 已跳转至管理页，判定为发布成功`);
                }

                onProgress(Math.floor(((i + 1) / fileList.length) * 100));
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
