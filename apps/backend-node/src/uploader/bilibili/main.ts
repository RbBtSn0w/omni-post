/**
 * Bilibili video uploader.
 * Mirrors: apps/backend/src/uploader/bilibili_uploader/main.py
 */

import * as fs from 'node:fs';
import { type BrowserContext, type Page, type Locator } from 'playwright';
import { createScreenshotDir, debugScreenshot } from '../../core/browser.js';
import { VIDEOS_DIR } from '../../core/config.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { safeJoin } from '../../utils/path.js';
import { BaseUploader } from '../base-uploader.js';

export class BilibiliUploader extends BaseUploader {
    protected platformName = 'Bilibili';

    /**
     * Bilibili 目前暂未实现文章发布
     */
    public async postArticle(
        _context: BrowserContext,
        _options: UploadOptions,
        _onProgress: (progress: number) => void
    ): Promise<void> {
        this.log('Bilibili 目前暂不支持文章发布', 'warn');
        throw new Error('postArticle: Bilibili is not implemented yet');
    }

    /**
     * 强力清理 B 站页面的引导层与弹窗遮挡
     */
    private async cleanGuidingOverlays(page: Page): Promise<void> {
        this.log('执行 B 站页面扫障 (清理弹窗及引导蒙层)...');
        
        // 0. 特殊前置弹窗处理 (草稿恢复、建议设置等)
        try {
            // 解决“本地浏览器存在未提交视频，是否恢复”弹窗
            const noDraftBtn = page.locator('.bcc-dialog-footer').getByText('不用了').or(page.getByText('不用了')).first();
            if (await noDraftBtn.count() > 0 && await noDraftBtn.isVisible()) {
                this.log('点击“不用了”清理草稿恢复引导...');
                await noDraftBtn.click();
            }
        } catch (_e) {
            // Ignore if modal doesn't exist
        }

        try {
            const noSettingsBtn = page.getByRole('button', { name: '暂不设置' }).or(page.getByText('暂不设置')).first();
            if (await noSettingsBtn.count() > 0 && await noSettingsBtn.isVisible()) {
                this.log('点击“暂不设置”清理权限设置提示...');
                await noSettingsBtn.click();
            }
        } catch (_e) {
            // Ignore if settings button doesn't exist
        }

        try {
            await page.evaluate(() => {
                // 1. 常见引导类和强制弹窗的选择器
                const blockerSelectors = [
                    '.bcc-shepherd-content', // B 站常用的 shepherd 引导
                    '.shepherd-element',
                    '.vup-step-drawer-container', // 步骤引导
                    '.video-guide-container',
                    '[class*="joyride"]',
                    '.vup-joyride-spotlight',
                    '.v-modal', // 全局遮罩
                    '.v-popover-content'
                ];

                blockerSelectors.forEach(sel => {
                    (document as any).querySelectorAll(sel).forEach((el: any) => {
                        // 如果是明显的引导元素，直接移除
                        if (el.innerText?.includes('我知道了') || el.innerText?.includes('下一步') || el.classList.contains('shepherd-element')) {
                            el.remove();
                        } else {
                            // 否则禁用其交互，使其透明
                            el.style.pointerEvents = 'none';
                            el.style.opacity = '0';
                        }
                    });
                });
            });
        } catch (_e) {
            // Evaluates may fail on some frames, ignore
        }
    }

    /**
     * JS 穿透点击，对抗 B 站复杂的浮动 DOM 遮挡
     */
    private async safeClick(locator: Locator, desc: string): Promise<void> {
        try {
            await locator.click({ force: true, timeout: 5000 });
        } catch (error: any) {
            this.log(`${desc} 尝试 JS 原生点击回退...`, 'warn');
            await locator.evaluate(el => (el as any).click()).catch(e => {
                throw new Error(`${desc} 点击彻底失败: ${e.message}`);
            });
        }
    }

