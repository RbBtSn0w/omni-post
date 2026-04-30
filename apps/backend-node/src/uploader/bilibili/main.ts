/**
 * Bilibili video uploader.
 * Mirrors: apps/backend/src/uploader/bilibili_uploader/main.py
 */

import * as fs from 'node:fs';
import { type BrowserContext, type Locator, type Page, type Request, type Response } from 'playwright';
import { createScreenshotDir, debugScreenshot } from '../../core/browser.js';
import { VIDEOS_DIR } from '../../core/config.js';
import type { UploadOptions } from '../../services/publish-service.js';
import { safeJoin } from '../../utils/path.js';
import { BaseUploader } from '../base-uploader.js';

type UploadStartProbeKind = 'started' | 'timeout' | 'runtime_failure';

interface RuntimeFailureDiagnostic {
    phase: string;
    errorType: string;
    message: string;
    accountOrTaskId: string;
}

interface UploadStartProbeResult {
    kind: UploadStartProbeKind;
    diagnostic?: RuntimeFailureDiagnostic;
}

export class BilibiliUploader extends BaseUploader {
    protected platformName = 'Bilibili';
    private readonly blockedPublishTextPattern = /上传中|处理中|转码中|请稍候|不可投稿|暂不可用|刷新中|加载中|准备中|提交中/i;
    private static readonly DIAGNOSTIC_TEXT_LIMIT = 50;

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
            await page.evaluate(`() => {
                const blockerSelectors = [
                    '.bcc-shepherd-content',
                    '.shepherd-element',
                    '.vup-step-drawer-container',
                    '.video-guide-container',
                    '[class*="joyride"]',
                    '.vup-joyride-spotlight',
                    '.v-modal',
                    '.v-popover-content'
                ];

                blockerSelectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => {
                        const htmlEl = el;
                        if (htmlEl.innerText?.includes('我知道了') || htmlEl.innerText?.includes('下一步') || htmlEl.classList.contains('shepherd-element')) {
                            htmlEl.remove();
                        } else {
                            htmlEl.style.pointerEvents = 'none';
                            htmlEl.style.opacity = '0';
                        }
                    });
                });
            }`);
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
     * 判断是否为值得重点追踪的 B 站上传相关请求
     */
    private isDiagnosticRequest(url: string): boolean {
        return [
            'preupload',
            'upload/multipart',
            '/complete',
            'member.bilibili.com/preupload',
            '/x/vu/web/add/v3',
            '/x/vu/web/add',
            'archive/add',
            'upos',
            'bilivideo.com'
        ].some(keyword => url.includes(keyword));
    }

    /**
     * 判断是否为稿件提交接口
     */
    private isSubmitRequest(url: string): boolean {
        return [
            '/x/vu/web/add/v3',
            '/x/vu/web/add',
            'archive/add'
        ].some(keyword => url.includes(keyword));
    }

    /**
     * 判断是否为上传已经启动的请求信号
     */
    private isUploadStartRequest(url: string): boolean {
        return [
            '/upload/multipart/new',
            '/upload/multipart/part',
            'bilivideo.com',
            'upos'
        ].some(keyword => url.includes(keyword));
    }

    /**
     * 文件注入后验证上传是否真的启动，避免 FileChooser 假成功
     */
    private isTimeoutError(error: unknown): boolean {
        const message = (error as Error | undefined)?.message ?? '';
        return /timeout|timed out|Timeout \d+ms exceeded/i.test(message);
    }

    private toRuntimeFailureDiagnostic(error: unknown, phase: string, accountOrTaskId: string): RuntimeFailureDiagnostic {
        const err = error as Error | undefined;
        return {
            phase,
            errorType: err?.name || 'Error',
            message: err?.message || String(error),
            accountOrTaskId,
        };
    }

    private probeRuntimeFailureResult(error: unknown, phase: string, accountOrTaskId: string): UploadStartProbeResult {
        const diagnostic = this.toRuntimeFailureDiagnostic(error, phase, accountOrTaskId);
        this.log(`[UploadProbe][runtime_failure] ${JSON.stringify(diagnostic)}`, 'error');
        return { kind: 'runtime_failure', diagnostic };
    }

