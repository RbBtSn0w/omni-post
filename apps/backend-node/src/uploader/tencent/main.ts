/// <reference lib="dom" />
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
        this.log('等待上传解析 (Shadow DOM 类名与物理特征探测)...');
        const maxRetries = (UPLOAD_TIMEOUT_MINUTES * 60) / 2;
        
        for (let i = 0; i < maxRetries; i++) {
            const status = await page.evaluate(() => {
                const wujie = (document as any).querySelector('wujie-app');
                const root = (wujie as any)?.shadowRoot;
                if (!root) return { isReady: false, msg: 'Wujie Not Ready' };
                
                // 1. 查找发表按钮
                const buttons = Array.from(root.querySelectorAll('button')) as any[];
                const publishBtn = buttons.find(b => b.textContent?.includes('发表') || b.textContent?.includes('存草稿'));
                
                // 2. 查找物理特征：上传成功后通常会出现“删除”或“重新上传”按钮
                const hasDeleteBtn = buttons.some(b => b.textContent?.includes('删除') || b.id === '删除');
                
                // 3. 检查锁定类名
                const classes = publishBtn?.className || '';
                const isLocked = classes.includes('weui-desktop-btn_disabled');
                
                // 真正就绪的判定：按钮存在、锁定类名消失、且物理删除按钮已渲染
                const isReady = !!publishBtn && !isLocked && hasDeleteBtn;
                
                return { isReady, isLocked, hasDeleteBtn, classes, msg: `Locked: ${isLocked}, Delete: ${hasDeleteBtn}` };
            });

            if (status.isReady) {
                this.log('视频号组件解析完全就绪，等待 UI 状态沉降...');
                await page.waitForTimeout(500); // 关键：给 Wujie 一点点渲染缓冲时间
                return;
            }

            if (i % 20 === 0) {
                this.log(`正在同步组件状态: ${status.msg}`);
            }
            await page.waitForTimeout(1000);
        }
        this.log('等待组件就绪超时，尝试强行继续', 'warn');
    }

    private async waitForPublishSuccess(page: Page): Promise<void> {
        this.log('验证发布结果 (监听微信号助手后端响应)...');
        try {
            await Promise.any([
                // 核心信号：新版视频号发布接口 (post_create)
                page.waitForResponse(
                    resp => (resp.url().includes('post/publish') || resp.url().includes('post/post_create')) && resp.status() === 200,
                    { timeout: 60000 }
                ),
                // 监听包含 wujie-app 穿透的弹窗
                page.waitForSelector('wujie-app >> .ant-modal-content, wujie-app >> .weui-desktop-dialog', { timeout: 15000 })
                    .then(() => { throw new Error('检测到阻塞弹窗 (Shadow DOM)'); }),
                // 兜底信号：页面跳转
                page.waitForURL(url => url.pathname.includes('/post/list'), { timeout: 60 * 1000 })
            ]);
            this.log('发布验证成功 (后端已入账)');
        } catch (error: any) {
            this.log(`注意: ${error.message}，尝试通过列表状态判定`, 'warn');
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
                    const url = request.url();
                    // 1. 拦截分片完成信号 -> 立即标记为 99% (让用户知道网传完了)
                    if (url.includes('completepartuploaddfs') && request.method() === 'POST') {
                        onProgress(99);
                        this.log('所有分片已传输系统，正在等待云端最终合包与解析...');
                    }

                    // 2. 尝试监听微信官方的进度心跳包 (最准)
                    if (url.includes('helper_mmdata') && request.method() === 'POST') {
                        try {
                            const postData = request.postData();
                            if (postData) {
                                const data = JSON.parse(postData);
                                // 查找包含 UploadProgress 的项
                                for (const item of (data?.body || [])) {
                                    if (item.UploadProgress?.progress) {
                                        const rawPercent = parseFloat(item.UploadProgress.progress);
                                        if (!isNaN(rawPercent)) {
                                            onProgress(Math.floor(Math.min(99, rawPercent)));
                                            return;
                                        }
                                    }
                                }
                            }
                        } catch {
                            // 忽略解析错误
                        }
                    }

                    // 2. 兜底逻辑：流量分片监听
                    let hostname = '';
                    try {
                        hostname = new URL(url).hostname.toLowerCase();
                    } catch {
                        return;
                    }

                    const isTrustedUploadHost = hostname === 'video.qq.com'
                        || hostname.endsWith('.video.qq.com')
                        || hostname === 'myqcloud.com'
                        || hostname.endsWith('.myqcloud.com');

                    if (
                        isTrustedUploadHost &&
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
                    const fileInput = page.locator('wujie-app >> input[type="file"]').first();
                await fileInput.setInputFiles(videoPath);
                this.log(`文件已选择，COS 分片上传中...`);

                    // 等待 UI 文字 100% + 发送按钮启用 (SC-006 fix)
                    await this.waitForUploadComplete(page);
                } finally {
                    page.removeListener('request', uploadProgressListener);
                }
                onProgress(Math.floor(((i + 1) / fileList.length) * 100)); // 节点成功

                if (title) {
                    const titleInput = page.locator('wujie-app >> .input-editor').first();
                    await titleInput.click();
                    // 清空原有内容
                    await page.keyboard.press('ControlOrMeta+a');
                    await page.keyboard.press('Backspace');
                    
                    // 话题处理：输入话题后必须跟空格，且一次性填入
                    let finalTitle = title;
                    if (opts.tags && opts.tags.length > 0) {
                        for (const tag of opts.tags) {
                            finalTitle += ` #${tag} `; 
                        }
                    }
                    await titleInput.fill(finalTitle);
                    this.log(`标题描述已填入 (Shadow DOM 注入成功)`);
                }

                // 添加短标题
                await this.addShortTitle(page, title);
                
                // 原创声明
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
                
                const publishBtn = page.locator('wujie-app').getByRole('button', { name: isDraft ? '存草稿' : '发表' }).first();
                this.log(`正在点击${isDraft ? '存草稿' : '发表'}并等待后端确认...`);

                try {
                    // 核心修复：先声明 Promise 再点击，消除竞态风险
                    const publishPromise = this.waitForPublishSuccess(page);
                    await publishBtn.click({ force: true });
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
            // 穿透 Shadow DOM 寻找短标题输入框 (Placeholder: 概括视频主要内容...)
            const shortTitleElement = page.locator('wujie-app >> input.weui-desktop-form__input[placeholder*="概括视频"]').first();
            
            if (await shortTitleElement.count() > 0) {
                const shortTitle = this.formatStrForShortTitle(title);
                await shortTitleElement.fill(shortTitle);
                this.log(`短标题已设置: ${shortTitle}`);
            } else {
                this.log('未找到短标题输入框 (Shadow DOM)', 'warn');
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
            const originalCheckbox = page.locator('wujie-app >> label:has-text("视频为原创")').first();
            if (await originalCheckbox.count() > 0) {
                await originalCheckbox.click(); // Ant Design checkbox 通常点击 label 触发
                this.log('已勾选原创声明');
            }

            // 检查弹窗和协议
            const statementLabel = page.locator('wujie-app >> label:has-text("我已阅读并同意 《视频号原创声明使用条款》")');
            if (await statementLabel.isVisible()) {
                await statementLabel.click();
                await page.locator('wujie-app >> button:has-text("声明原创")').click();
                await page.waitForTimeout(1000);

                // --- 补全缺失的类别选择逻辑 ---
                if (categoryText) {
                    this.log(`正在选择原创分类: ${categoryText}`);
                    // 找到类型下拉框并点击
                    const typeSelect = page.locator('wujie-app >> .weui-desktop-dropdown__label:has-text("请选择类型"), wujie-app >> .weui-desktop-dropdown__label').first();
                    if (await typeSelect.isVisible()) {
                        await typeSelect.click();
                        await page.waitForTimeout(500);
                        // 在展开的列表中寻找对应的分类文字
                        const option = page.locator(`wujie-app >> .weui-desktop-dropdown__list-ele:has-text("${categoryText}")`).first();
                        if (await option.isVisible()) {
                            await option.click();
                            this.log(`原创分类已选定: ${categoryText}`);
                        }
                    }
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
