/**
 * Kuaishou video uploader.
 * Mirrors: apps/backend/src/uploader/ks_uploader/main.py
 */

import * as fs from 'node:fs';
import { type BrowserContext, type Page } from 'playwright';
import { createScreenshotDir, debugScreenshot } from '../../core/browser.js';
import { VIDEOS_DIR } from '../../core/config.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { safeJoin } from '../../utils/path.js';
import { BaseUploader } from '../base-uploader.js';

export class KuaishouUploader extends BaseUploader {
    protected platformName = 'Kuaishou';

    private async gotoUploadPageWithRetry(page: Page, uploadUrl: string): Promise<void> {
        const attempts = [
            { waitUntil: 'domcontentloaded' as const, timeout: 90_000 },
            { waitUntil: 'commit' as const, timeout: 90_000 },
            { waitUntil: 'domcontentloaded' as const, timeout: 120_000 },
        ];

        let lastError: any;
        for (let i = 0; i < attempts.length; i++) {
            try {
                await page.goto(uploadUrl, attempts[i]);
                const currentUrl = page.url();
                if (currentUrl.startsWith('chrome-error://')) {
                    throw new Error(`页面进入浏览器错误页: ${currentUrl}`);
                }
                return;
            } catch (error: any) {
                lastError = error;
                this.log(`快手页面打开失败(第 ${i + 1} 次): ${error.message}`, 'warn');
                await page.goto('about:blank', { waitUntil: 'commit', timeout: 10_000 }).catch(() => {});
                await page.waitForTimeout(1500);
            }
        }

        throw new Error(`快手页面连续打开失败: ${lastError?.message || 'unknown error'}`);
    }

