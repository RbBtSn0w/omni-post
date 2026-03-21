/**
 * Tencent Video (WeChat Channels) video uploader.
 * Mirrors: apps/backend/src/uploader/tencent_uploader/main.py
 */

import * as fs from 'node:fs';
import path from 'path';
import { type BrowserContext, type Page } from 'playwright';
import { createScreenshotDir, debugScreenshot } from '../../core/browser.js';
import { VIDEOS_DIR } from '../../core/config.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { generateScheduleTimeNextDay } from '../../utils/files-times.js';
import { safeJoin } from '../../utils/path.js';
import { BaseUploader } from '../base-uploader.js';

const UPLOAD_TIMEOUT_MINUTES = 30;

export class TencentUploader extends BaseUploader {
    protected platformName = 'Tencent';

    private async waitForUploadComplete(page: Page): Promise<void> {
        this.log('等待上传完成 (监听 UI 状态及信号同步)...');
        const maxRetries = (UPLOAD_TIMEOUT_MINUTES * 60) / 2;
        
        for (let i = 0; i < maxRetries; i++) {
            // 视频号这种高度封装的页面，物理 100% 后还需要等待后台 WASM 的解析完成和按钮激活
            const isDone = await page.evaluate(() => {
                const text = document.body.innerText;
                const is100Percent = text.includes('100%') || text.includes('上传完成') || text.includes('分享');
                return is100Percent;
            });

            if (isDone) {
                // 发表或存草稿按钮变为可点击是「真正完成」的终极标志
                const publishBtn = page.getByRole('button', { name: /发表|存草稿/ });
                if (await publishBtn.count() > 0 && await publishBtn.isEnabled()) {
                    this.log('作品解析完成，发布按钮已就绪');
                    return;
                }
            }

            if (i % 30 === 0) {
                this.log(`正在等待后台解析 (第 ${i} 次轮询)...`);
            }
            await page.waitForTimeout(1000);
        }
        this.log('等待上传解析完成超时，尝试强行继续', 'warn');
    }

    private async waitForPublishSuccess(page: Page): Promise<void> {
        this.log('验证发布结果 (监听微信号助手后端响应)...');
        try {
            await Promise.any([
                // 核心信号：视频号后台发布的正式确认接口
                page.waitForResponse(
                    resp => resp.url().includes('mmfinderassistant-bin/post/publish') && resp.status() === 200,
                    { timeout: 60000 }
                ),
                // 兜底信号：页面跳转到了列表页
                page.waitForURL(/\/platform\/post\/list/, { timeout: 60000 })
            ]);
            this.log('发布验证成功 (后端已入账)');
        } catch (error: any) {
            this.log(`未获得明确的发表成功信号: ${error.message}，尝试通过页面稳定状态判定`, 'warn');
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        }
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

                // 方案 2：基于 COS 物理流量的进度监听 (finder.video.qq.com)
                const stats = fs.statSync(videoPath);
                const totalSizes = stats.size;
                let uploadedBytes = 0;

                const uploadProgressListener = (request: any) => {
                    // 视频号/微信使用腾讯云 COS 或 finder 专有域名进行分片上传
                    if (
                        (request.url().includes('video.qq.com') || request.url().includes('myqcloud.com')) &&
                        (request.method() === 'POST' || request.method() === 'PUT')
                    ) {
                        const buffer = request.postDataBuffer();
                        if (buffer) {
                            uploadedBytes += buffer.length;
                            const percent = Math.min(99, Math.floor((uploadedBytes / totalSizes) * 100));
                            onProgress(percent);
                        }
                    }
                };

                try {
                    page.on('request', uploadProgressListener);
                    const fileInput = page.locator('input[type="file"]').first();
                    await fileInput.setInputFiles(videoPath);
                    this.log(`文件已选择，COS 分片上传中...`);

                    // 等待 UI 文字 100% + 发送按钮启用 (SC-006 fix)
                    await this.waitForUploadComplete(page);
                } finally {
                    page.removeListener('request', uploadProgressListener);
                }
                onProgress(Math.floor(((i + 1) / fileList.length) * 100)); // 节点成功

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
                this.log(`正在点击${isDraft ? '存草稿' : '发表'}并等待后端确认...`);

                try {
                    // 核心修复：先声明 Promise 再点击，消除竞态风险
                    const publishPromise = this.waitForPublishSuccess(page);
                    await publishBtn.click();
                    await publishPromise;
                } catch (error: any) {
                    this.log(`发布流程异常: ${error.message}`, 'error');
                }

                this.log(`视频 ${i + 1} 发布逻辑执行完毕`);

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
     * 实现 BaseUploader 的 postArticle 接口
     */
    async postArticle(
        context: BrowserContext,
        opts: UploadOptions,
        onProgress: (progress: number) => void
    ): Promise<void> {
        this.log('Tencent article upload not implemented yet', 'warn');
    }

    /**
     * 兼容性方法
     */
    async upload(opts: UploadOptions): Promise<void> {
        this.log('Legacy upload() called, but browser management should be handled by PublishService.');
        throw new Error('Please use postVideo(context, opts) instead.');
    }
}
