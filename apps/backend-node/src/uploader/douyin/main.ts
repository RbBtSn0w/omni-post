/// <reference lib="dom" />
/**
 * Douyin (TikTok China) video uploader.
 * Mirrors: apps/backend/src/uploader/douyin_uploader/main.py
 */

import * as fs from 'node:fs';
import { type BrowserContext, type Locator, type Page } from 'playwright';
import { createScreenshotDir, debugScreenshot } from '../../core/browser.js';
import { VIDEOS_DIR } from '../../core/config.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { safeJoin } from '../../utils/path.js';
import { BaseUploader } from '../base-uploader.js';

export class DouyinUploader extends BaseUploader {
    protected platformName = 'Douyin';

    /**
     * 强力清理所有遮挡元素
     * 不仅仅是隐藏，而是彻底禁用交互并移除
     */
    private async cleanGuidingOverlays(page: Page): Promise<void> {
        this.log('正在执行全页面扫障 (清理引导层与拦截元素)...');
        try {
            await page.evaluate(() => {
                // 1. 定义已知阻碍元素的特征类名
                const blockerSelectors = [
                    '.shepherd-element',
                    '.shepherd-modal-overlay-container',
                    '.dy-creator-pc-master__wrap',
                    '.dy-creator-content-portal', // 很多弹窗和气泡的根节点
                    '[class*="guide"]',
                    '[class*="tooltip"]',
                    '[class*="presetItem"]', // 日志中出现的拦截项
                    '.semi-popover-wrapper',
                    '.semi-modal-mask'
                ];

                blockerSelectors.forEach(sel => {
                    (document as any).querySelectorAll(sel).forEach((el: any) => {
                        // 智能判定：如果是引导类内容，直接物理移除
                        const text = el.innerText || '';
                        if (
                            text.includes('我知道了') ||
                            text.includes('下一步') ||
                            text.includes('引导') ||
                            el.classList.contains('shepherd-element')
                        ) {
                            el.remove();
                        } else {
                            // 如果不确定，则让其“透明”，点击可穿透
                            el.style.pointerEvents = 'none';
                            el.style.userSelect = 'none';
                        }
                    });
                });
            });
        } catch (e) {
            // ignore errors during cleanup
        }
    }

    /**
     * 健壮的点击方法：如果普通点击被拦截，则使用 JS 强制触发
     */
    private async safeClick(locator: Locator, desc: string): Promise<void> {
        try {
            // 尝试强制点击 (force: true 绕过 actionability 检查)
            await locator.click({ force: true, timeout: 5000 });
        } catch (error: any) {
            this.log(`${desc} 受到严重干扰，尝试 JS 原生点击回退...`, 'warn');
            // 终极方案：直接在浏览器环境执行 click()，无视任何遮挡
            await locator.evaluate(el => (el as any).click()).catch(e => {
                throw new Error(`${desc} 彻底失败: ${e.message}`);
            });
        }
    }

    private async waitForPublishPageReady(page: Page): Promise<void> {
        this.log('等待发布详情页彻底就绪 (监听 VOD Commit 信号)...');
        try {
            await page.waitForResponse(
                (response) =>
                    response.url().includes('CommitUploadInner') &&
                    response.status() === 200,
                { timeout: 1200000 }
            );
            this.log('抖音后端已确认视频分片合并完成');
        } catch (error) {
            this.log('未检测到明确的后端就绪信号，将尝试继续...', 'warn');
        }
    }