    /**
     * 等待视频上传并同步至平台 (监听 /upload/finish)
     * 注意：为了避免竞态风险，调用方应在触发上传动作前先行开启监听
     */
    private async waitForUploadFinishResponse(page: Page): Promise<void> {
        this.log('等待视频上传并同步至平台 (监听 /upload/finish)...');
        try {
            await page.waitForResponse(
                (response) => 
                    response.url().includes('/rest/cp/works/v2/video/pc/upload/finish') && 
                    response.request().method() === 'POST' &&
                    response.status() === 200,
                { timeout: 900_000 } // 15 minutes, suitable for large videos
            );
            this.log('视频上传已同步');
        } catch (error: any) {
            this.log(`监听上传同步超时: ${error.message}，尝试通过 UI 文字降级判定...`, 'warn');
            const success = await page.locator('text=上传成功, 已上传').count();
            if (success === 0) {
                throw new Error('无法通过网络信号或 UI 文字确认上传完成');
            }
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
        const screenshotDir = createScreenshotDir('kuaishou');
        const uploadUrl = 'https://cp.kuaishou.com/article/publish/video';

        try {
            await this.gotoUploadPageWithRetry(page, uploadUrl);

            for (let i = 0; i < fileList.length; i++) {
                let videoPath: string;
                try {
                    videoPath = safeJoin(VIDEOS_DIR, fileList[i]);
                } catch (error) {
                    this.log(`非法的文件路径: ${fileList[i]}`, 'error');
                    continue;
                }
                this.log(`上传视频 ${i + 1}/${fileList.length}: ${fileList[i]}`);

                // 方案 2：分片进度统计 (Kuaishou fragment based)
                const stats = fs.statSync(videoPath);
                const totalSizes = stats.size;
                let uploadedBytes = 0;

                const uploadProgressListener = (request: any) => {
                    // 快手分片上传发往 upload.kuaishouzt.com/api/upload/fragment
                    if (request.url().includes('/api/upload/fragment') && request.method() === 'POST') {
                        const buffer = request.postDataBuffer();
                        if (buffer) {
                            uploadedBytes += buffer.length;
                            const percent = Math.min(99, Math.floor((uploadedBytes / totalSizes) * 100));
                            onProgress(percent);
                        }
                    }
                };

                try {
                    // 将浏览器控制台日志转发到 Node 日志 (用于 DOM 审计)
                    page.on('console', msg => {
                        const text = msg.text();
                        if (text.includes('---')) {
                            this.log(`[Browser Audit] ${text}`);
                        }
                    });
                    page.on('request', uploadProgressListener);

                    // 核心修复：先创建监听 Promise，再触发文件选择动作，消除小视频秒传导致的竞态
                    const uploadFinishPromise = this.waitForUploadFinishResponse(page);

                    const fileInput = page.locator('input[type="file"]').first();
                    await fileInput.setInputFiles(videoPath);
                    this.log(`文件已选择，分片上传中...`);

                    await uploadFinishPromise;
                } finally {
                    page.removeListener('request', uploadProgressListener);
                }
                
                onProgress(Math.floor(((i + 1) / fileList.length) * 100)); // 该视频成功

                 if (title) {
                    const titleSelector = '#work-description-edit';
                    this.log('正在执行暴力清场与输入环境诊断...');
                    
                    // 1. 全量隐藏气泡、蒙层和引导 (包括截图中的领取后才可添加弹窗)
                    await page.addStyleTag({ 
                        content: `
                            #preact-border-shadow-host, [id*="tours"], ._helper_1kfmm_1, #joyride-portal, 
                            .ant-popover, .ant-tooltip, .ant-modal-root, .ant-mask, ._helper_6j0c1_1,
                            [class*="popover"], [class*="tooltip"], [class*="guide"], [class*="overlay"] { 
                                display: none !important; 
                                pointer-events: none !important; 
                                visibility: hidden !important;
                                z-index: -1 !important;
                            }
                        `
                    }).catch(() => {});

                    // 2. 诊断并打印
                    await page.evaluate(() => {
                        const results: any[] = [];
                        (document as any).querySelectorAll('*').forEach((node: any) => {
                            const style = (window as any).getComputedStyle(node);
                            const zIndex = parseInt(style.zIndex);
                            if ((zIndex > 500 || style.position === 'fixed') && style.display !== 'none') {
                                results.push({ tag: node.tagName, id: node.id, classes: node.className, zIndex });
                            }
                        });
                        console.log('--- POTENTIAL BLOCKING LAYERS ---', JSON.stringify(results.slice(0, 5)));
                    }).catch(() => {});

                    // 3. 强力填写逻辑：聚焦 + 校验 + 兜底灌注
                    const titleContainer = page.locator(titleSelector).first();
                    await titleContainer.click({ force: true });
                    
                    // 模拟输入
                    await page.keyboard.press('ControlOrMeta+a');
                    await page.keyboard.press('Backspace');
                    await titleContainer.type(title, { delay: 30 });
                    
                    // 话题处理
                    if (tags && tags.length > 0) {
                        for (const tag of tags) {
                            await titleContainer.type(` #${tag} `, { delay: 30 });
                        }
                    }

                    // 4. 内容验证与物理兜底
                    const verifyText = await titleContainer.innerText();
                    if (verifyText.length === 0) {
                        this.log('模拟输入似乎被拦截（长度为0），启动 DOM 物理注入机制...', 'warn');
                        const finalContent = `${title} ${tags?.map(t => `#${t}`).join(' ') || ''}`;
                        await page.evaluate(({ sel, content }) => {
                            const el = (document as any).querySelector(sel) as any;
                            if (el) {
                                el.innerHTML = `<div>${content}</div>`;
                                // 手动触发所有 React 监听事件
                                el.dispatchEvent(new (window as any).Event('input', { bubbles: true }));
                                el.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
                                el.blur();
                            }
                        }, { sel: titleSelector, content: finalContent });
                        this.log('DOM 物理注入已执行');
                    } else {
                        this.log(`输入成功验证: Lenne=${verifyText.length}`);
                    }
                }

                await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`, '发布前');
                
                // Hide Joyride overlays that might block the publish button
                await page.addStyleTag({ 
                    content: '#preact-border-shadow-host, [id*="tours"], ._helper_1kfmm_1, #joyride-portal { display: none !important; pointer-events: none !important; }' 
                }).catch(() => {});

                // 优先寻找带有 primary 类名的发布按钮
                let publishBtn = page.locator('div[class*="_button-primary_"], button:has-text("发布")').first();
                if (!(await publishBtn.count())) {
                    publishBtn = page.getByRole('button', { name: '发布' }).first();
                }
                this.log(`正在点击发布并等待确认响应...`);
                try {
                    // 核心修复：在点击任何按钮前先行注入响应监听，覆盖弹窗点击过程
                    const submitPromise = page.waitForResponse(
                        (resp) => resp.url().includes('/rest/cp/works/v2/video/pc/submit') && resp.status() === 200,
                        { timeout: 90000 }
                    );

                    await publishBtn.click({ force: true });

                    const confirmBtn = page.getByText('确认发布');
                    if (await confirmBtn.count()) {
                        await confirmBtn.first().click({ force: true });
                    }
                    
                    const response = await submitPromise;
                    if (response.status() !== 200) {
                        throw new Error(`后端返回异常状态码: ${response.status()}`);
                    }
                    this.log(`视频 ${i + 1} 发布成功 (后端已确认)`);
                } catch (error: any) {
                    this.log(`发布响应监听超时: ${error.message}，尝试跳转判定...`, 'warn');
                    await page.waitForURL(url => url.pathname.includes('/content/manage'), { timeout: 10000 });
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
     * @description 快手当前版本仅支持视频发布模式，文稿发布尚未实装
     */
    async postArticle(
        context: BrowserContext,
        opts: UploadOptions,
        onProgress: (progress: number) => void
    ): Promise<void> {
        this.log('Kuaishou article upload not implemented yet', 'warn');
    }

    /**
     * 兼容性方法
     */
    async upload(opts: UploadOptions): Promise<void> {
        this.log('Legacy upload() called, but browser management should be handled by PublishService.');
        throw new Error('Please use postVideo(context, opts) instead.');
    }
}