    private probeTimeoutResult(error: unknown, phase: string, accountOrTaskId: string): UploadStartProbeResult {
        const diagnostic = this.toRuntimeFailureDiagnostic(error, phase, accountOrTaskId);
        this.log(`[UploadProbe][timeout] phase=${phase} accountOrTaskId=${accountOrTaskId} detail=${diagnostic.message}`, 'warn');
        return { kind: 'timeout' };
    }

    private async waitForUploadStartSignal(
        page: Page,
        timeout = 8000,
        phase = 'upload_probe',
        accountOrTaskId = 'unknown'
    ): Promise<UploadStartProbeResult> {
        const titleReadyPromise = page
            .getByRole('textbox', { name: /请输入稿件标题/ })
            .or(page.locator('input[placeholder*="标题"]'))
            .first()
            .waitFor({ state: 'visible', timeout })
            .then((): UploadStartProbeResult => ({ kind: 'started' }))
            .catch((error: unknown): UploadStartProbeResult => {
                if (this.isTimeoutError(error)) {
                    return this.probeTimeoutResult(error, phase, accountOrTaskId);
                }
                return this.probeRuntimeFailureResult(error, phase, accountOrTaskId);
            });

        const requestReadyPromise = page
            .waitForRequest(req => this.isUploadStartRequest(req.url()), { timeout })
            .then((): UploadStartProbeResult => ({ kind: 'started' }))
            .catch((error: unknown): UploadStartProbeResult => {
                if (this.isTimeoutError(error)) {
                    return this.probeTimeoutResult(error, phase, accountOrTaskId);
                }
                return this.probeRuntimeFailureResult(error, phase, accountOrTaskId);
            });

        const started = await Promise.race([requestReadyPromise, titleReadyPromise]);
        if (started.kind === 'runtime_failure') {
            return started;
        }
        return started.kind === 'started' ? started : { kind: 'timeout' };
    }

    /**
     * 判断按钮当前状态是否允许点击投稿
     */
    private isPublishButtonReadyState(state: {
        disabled: boolean;
        ariaDisabled: string | null;
        className: string;
        text: string;
        pointerEvents: string;
    }): boolean {
        const disabledByClass = /disabled|is-disabled|btn-disabled|forbid|ban|gray|grey/i.test(state.className);
        const blockedByText = this.blockedPublishTextPattern.test(state.text);
        return !state.disabled && state.ariaDisabled !== 'true' && !disabledByClass && state.pointerEvents !== 'none' && !blockedByText;
    }

    /**
     * 将文本节点/内层 span 规整到真正可点击的按钮节点
     */
    private async normalizePublishButton(locator: Locator): Promise<Locator> {
        const clickableAncestor = locator.locator(
            'xpath=ancestor-or-self::*[self::button or @role="button" or contains(@class,"cc-btn") or contains(@class,"submit-btn") or contains(@class,"submit-add")][1]'
        ).first();
        if (await clickableAncestor.count().catch(() => 0)) {
            const tag = await clickableAncestor.evaluate((el: any) => el.tagName).catch(() => '');
            if (tag === 'SPAN') {
                const parent = clickableAncestor.locator('xpath=..').first();
                if (await parent.count().catch(() => 0)) {
                    return parent;
                }
            }
            return clickableAncestor;
        }
        return locator.first();
    }

    /**
     * 读取按钮诊断信息，便于判断是否点到了错误元素或禁用按钮
     */
    private async getPublishButtonState(locator: Locator): Promise<{
        tagName: string;
        text: string;
        className: string;
        parentClassName: string;
        disabled: boolean;
        ariaDisabled: string | null;
        pointerEvents: string;
    }> {
        const normalizedLocator = await this.normalizePublishButton(locator);
        return normalizedLocator.evaluate((el: any, limit: number) => {
            let target = (
                el.closest?.('button, [role="button"], .cc-btn, .submit-btn, .submit-add')
                ?? el
            ) as any;
            if (target.tagName === 'SPAN' && target.parentElement) {
                target = target.parentElement;
            }
            const getStyle = (globalThis as any).getComputedStyle;
            const parent = target.parentElement as any;
            
            let textResult = target.innerText?.trim() ?? '';
            textResult = textResult.replace(/\n| /g, ' ');
            if (textResult.length > limit) {
                textResult = textResult.substring(0, limit) + '...';
            }

            return {
                tagName: target.tagName,
                text: textResult,
                className: target.className ?? '',
                disabled: Boolean(target.disabled),
                ariaDisabled: target.getAttribute('aria-disabled'),
                pointerEvents: getStyle ? getStyle(target).pointerEvents : '',
                parentClassName: parent?.className ?? '',
            };
        }, BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT);
    }

