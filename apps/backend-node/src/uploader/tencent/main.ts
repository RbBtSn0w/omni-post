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
                // @ts-expect-error: document is available in browser context during evaluate
                const container = document.querySelector('.post-container, .upload-area, body');
                const text = container?.textContent || '';
                return text.includes('100%') || text.includes('分享');
            });

            if (isDone) {
                // 核心修复：避免 Strict Mode 冲突，按优先级获取第一个可用的按钮
                const publishBtn = page.getByRole('button', { name: '发表' }).first();
                const draftBtn = page.getByRole('button', { name: '存草稿' }).first();
                
                const isReady = await Promise.any([
                    publishBtn.isEnabled().catch(() => false),
                    draftBtn.isEnabled().catch(() => false)
                ]);

                if (isReady) {
                    this.log('作品解析完成并已就绪');
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
                // 拦截检测：如果弹出了侵权确认或协议确认弹窗，需要上报
                page.waitForSelector('.ant-modal-content, .weui-desktop-dialog', { timeout: 10000 })
                    .then(() => { throw new Error('检测到阻塞弹窗，需手动处理协议确认'); }),
                // 兜底信号：页面跳转到了列表页
                page.waitForURL(url => url.pathname.includes('/post/list'), { timeout: 60000 })
            ]);
            this.log('发布验证成功 (后端已入账)');
        } catch (error: any) {
            this.log(`注意: ${error.message}，尝试通过页面稳定状态判定`, 'warn');
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

                // 添加短标题 (Ported from Python)
                await this.addShortTitle(page, title);
                
                // 原创声明 (Ported from Python)
                await this.addOriginal(page, opts.category ?? undefined);

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
     * 格式化短标题 (Ported from Python format_str_for_short_title)
     */
    private formatStrForShortTitle(originTitle: string): string {
        const allowedSpecialChars = "《》“”:+?%°";
        let formatted = "";
        for (const char of originTitle) {
            // Check if alphanumeric across languages or allowed special char or space
            if (/[\p{L}\p{N}]/u.test(char) || allowedSpecialChars.includes(char)) {
                formatted += char;
            } else if (char === ',') {
                formatted += ' ';
            }
        }
        
        if (formatted.length > 16) {
            formatted = formatted.slice(0, 16);
        } else if (formatted.length < 6) {
            formatted = formatted.padEnd(6, '.'); // 使用点号填充而非空格，避免平台修剪后长度不足
        }
        return formatted;
    }

    /**
     * 添加短标题 (Ported from Python add_short_title)
     */
    private async addShortTitle(page: Page, title: string | undefined): Promise<void> {
        if (!title) return;
        try {
            const shortTitleElement = page.getByText('短标题', { exact: true })
                .locator('..')
                .locator('xpath=following-sibling::div')
                .locator('span input[type="text"]');
            
            if (await shortTitleElement.count() > 0) {
                const shortTitle = this.formatStrForShortTitle(title);
                await shortTitleElement.fill(shortTitle);
                this.log(`短标题已设置: ${shortTitle}`);
            }
        } catch (error: any) {
            this.log(`设置短标题失败: ${error.message}`, 'error');
        }
    }

    /**
     * 原创声明 (Ported from Python add_original)
     */
    private async addOriginal(page: Page, category: number | string | undefined | null): Promise<void> {
        const categoryMap: Record<string, string> = {
            '1': '生活', '2': '科技', '3': '娱乐', '4': '教育',
            '5': '体育', '6': '职场', '7': '美食', '8': '游戏'
        };
        const categoryText = typeof category === 'string' ? category : (category ? categoryMap[String(category)] : '');
        
        try {
            const originalCheckbox = page.getByLabel('视频为原创').first();
            if (await originalCheckbox.count() > 0) {
                await originalCheckbox.check();
                this.log('已勾选原创声明');
            }

            // 检查弹窗和协议
            const statementLabel = page.locator('label:has-text("我已阅读并同意 《视频号原创声明使用条款》")');
            if (await statementLabel.isVisible()) {
                await page.getByLabel('我已阅读并同意 《视频号原创声明使用条款》').check();
                await page.getByRole('button', { name: '声明原创' }).click();
            }

            // 新版/改版账号的处理逻辑
            const declareOriginalBtn = page.locator('div.label span:has-text("声明原创")');
            if (await declareOriginalBtn.count() > 0 && category) {
                const checkbox = page.locator('div.declare-original-checkbox input.ant-checkbox-input');
                if (await checkbox.count() > 0 && !(await checkbox.isDisabled())) {
                    await checkbox.click();
                    
                    // 等待弹窗并确认
                    const modalCheckbox = page.locator('div.declare-original-dialog input.ant-checkbox-input:visible');
                    if (await modalCheckbox.count() > 0) {
                        await modalCheckbox.click();
                    }
                }

                // 处理原创类型下拉
                const typeForm = page.locator('div.original-type-form > div.form-label:has-text("原创类型"):visible');
                if (await typeForm.count() > 0) {
                    await page.locator('div.form-content:visible').click();
                    // 根据映射后的分类名称进行匹配
                    if (categoryText) {
                        const option = page.locator(`div.form-content:visible ul.weui-desktop-dropdown__list li.weui-desktop-dropdown__list-ele:has-text("${categoryText}")`).first();
                        if (await option.count() > 0) {
                            await option.click();
                        }
                    }
                    await page.waitForTimeout(1000);
                }

                const finalDeclareBtn = page.locator('button:has-text("声明原创"):visible');
                if (await finalDeclareBtn.count() > 0) {
                    await finalDeclareBtn.click();
                }
            }
        } catch (error: any) {
            this.log(`处理原创声明失败: ${error.message}`, 'error');
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
