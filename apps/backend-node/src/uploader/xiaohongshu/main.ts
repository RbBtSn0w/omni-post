/**
 * Xiaohongshu (Little Red Book) video uploader.
 * Mirrors: apps/backend/src/uploader/xiaohongshu_uploader/main.py
 */

import * as fs from 'node:fs';
import path from 'path';
import { type BrowserContext, type Page } from 'playwright';
import { createScreenshotDir, debugScreenshot } from '../../core/browser.js';
import { VIDEOS_DIR } from '../../core/config.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { safeJoin } from '../../utils/path.js';
import { BaseUploader } from '../base-uploader.js';

export class XiaohongshuUploader extends BaseUploader {
    protected platformName = 'Xiaohongshu';

    private async waitForUploadReady(page: Page): Promise<void> {
        this.log('等待小红书转码及就绪信号 (深入解析同步状态)...');
        try {
            // 核心修复：不仅等 HTTP 200，还要检查 Body 里的业务状态
            await page.waitForResponse(
                async (response) => {
                    const isMatch = response.url().includes('query_transcode') && response.status() === 200;
                    if (isMatch) {
                        try {
                            const data = await response.json();
                            // 小红书转码成功的业务逻辑判定：status 1 代表就绪
                            const isReady = data?.data?.video?.status === 1 || data?.success === true;
                            if (isReady) return true;
                        } catch {
                            return false;
                        }
                    }
                    return false;
                },
                { timeout: 300000 }
            );
            this.log('小红书视频已就绪');
        } catch (error: any) {
            this.log(`监听转码完成结果未知: ${error.message}，尝试降级继续`, 'warn');
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
        const { title, fileList, tags } = opts;

        this.log(`开始上传 - 标题: ${title}, 文件数: ${fileList.length}`);
        const page = await this.createPage(context);
        const screenshotDir = createScreenshotDir('xiaohongshu');

        try {
            await page.goto('https://creator.xiaohongshu.com/publish/publish', {
                waitUntil: 'domcontentloaded',
            });

            for (let i = 0; i < fileList.length; i++) {
                let videoPath: string;
                try {
                    videoPath = safeJoin(VIDEOS_DIR, fileList[i]);
                } catch (error) {
                    this.log(`非法的文件路径: ${fileList[i]}`, 'error');
                    continue;
                }
                this.log(`上传视频 ${i + 1}/${fileList.length}: ${fileList[i]}`);

                // 方案 2：基于 XHS 自研频谱云存储 (xhscdn.com) 的进度监听
                const stats = fs.statSync(videoPath);
                const totalSizes = stats.size;
                let uploadedBytes = 0;

                const uploadProgressListener = (request: any) => {
                    let hostname = '';
                    try {
                        hostname = new URL(request.url()).hostname.toLowerCase();
                    } catch {
                        return;
                    }

                    const isTrustedUploadHost = hostname === 'xhscdn.com'
                        || hostname.endsWith('.xhscdn.com')
                        || hostname === 'xhscloud.com'
                        || hostname.endsWith('.xhscloud.com');

                    // 小红书分片发往 xhscdn.com 或 xhsupload 域名，方法为 PUT
                    if (
                        isTrustedUploadHost &&
                        request.method() === 'PUT'
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
                    this.log(`文件已选择，频谱分片上传中...`);

                    await this.waitForUploadReady(page);
                } finally {
                    page.removeListener('request', uploadProgressListener);
                }
                onProgress(Math.floor(((i + 1) / fileList.length) * 100)); // 节点成功

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
                this.log(`点击发布并等待确认信号...`);
                try {
                    // 核心修复：先声明 Promise 再点击，规避竞态
                    const submitPromise = page.waitForResponse(
                        (resp) => resp.url().includes('web_api/sns/v2/note') && resp.status() === 200,
                        { timeout: 90000 }
                    );
                    
                    await publishBtn.click();
                    await submitPromise;
                    this.log(`视频 ${i + 1} 发布成功 (小红书已收录)`);
                } catch (error: any) {
                    this.log(`未监听到发布成功响应: ${error.message}，尝试跳转判定`, 'warn');
                    await page.waitForURL(url => url.pathname.includes('/content/manage'), { timeout: 10000 }).catch(() => {});
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
     * 实现 BaseUploader 的 postArticle 接口
     * @description 小红书目前仅支持视频发布模式
     */
    async postArticle(
        context: BrowserContext,
        opts: UploadOptions,
        onProgress: (progress: number) => void
    ): Promise<void> {
        this.log('Xiaohongshu article upload not implemented yet', 'warn');
    }

    /**
     * 兼容性方法
     */
    async upload(opts: UploadOptions): Promise<void> {
        this.log('Legacy upload() called, but browser management should be handled by PublishService.');
        throw new Error('Please use postVideo(context, opts) instead.');
    }
}