    /**
     * 等待短时间内是否出现投稿请求（用于判断点击是否真正触发了提交）
     */
    private async waitForSubmitRequestStart(page: Page, timeout = 4000): Promise<boolean> {
        try {
            await page.waitForRequest(req => this.isSubmitRequest(req.url()), { timeout });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 收集当前页面可见的投稿按钮候选，按优先级返回
     */
    private async getVisibleSubmitCandidates(page: Page): Promise<Locator[]> {
        const selectors = [
            '.submit-container button:has-text("立即投稿")',
            '.submit-container .submit-btn:has-text("立即投稿")',
            '.submit-container .cc-btn:has-text("立即投稿")',
            '.submit-container .submit-add',
            'button:has-text("立即投稿")',
            '[role="button"]:has-text("立即投稿")',
            '[class*="submit"]:has-text("立即投稿")',
            'div:has-text("立即投稿")',
            'span:has-text("立即投稿")',
        ];

        const result: Locator[] = [];
        for (const selector of selectors) {
            const locator = page.locator(selector).first();
            const visible = await locator.isVisible().catch(() => false);
            if (visible) {
                result.push(await this.normalizePublishButton(locator));
            }
        }

        const roleBtn = page.getByRole('button', { name: '立即投稿', exact: true }).first();
        if (await roleBtn.isVisible().catch(() => false)) {
            result.push(await this.normalizePublishButton(roleBtn));
        }

        return result;
    }

    /**
     * 输出投稿候选节点状态，便于排查绑定事件所在真实节点
     */
    private async logSubmitCandidateDiagnostics(candidates: Locator[]): Promise<void> {
        let index = 0;
        for (const candidate of candidates) {
            try {
                const state = await this.getPublishButtonState(candidate);
                this.log(`[SubmitCandidate#${index + 1}] ${state.tagName} text=${state.text || '<empty>'} class=${state.className || '<empty>'} parentClass=${state.parentClassName || '<empty>'} disabled=${state.disabled} ariaDisabled=${state.ariaDisabled ?? '<null>'} pointerEvents=${state.pointerEvents}`);
            } catch (error: any) {
                this.log(`[SubmitCandidate#${index + 1}] 状态读取失败: ${error.message}`, 'warn');
            }
            index += 1;
        }
        if (index === 0) {
            this.log('[SubmitCandidate] 未找到可见投稿候选节点', 'warn');
        }
    }

    /**
     * 用多种方式触发投稿，直到观测到提交请求发出
     */
    private async triggerSubmitWithFallback(page: Page, publishBtn: Locator): Promise<boolean> {
        const candidates = await this.getVisibleSubmitCandidates(page);
        await this.logSubmitCandidateDiagnostics(candidates);

        const attempts: Array<() => Promise<void>> = [
            async () => {
                await this.safeClick(publishBtn, '立即投稿按钮');
            },
            ...candidates.map((candidate, idx) => async () => {
                await this.safeClick(candidate, `投稿候选按钮#${idx + 1}`);
            }),
            ...candidates.map((candidate, idx) => async () => {
                const box = await candidate.boundingBox();
                if (!box) {
                    throw new Error(`投稿候选按钮#${idx + 1} 无法获取坐标 (boundingBox=null)`);
                }
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { delay: 50 });
            }),
            async () => {
                await page.keyboard.press('Meta+Enter').catch(() => { });
                await page.keyboard.press('Control+Enter').catch(() => { });
            },
            async () => {
                await publishBtn.evaluate((el: any) => {
                    const target = el.closest?.('button, [role="button"], .cc-btn, .submit-btn, .submit-add') ?? el;
                    const g = globalThis as any;
                    const MouseEvt = g.MouseEvent;
                    const eventOptions = { bubbles: true, cancelable: true, view: g };
                    if (MouseEvt) {
                        target.dispatchEvent(new MouseEvt('pointerdown', eventOptions));
                        target.dispatchEvent(new MouseEvt('mousedown', eventOptions));
                        target.dispatchEvent(new MouseEvt('pointerup', eventOptions));
                        target.dispatchEvent(new MouseEvt('mouseup', eventOptions));
                        target.dispatchEvent(new MouseEvt('click', eventOptions));
                    } else {
                        target.click?.();
                    }
                });
            },
        ];

        for (let index = 0; index < attempts.length; index++) {
            try {
                this.log(`[SubmitTrigger] 尝试触发投稿，第 ${index + 1}/${attempts.length} 种方式`);
                await attempts[index]();
            } catch (error: any) {
                this.log(`[SubmitTrigger] 第 ${index + 1} 种触发失败: ${error.message}`, 'warn');
            }

            if (await this.waitForSubmitRequestStart(page, 4000)) {
                this.log(`[SubmitTrigger] 第 ${index + 1} 种方式已触发投稿请求`);
                return true;
            }
        }

        return false;
    }

    /**
     * 定位当前页面真实可见的投稿按钮候选
     */
    private async findVisiblePublishButton(page: Page): Promise<Locator | null> {
        const candidates = [
            page.locator('.submit-container button:has-text("立即投稿")').first(),
            page.getByRole('button', { name: '立即投稿', exact: true }).first(),
            page.locator('button:has-text("立即投稿")').first(),
            page.locator('.submit-container .submit-add').first(),
            page.locator('.submit-container .cc-btn').first(),
            page.locator('.submit-btn').first(),
            page.getByRole('button', { name: '发布', exact: true }).first(),
        ];

        for (const candidate of candidates) {
            const visible = await candidate.isVisible().catch(() => false);
            if (visible) {
                return this.normalizePublishButton(candidate);
            }
        }

        return null;
    }

    /**
     * 等待按钮真正进入可点击态，而不是只要它可见就盲点
     */
    private async waitForPublishButtonReady(page: Page, timeout = 120000): Promise<Locator> {
        const deadline = Date.now() + timeout;
        let lastStateLog = '';

        while (Date.now() < deadline) {
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.keyboard.press('End').catch(() => { });
            await this.cleanGuidingOverlays(page);

            const candidate = await this.findVisiblePublishButton(page);
            if (!candidate) {
                if (lastStateLog !== 'missing') {
                    this.log('[PublishButton] 尚未找到可见的投稿按钮，继续等待...', 'warn');
                    lastStateLog = 'missing';
                }
                await page.waitForTimeout(1500);
                continue;
            }

            const state = await this.getPublishButtonState(candidate);
            const stateLog = `${state.tagName} text=${state.text || '<empty>'} class=${state.className || '<empty>'} parentClass=${state.parentClassName || '<empty>'} disabled=${state.disabled} ariaDisabled=${state.ariaDisabled ?? '<null>'} pointerEvents=${state.pointerEvents}`;
            if (stateLog !== lastStateLog) {
                this.log(`[PublishButton] ${stateLog}`);
                lastStateLog = stateLog;
            }

            if (this.isPublishButtonReadyState(state)) {
                this.log('[PublishButton] 按钮已进入可点击状态');
                return candidate;
            }

            await page.waitForTimeout(1500);
        }

        throw new Error(`未等到可点击的投稿按钮，最后状态: ${lastStateLog || 'unknown'}`);
    }

    /**
     * 提交后若无接口返回，尽量采集表单错误和按钮状态
     */
    private async logSubmitFailureContext(page: Page, publishBtn: Locator): Promise<void> {
        try {
            const buttonState = await this.getPublishButtonState(publishBtn);
            this.log(`[SubmitDebug] 按钮状态: ${JSON.stringify(buttonState)}`, 'warn');
        } catch (error: any) {
            this.log(`[SubmitDebug] 无法读取按钮状态: ${error.message}`, 'warn');
        }

        try {
            const errorTexts = await page.locator('.bcc-form-item__error, .form-error, .error, .warning, [class*="error-text"], [class*="form-item-error"]').evaluateAll(
                els => els
                    .map((el: any) => el.innerText?.trim() ?? '')
                    .filter(Boolean)
                    .slice(0, 10)
            );
            if (errorTexts.length > 0) {
                this.log(`[SubmitDebug] 表单错误: ${errorTexts.join(' | ')}`, 'warn');
            }
        } catch (_error) {
            // Ignore diagnostics-only failures
        }

        this.log(`[SubmitDebug] 当前页面 URL: ${page.url()}`, 'warn');
    }

    /**
     * 将响应体裁剪到适合日志输出的长度
     */
    private trimForLog(text: string, maxLength = 300): string {
        const compact = text.replace(/\s+/g, ' ').trim();
        return compact.length > maxLength ? `${compact.slice(0, maxLength)}...` : compact;
    }

    /**
     * 记录关键接口响应，辅助判断上传状态机进行到哪一步
     */
    private async logResponseDiagnostics(response: Response): Promise<void> {
        const url = response.url();
        if (!this.isDiagnosticRequest(url)) return;

        const status = response.status();
        let bodyPreview = '';

        if (url.includes('/complete') || url.includes('/x/vu/web/add/v3') || url.includes('preupload')) {
            try {
                bodyPreview = this.trimForLog(await response.text());
            } catch (error: any) {
                bodyPreview = `<响应体读取失败: ${error.message}>`;
            }
        }

        const suffix = bodyPreview ? ` body=${bodyPreview}` : '';
        this.log(`[HTTP ${status}] ${url}${suffix}`);
    }

    /**
     * 记录关键请求，确认前端是否真的启动了上传/投稿流程
     */
    private logRequestDiagnostics(request: Request): void {
        const url = request.url();
        if (!this.isDiagnosticRequest(url)) return;

        const method = request.method();
        const postDataBuffer = request.postDataBuffer();
        const payloadSize = postDataBuffer?.length ?? 0;
        this.log(`[REQ ${method}] ${url} payloadBytes=${payloadSize}`);
    }

    /**
     * 记录失败请求，排查风控、跨域或上传中断问题
     */
    private logRequestFailureDiagnostics(request: Request): void {
        const url = request.url();
        if (!this.isDiagnosticRequest(url)) return;

        const failureText = request.failure()?.errorText ?? 'unknown';
        this.log(`[REQ FAILED] ${request.method()} ${url} reason=${failureText}`, 'warn');
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
                                await el.click({ force: true }).catch(() => { });
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
                const descText = `${title || ''}\n${(tags || []).map((t: string) => '#' + t).join(' ')}`;
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
                this.log(`文件绝对路径: ${videoPath}`);
                this.log(`文件大小: ${totalSizeBytes} bytes`);

                // 进度监听：B 站分片通常走 multipart/part
                const uploadProgressListener = (request: Request) => {
                    this.logRequestDiagnostics(request);
                    const url = request.url();
                    const isBilivideoHost = (() => { try { const h = new URL(url).hostname; return h === 'bilivideo.com' || h.endsWith('.bilivideo.com'); } catch { return false; } })();
                    if ((url.includes('upload/multipart') || isBilivideoHost || url.includes('upos')) && request.method() === 'POST') {
                        const buffer = request.postDataBuffer();
                        if (buffer) {
                            uploadedBytes += buffer.length;
                            const filePercent = Math.min(uploadedBytes / totalSizeBytes, 1);
                            const globalPercent = Math.floor(((i + filePercent * 0.99) / fileList.length) * 100);
                            if (uploadedBytes % (10 * 1024 * 1024) < 1024 * 1024 || filePercent === 1) { // Reduced logging frequency
                                this.log(`[UPLOAD CHUNK] file=${i + 1}/${fileList.length} chunkBytes=${buffer.length} uploadedBytes=${uploadedBytes}/${totalSizeBytes} percent=${(filePercent * 100).toFixed(2)}%`);
                            }
                            onProgress(globalPercent);
                        }
                    }
                };

                let uploadCompleteDetected = false;
                const uploadResponseListener = (response: Response) => {
                    // Check for Bilibili multipart complete response
                    if (response.url().includes('upload/multipart/complete') && response.status() === 200) {
                        uploadCompleteDetected = true;
                    }
                    void this.logResponseDiagnostics(response);
                };

                const uploadRequestFailedListener = (request: Request) => {
                    this.logRequestFailureDiagnostics(request);
                };

                try {
                    page.on('request', uploadProgressListener);
                    page.on('response', uploadResponseListener);
                    page.on('requestfailed', uploadRequestFailedListener);

                    page.once('close', () => {
                        this.log('[PageLifecycle] 页面在上传阶段被关闭', 'warn');
                    });

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
                    
                    try {
                        this.log('等待 B 站上传组件渲染...');
                        await bigUploadBtn.waitFor({ state: 'visible', timeout: 30000 });
                    } catch(e) {
                         this.log('在 30s 内未等到上传按钮，可能是网络太慢或无需点击...', 'warn');
                    }

                    if (await bigUploadBtn.isVisible()) {
                        this.log('尝试点击大按钮以合法拦截 FileChooser...');
                        try {
                            const [fileChooser] = await Promise.all([
                                page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null),
                                bigUploadBtn.click({ force: true }).catch(() => { })
                            ]);
                            if (fileChooser) {
                                await fileChooser.setFiles(videoPath);
                                // 增加超时到 20s，并配合 uploadedBytes 检查防止重复注入
                                const started = await this.waitForUploadStartSignal(page, 20000, 'file_chooser_injection', videoFile);
                                if (started.kind === 'runtime_failure') {
                                    throw new Error(`[UPLOAD_START_RUNTIME_FAILURE] ${JSON.stringify(started.diagnostic)}`);
                                }
                                if (started.kind === 'started' || uploadedBytes > 0) {
                                    injected = true;
                                    this.log('通过 FileChooser 拦截注入文件成功，且已观测到上传启动信号或实时流量！');
                                } else {
                                    this.log('FileChooser 注入后未观测到上传启动信号且无流量，转入 input[type="file"] 回退流程', 'warn');
                                }
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
                            const className = (await fileInputs[n].getAttribute('class')) || '';
                            const name = (await fileInputs[n].getAttribute('name')) || '';
                            this.log(`第 ${n + 1} 个 input: accept=${accept || '<empty>'} name=${name || '<empty>'} class=${className || '<empty>'}`);
                            if (accept.includes('video') || n === 0) {
                                try {
                                    this.log(`准备向第 ${n + 1} 个 input 发注 (accept=${accept})...`);
                                    await fileInputs[n].setInputFiles(videoPath);
                                    // 关键：强制触发 change 事件，防止 B 站代码未侦听到变更
                                    await fileInputs[n].evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
                                    const started = await this.waitForUploadStartSignal(page, 10000, 'input_file_injection', videoFile);
                                    if (started.kind === 'runtime_failure') {
                                        throw new Error(`[UPLOAD_START_RUNTIME_FAILURE] ${JSON.stringify(started.diagnostic)}`);
                                    }
                                    if (started.kind === 'started') {
                                        injected = true;
                                        this.log(`第 ${n + 1} 个 input 注入并手动触发 Change 后，已观测到上传启动信号。`);
                                        break;
                                    }
                                    this.log(`第 ${n + 1} 个 input 注入后仍未观测到上传启动信号，继续尝试下一候选。`, 'warn');
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
                    const uploadFinishPromise = (async () => {
                        let elapsed = 0;
                        while (!uploadCompleteDetected && elapsed < 1200000) { // 20 minutes timeout
                            if (page.isClosed()) {
                                throw new Error('[UPLOAD COMPLETE] 页面已关闭，上传流程中断');
                            }
                            await page.waitForTimeout(1000);
                            elapsed += 1000;
                        }
                        if (uploadCompleteDetected) {
                            this.log(`[UPLOAD COMPLETE] 命中完成响应 (via listener)`);
                            return true;
                        } else {
                            this.log(`[UPLOAD COMPLETE] 等待 complete 响应超时或失败`, 'warn');
                            return null;
                        }
                    })();

                    // 在这里并行：填表 + 等待上传完成
                    const [, uploadFinishResponse] = await Promise.all([fillFormPromise, uploadFinishPromise]);
                    this.log(`上传阶段结束: complete=${uploadFinishResponse ? 'hit' : 'miss'}, uploadedBytes=${uploadedBytes}/${totalSizeBytes}`);

                    if (page.isClosed()) {
                        throw new Error('上传阶段结束后页面已关闭，无法继续提交流程');
                    }
                } finally {
                    page.removeListener('request', uploadProgressListener);
                    page.removeListener('response', uploadResponseListener);
                    page.removeListener('requestfailed', uploadRequestFailedListener);
                }

                // 发布前的终极扫障
                await this.cleanGuidingOverlays(page);
                await debugScreenshot(page, screenshotDir, `before_publish_${i}.png`, '发布前');

                // 寻找发布按钮: 立即投稿
                this.log('正在定位并点击“立即投稿”按钮...');
                const publishBtn = await this.waitForPublishButtonReady(page);
                await publishBtn.scrollIntoViewIfNeeded().catch(() => { });

                const submitResponseListener = (response: Response) => {
                    if (this.isSubmitRequest(response.url())) {
                        void this.logResponseDiagnostics(response);
                    }
                };
                const submitRequestListener = (request: Request) => {
                    if (this.isSubmitRequest(request.url())) {
                        this.logRequestDiagnostics(request);
                    }
                };
                const submitRequestFailedListener = (request: Request) => {
                    if (this.isSubmitRequest(request.url())) {
                        this.logRequestFailureDiagnostics(request);
                    }
                };

                page.on('response', submitResponseListener);
                page.on('request', submitRequestListener);
                page.on('requestfailed', submitRequestFailedListener);

                const addResponsePromise = page.waitForResponse(
                    resp => this.isSubmitRequest(resp.url()),
                    { timeout: 60000 }
                ).then(async resp => {
                    this.log(`[SUBMIT RESPONSE] 命中投稿接口: ${resp.url()} status=${resp.status()}`);
                    await this.logResponseDiagnostics(resp);
                    return resp;
                }).catch((error: any) => {
                    this.log(`[SUBMIT WAIT] 投稿接口未在预期时间返回: ${error.message}`, 'warn');
                    return null;
                });

                const triggered = await this.triggerSubmitWithFallback(page, publishBtn);
                if (!triggered) {
                    this.log('[SubmitTrigger] 所有触发方式均未观测到投稿请求发出', 'warn');
                }
                this.log('“立即投稿”点击已触发，等待接口或页面跳转...');

                try {
                    const response = await addResponsePromise;
                    if (response) {
                        if (response.ok()) {
                            this.log(`视频 ${i + 1} 投稿成功 (接口确认)`);
                        } else {
                            throw new Error(`投稿接口返回非成功状态: ${response.status()} ${response.url()}`);
                        }
                    } else {
                        await this.logSubmitFailureContext(page, publishBtn);
                        this.log(`接口响应超时，判定跳转结果...`, 'warn');
                        await page.waitForURL(url => url.pathname.includes('/content/manage'), { timeout: 20000 });
                        this.log(`视频 ${i + 1} 已进入稿件管理页`);
                    }
                } finally {
                    page.removeListener('response', submitResponseListener);
                    page.removeListener('request', submitRequestListener);
                    page.removeListener('requestfailed', submitRequestFailedListener);
                }

                onProgress(Math.floor(((i + 1) / fileList.length) * 100));
            }
        } catch (error: any) {
            this.log(`上传任务失败: ${error.message}`, 'error');
            throw error;
        } finally {
            await page.close().catch(() => { });
        }
    }

    async upload(_opts: UploadOptions): Promise<void> {
        throw new Error('Please use postVideo instead.');
    }
}