    /**
     * 在上传过程中并行预填表单
     */
    private async prepareFormWhileUploading(page: Page, opts: UploadOptions): Promise<void> {
        const { title, tags, category } = opts;
        try {
            // 1. 等待核心表单可用 (摒弃旧版被废弃的外层容器特征，直接等待实际必填的 Title Input)
            const titleInput = page.getByRole('textbox', { name: /请输入稿件标题/ }).or(page.locator('input[placeholder*="标题"]')).first();
            await titleInput.waitFor({ state: 'visible', timeout: 30000 });
            
            // 跳转后先扫障
            await this.cleanGuidingOverlays(page);

            // 2. 填写标题 (B站占位符: 请输入稿件标题)
            if (title) {
                this.log('[Title] 正在并行填写标题...');
                this.log(`[Title] 定位到 title input。`);
                await titleInput.clear({ timeout: 5000 }).catch(async () => {
                   this.log('[Title] 原生 clear 失败或超时，尝试 Fallback 手动 clear', 'warn');
                   await titleInput.click();
                   await titleInput.press('ControlOrMeta+a');
                   await titleInput.press('Backspace');
                });
                await titleInput.fill(title.slice(0, 80));
                this.log(`[Title] 标题填入指令结束: ${title}`);
            }

            // 3. 处理分区 (Category)
            if (category) {
                const catStr = category.toString();
                this.log(`正在选择分区: ${catStr}`);
                const categoryInput = page.locator('.select-controller').or(page.locator('.category-container, .partition-selector')).first();
                if (await categoryInput.count()) {
                    await categoryInput.click();
                    await page.waitForTimeout(1000);
                    // 尝试匹配具体文本的分区
                    const item = page.getByTitle(catStr).or(page.locator('.vup-partition-dropdown-container .item-name').filter({ hasText: catStr })).first();
                    if (await item.count()) await item.click();
                }
            }

            // 4. 处理标签 (Tags)
            if (tags && tags.length > 0) {
                this.log(`[Tags] 正在并行添加标签，收到标签数: ${tags.length}`);
                const tagInput = page.getByRole('textbox', { name: '按回车键Enter创建标签' }).or(page.locator('input[placeholder*="回车键"], input[placeholder*="标签"]')).first();
                if (await tagInput.count()) {
                    await tagInput.click();
                    this.log('[Tags] 尝试通过点击关闭按钮清空现有标签...');
                    try {
                        // 包含 subagent 找回的 svg.close (icon-sprite-off) 选择器
                        const closeBtns = await page.locator('.tag-item-v2 i, .label-item-v2-container i, .label-item-v2-container svg, .icon-close, .close-box, .tag-val .close').all();
                        this.log(`[Tags] 找到 ${closeBtns.length} 个可能的关闭按钮。`);
                        for (const el of closeBtns) {
                            if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
                                await el.click({ force: true }).catch(() => {});
                                await page.waitForTimeout(50);
                            }
                        }
                    } catch (e) {
                         this.log('[Tags] 关闭按钮清理检查出错跳过: ' + e);
                    }
                    
                    this.log('[Tags] 正在通过连发退格键作为彻底保底...');
                    try {
                        for (let i = 0; i < 20; i++) {
                            await tagInput.press('Backspace', { timeout: 1000 });
                            await page.waitForTimeout(30);
                        }
                    } catch (_e) {
                        // Backspacing is best-effort
                    }

                    this.log('[Tags] 开始输入自定义标签...');
                    for (const tag of tags.slice(0, 10)) {
                        await tagInput.click();
                        await tagInput.fill(tag);
                        await page.keyboard.press('Enter');
                        await page.waitForTimeout(300);
                    }
                    this.log('[Tags] 标签输入循环结束');
                } else {
                    this.log('[Tags] ERROR: 没有找到标签输入框定位点！', 'error');
                }
            }

            // 4.5 添加简介 (Description)
            this.log('正在并行填写简介...');
            const descInput = page.locator('.ql-editor').first();
            if (await descInput.count()) {
                const descText = `${title || ''}\n${(tags || []).map(t => '#' + t).join(' ')}`;
                await descInput.click();
                await descInput.press('ControlOrMeta+a');
                await descInput.press('Backspace');
                await descInput.fill(descText);
            }

            // 5. 确保勾选“自制”
            const selfCreated = page.locator('span').filter({ hasText: '自制' }).first();
            if (await selfCreated.count()) {
                await this.safeClick(selfCreated, '自制单选框');
            }

            this.log('并行表单预填完成');
        } catch (error: any) {
            this.log(`表单填充过程中有波动 (已跳过): ${error.message}`, 'warn');
        }
    }

    async postVideo(
        context: BrowserContext,
        opts: UploadOptions,
        onProgress: (progress: number) => void
    ): Promise<void> {
        const { fileList } = opts;
        const page = await this.createPage(context);
        const screenshotDir = createScreenshotDir('bilibili');
        const uploadUrl = 'https://member.bilibili.com/platform/upload/video/frame';

        try {
            await page.goto(uploadUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });

            for (let i = 0; i < fileList.length; i++) {
                const videoFile = fileList[i];
                const videoPath = safeJoin(VIDEOS_DIR, videoFile);
                this.log(`上传视频 ${i + 1}/${fileList.length}: ${videoFile}`);

                const stats = fs.statSync(videoPath);
                const totalSizeBytes = stats.size;
                let uploadedBytes = 0;

                // 进度监听：B 站分片通常走 multipart/part
                const uploadProgressListener = (request: any) => {
                    if (request.url().includes('upload/multipart') && request.method() === 'POST') {
                        const buffer = request.postDataBuffer();
                        if (buffer) {
                            uploadedBytes += buffer.length;
                            const filePercent = Math.min(uploadedBytes / totalSizeBytes, 1);
                            const globalPercent = Math.floor(((i + filePercent * 0.99) / fileList.length) * 100);
                            onProgress(globalPercent);
                        }
                    }
                };

                try {
                    page.on('request', uploadProgressListener);

                    // 前置扫障：必须在选择文件前清理“恢复草稿”等阻断弹窗
                    this.log('正在执行上传前置页面扫障...');
                    await this.cleanGuidingOverlays(page);
                    await page.waitForTimeout(1000);

                    // 补充前置状态截图以便排查
                    await debugScreenshot(page, screenshotDir, `pre_upload_state_${i}.png`);

                    // 2. 尝试多种方式触发上传：
                    // A. 先尝试点击唤醒上传组件 (拦截 FileChooser)
                    let injected = false;
                    const bigUploadBtn = page.getByText('上传视频').or(page.locator('.bcc-upload-wrapper')).first();
                    if (await bigUploadBtn.isVisible()) {
                        this.log('尝试点击大按钮以合法拦截 FileChooser...');
                        try {
                            const [fileChooser] = await Promise.all([
                                page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null),
                                bigUploadBtn.click({ force: true }).catch(() => {})
                            ]);
                            if (fileChooser) {
                                await fileChooser.setFiles(videoPath);
                                injected = true;
                                this.log('通过 FileChooser 拦截注入文件成功！');
                            }
                        } catch (_e) {
                            // FileChooser might not present
                        }
                    }

                    if (!injected) {
                        this.log('未能捕捉到 FileChooser，改用全量 Input [type="file"] 强力注入 + Change 事件触发...');
                        const fileInputs = await page.locator('input[type="file"]').all();
                        this.log(`定位到 ${fileInputs.length} 个 file input`);

                        for (let n = 0; n < fileInputs.length; n++) {
                            const accept = (await fileInputs[n].getAttribute('accept')) || '';
                            if (accept.includes('video') || n === 0) {
                                try {
                                    this.log(`准备向第 ${n + 1} 个 input 发注 (accept=${accept})...`);
                                    await fileInputs[n].setInputFiles(videoPath);
                                    // 关键：强制触发 change 事件，防止 B 站代码未侦听到变更
                                    await fileInputs[n].evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
                                    injected = true;
                                    this.log(`第 ${n + 1} 个 input 注入并手动触发 Change 完成。`);
                                } catch (e: any) {
                                    this.log(`第 ${n + 1} 个尝试失败: ${e.message}`, 'warn');
                                }
                            }
                        }
                    }
                    
                    if (!injected) {
                        this.log('警告：所有注入方案均未明确成功，流程可能阻塞！', 'error');
                    }
                    await page.waitForTimeout(3000); // 增加等待响应时间
                    
                    // 截取点击上传后的快照
                    await debugScreenshot(page, screenshotDir, `post_upload_state_${i}.png`);
                    
                    // 2. 文件选定后，表单页面通常会立即或在几秒内加载
                    this.log('文件已选定，开始并行处理表单预填与进度监控...');
                    
                    const fillFormPromise = this.prepareFormWhileUploading(page, opts);
                    const uploadFinishPromise = page.waitForResponse(
                        resp => resp.url().includes('complete') && resp.status() === 200, 
                        { timeout: 1200000 }
                    ).catch(() => null);

                    // 在这里并行：填表 + 等待上传完成
                    await Promise.all([fillFormPromise, uploadFinishPromise]);
                } finally {
                    page.removeListener('request', uploadProgressListener);
                }

                // 发布前的终极扫障
                await this.cleanGuidingOverlays(page);
                await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`, '发布前');

                // 寻找发布按钮: 立即投稿
                this.log('正在定位并点击“立即投稿”按钮...');
                const publishBtn = page.locator('.submit-container .submit-add, span.submit-add').or(page.getByText('立即投稿')).or(page.locator('.submit-container .cc-btn, .submit-btn, button:has-text("立即投稿")')).first();
                
                // 确保滚动到最下方以显现按钮
                await page.evaluate(() => (window as any).scrollTo(0, (document as any).body.scrollHeight));
                await page.waitForTimeout(1000);
                
                await publishBtn.scrollIntoViewIfNeeded().catch(() => {});
                await publishBtn.waitFor({ state: 'visible', timeout: 30000 });
                
                // 监听发布接口
                const addResponsePromise = page.waitForResponse(
                    resp => resp.url().includes('/x/vu/web/add/v3') && resp.status() === 200,
                    { timeout: 60000 }
                ).catch(() => null);

                await this.safeClick(publishBtn, '立即投稿按钮');

                const response = await addResponsePromise;
                if (response) {
                    this.log(`视频 ${i + 1} 投稿成功 (接口确认)`);
                } else {
                    this.log(`接口响应超时，判定跳转结果...`, 'warn');
                    await page.waitForURL(url => url.pathname.includes('/content/manage'), { timeout: 20000 });
                    this.log(`视频 ${i + 1} 已进入稿件管理页`);
                }

                onProgress(Math.floor(((i + 1) / fileList.length) * 100));
            }
        } catch (error: any) {
            this.log(`上传任务失败: ${error.message}`, 'error');
            throw error;
        } finally {
            await page.close().catch(() => {});
        }
    }

    async upload(_opts: UploadOptions): Promise<void> {
        throw new Error('Please use postVideo instead.');
    }
}