    private async prepareFormWhileUploading(page: Page, opts: UploadOptions, i: number): Promise<void> {
        const { title, tags, enableTimer, videosPerDay, dailyTimes, startDays, productLink, productTitle } = opts;

        try {
            await page.waitForURL(url =>
                url.pathname.includes('/creator-micro/content/post/video') ||
                url.pathname.includes('/creator-micro/content/publish'),
                { timeout: 60000 }
            );

            // 跳转后立即清理一次
            await this.cleanGuidingOverlays(page);

            if (title) {
                this.log('正在并行填充标题...');
                const { primary, fallback } = this.getDouyinTitleInput(page);
                try {
                    await primary.waitFor({ state: 'visible', timeout: 15000 });
                    await primary.fill(title.slice(0, 30));
                } catch (e) {
                    await fallback.click();
                    await page.keyboard.press('ControlOrMeta+a');
                    await page.keyboard.press('Delete');
                    await page.keyboard.type(title);
                }
            }

            const targetThumbnail = opts.thumbnailPath || (opts as any).thumbnail;
            this.log(targetThumbnail ? '检测到封面配置' : '未配置封面，准备确认系统推荐');
            await this.setThumbnail(page, targetThumbnail ? safeJoin(VIDEOS_DIR, targetThumbnail) : null);

            if (tags && tags.length > 0) {
                this.log('正在并行添加标签...');
                const zoneInput = page.locator('.zone-container').first();
                if (await zoneInput.count()) {
                    for (const tag of tags.slice(0, 5)) {
                        await zoneInput.type(`#${tag}`);
                        await page.keyboard.press('Space');
                        await page.waitForTimeout(500);
                    }
                }
            }

            const thirdPartSwitch = page.locator('[class^="info"] > [class^="first-part"] div div.semi-switch').first();
            if (await thirdPartSwitch.count() > 0) {
                const isChecked = await thirdPartSwitch.evaluate(el => el.classList.contains('semi-switch-checked'));
                if (!isChecked) {
                    await thirdPartSwitch.locator('input.semi-switch-native-control').click();
                }
            }

            if (productLink && productTitle) {
                await this.setProductLink(page, productLink, productTitle);
            }

            this.log('并行表单处理完成');
        } catch (error: any) {
            this.log(`并行处理表单失败: ${error.message}`, 'error');
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

    async postVideo(
        context: BrowserContext,
        opts: UploadOptions,
        onProgress: (progress: number) => void
    ): Promise<void> {
        const { fileList } = opts;
        const page = await this.createPage(context);
        const screenshotDir = createScreenshotDir('douyin');
        const uploadUrl = 'https://creator.douyin.com/creator-micro/content/upload';

        try {
            await page.goto(uploadUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });

            for (let i = 0; i < fileList.length; i++) {
                const videoFile = fileList[i];
                const videoPath = safeJoin(VIDEOS_DIR, videoFile);
                this.log(`上传视频 ${i + 1}/${fileList.length}: ${videoFile}`);

                const stats = fs.statSync(videoPath);
                const totalSizeBytes = stats.size;
                let uploadedBytes = 0;

                const uploadProgressListener = (request: any) => {
                    const rawUrl = request.url();
                    let hostname = '';
                    try {
                        hostname = new URL(rawUrl).hostname.toLowerCase();
                    } catch {
                        return;
                    }

                    const hostLabels = hostname.split('.');
                    const isTrustedUploadHost = hostname === 'bytedance.com'
                        || hostname.endsWith('.bytedance.com')
                        || hostname === 'byteimg.com'
                        || hostname.endsWith('.byteimg.com')
                        || hostname === 'pstatp.com'
                        || hostname.endsWith('.pstatp.com')
                        || hostname === 'volcengine.com'
                        || hostname.endsWith('.volcengine.com');

                    if (isTrustedUploadHost && request.method() === 'POST') {
                        const buffer = request.postDataBuffer();
                        if (buffer) {
                            uploadedBytes += buffer.length;
                            const filePercent = uploadedBytes / totalSizeBytes;
                            const globalPercent = Math.floor(((i + filePercent * 0.99) / fileList.length) * 100);
                            onProgress(globalPercent);
                        }
                    }
                };

                try {
                    page.on('request', uploadProgressListener);
                    const fileInput = page.locator('input[type="file"]').first();

                    const waitReadyPromise = this.waitForPublishPageReady(page);
                    const fillFormPromise = this.prepareFormWhileUploading(page, opts, i);
                    const uploadActionPromise = fileInput.setInputFiles(videoPath);

                    await Promise.all([uploadActionPromise, waitReadyPromise, fillFormPromise]);
                } finally {
                    page.removeListener('request', uploadProgressListener);
                }

                // 关键点：点击发布前进行终极清理
                await this.cleanGuidingOverlays(page);
                await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`, '发布前');

                const publishBtn = page.getByRole('button', { name: '发布', exact: true }).first();
                await publishBtn.waitFor({ state: 'visible', timeout: 60000 });

                this.log(`正在点击发布并等待后端确认...`);

                // 建立监听
                const responsePromise = page.waitForResponse(
                    (resp) => (resp.url().includes('/web/api/media/aweme/create') || resp.url().includes('/item/commit')) && resp.status() === 200,
                    { timeout: 120000 }
                ).catch(() => null); // 捕捉监听器异常，防止 Node 崩溃

                // 使用安全点击
                await this.safeClick(publishBtn, '发布按钮');

                const response = await responsePromise;
                if (response) {
                    this.log(`视频 ${i + 1} 发布成功`);
                } else {
                    this.log(`等待接口响应超时，判定跳转结果...`, 'warn');
                    await page.waitForURL(url => url.pathname.includes('/content/manage'), { timeout: 30000 });
                    this.log(`视频 ${i + 1} 已进入管理页`);
                }

                onProgress(Math.floor(((i + i + 1) / (fileList.length * 2)) * 100));
            }
        } catch (error: any) {
            this.log(`上传任务中断: ${error.message}`, 'error');
            throw error;
        } finally {
            await page.close().catch(() => { });
        }
    }

    private async setThumbnail(page: Page, thumbnailPath: string | null): Promise<void> {
        this.log(thumbnailPath ? '正在设置自定义封面...' : '正在按照系统推荐流程确认横/竖封面...');
        try {
            const coverTypes = thumbnailPath ? ['选择封面'] : ['横封面', '竖封面'];

            for (const type of coverTypes) {
                // 每一步操作前都清理一下可能冒出来的引导
                await this.cleanGuidingOverlays(page);

                const coverBtn = page.locator('.cover-Jg3T4p, [class*="coverControl"], [class*="edit-cover"]')
                    .filter({ hasText: new RegExp(type) })
                    .first();

                if (await coverBtn.count() === 0) continue;

                await coverBtn.click({ force: true });
                await page.waitForSelector('div[role="dialog"], .semi-modal-content', { timeout: 15000 });

                if (thumbnailPath) {
                    const uploadInput = page.locator('div[role="dialog"] input[type="file"], .semi-modal-content input[type="file"]').first();
                    await uploadInput.setInputFiles(thumbnailPath);
                    await page.waitForTimeout(3000);
                }

                // 4. 点击完成按钮
                this.log(`正在等待 ${type} 设置“完成”按钮可用...`);
                const finishBtn = page.locator('div[role="dialog"] button, .semi-modal-content button, [role="dialog"] [role="button"]')
                    .filter({ hasText: /完成|设置竖封面|设置横封面|保存/ })
                    .last();

                await finishBtn.waitFor({ state: 'visible', timeout: 60000 });
                // 再次执行全页面清理，防止在等待期间弹出了新的蒙层
                await this.cleanGuidingOverlays(page);

                await page.waitForTimeout(1000);
                await finishBtn.evaluate(el => (el as any).click());

                // 关键点：必须等待当前弹窗彻底从 DOM 树中消失，才能进行下一轮循环
                await page.waitForSelector('div[role="dialog"], .semi-modal-content', { state: 'detached', timeout: 15000 }).catch(() => { });
                this.log(`${type} 确认成功`);
                await page.waitForTimeout(1000); // 给页面一点喘息时间
            }
            this.log('封面任务处理完毕');
        } catch (error: any) {
            this.log(`封面设置失败 (跳过): ${error.message}`, 'warn');
            await page.keyboard.press('Escape').catch(() => { });
        }
    }

    private async handleProductDialog(page: Page, productTitle: string): Promise<boolean> {
        try {
            await page.waitForSelector('input[placeholder="请输入商品短标题"]', { timeout: 10000 });
            const shortTitleInput = page.locator('input[placeholder="请输入商品短标题"]');
            await shortTitleInput.fill(productTitle.slice(0, 10));
            const finishButton = page.locator('button:has-text("完成编辑")');
            await finishButton.evaluate(el => (el as any).click());
            return true;
        } catch (error: any) {
            return false;
        }
    }

    private async setProductLink(page: Page, productLink: string, productTitle: string): Promise<boolean> {
        try {
            const dropdown = page.locator('.semi-select').filter({ hasText: '添加标签' }).first();
            await dropdown.click({ force: true });
            await page.locator('[role="option"]:has-text("购物车")').click({ force: true });
            await page.locator('input[placeholder="粘贴商品链接"]').fill(productLink);
            await page.locator('span:has-text("添加链接")').click({ force: true });
            await page.waitForTimeout(2000);
            return await this.handleProductDialog(page, productTitle);
        } catch (error: any) {
            return false;
        }
    }

    async upload(opts: UploadOptions): Promise<void> {
        throw new Error('Please use postVideo instead.');
    }
}
