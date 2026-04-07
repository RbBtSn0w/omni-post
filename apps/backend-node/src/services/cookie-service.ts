/**
 * Cookie validation service for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/cookie_service.py
 */

import fs from 'fs';
import path from 'path';
import { createScreenshotDir, debugScreenshot, launchBrowser, setInitScript } from '../core/browser.js';
import { COOKIES_DIR } from '../core/config.js';
import { PlatformType } from '../core/constants.js';
import { logger, bilibiliLogger, douyinLogger, kuaishouLogger, wxChannelsLogger, xhsLogger } from '../core/logger.js';
import { safeJoin } from '../utils/path.js';

/**
 * CookieService interface
 */
export interface CookieService {
    cookieAuthDouyin(accountFile: string): Promise<boolean>;
    cookieAuthWxChannels(accountFile: string): Promise<boolean>;
    cookieAuthKs(accountFile: string): Promise<boolean>;
    cookieAuthXhs(accountFile: string): Promise<boolean>;
    cookieAuthBilibili(accountFile: string): Promise<boolean>;
    checkCookie(platformType: number, filePath: string): Promise<boolean>;
}

/**
 * Default CookieService — uses Playwright to verify cookie validity
 */
export class DefaultCookieService implements CookieService {
    private cookiesDir: string;

    constructor() {
        this.cookiesDir = COOKIES_DIR;
    }

    async cookieAuthDouyin(accountFile: string): Promise<boolean> {
        const browser = await launchBrowser();
        let context = null;
        let page = null;
        try {
            context = await browser.newContext({ storageState: accountFile });
            context = await setInitScript(context);
            page = await context.newPage();
            await page.goto(
                'https://creator.douyin.com/creator-micro/content/upload',
                { waitUntil: 'domcontentloaded' }
            );
            try {
                await page.waitForURL(url => url.href.includes('creator-micro'), { timeout: 15000 });
                try {
                    await page.waitForSelector('#header-avatar', { timeout: 5000 });
                    douyinLogger.info('[+] cookie 有效 (Detected header avatar)');
                    return true;
                } catch {
                    // Avatar not found, but it's creator-micro URL, check for Scan QR code element
                    if (await page.getByText('扫码登录').count() > 0) {
                        douyinLogger.error('[+] cookie 失效，页面包含“扫码登录”');
                        return false;
                    }
                    // Or maybe it's still loading
                    douyinLogger.info('[+] cookie 有效 (Inside creator-micro URL)');
                    return true;
                }
            } catch {
                douyinLogger.error(`[+] 等待15秒 cookie 失效, 当前 URL: ${page.url()}`);
                return false;
            }
        } finally {
            if (page) await page.close();
            if (context) await context.close();
            await browser.close();
        }
    }

    async cookieAuthWxChannels(accountFile: string): Promise<boolean> {
        const browser = await launchBrowser();
        let context = null;
        let page = null;
        try {
            context = await browser.newContext({ storageState: accountFile });
            context = await setInitScript(context);
            page = await context.newPage();
            const screenshotDir = createScreenshotDir('wx_channels_auth');
            
            // 捕获导航响应
            const response = await page.goto(
                'https://channels.weixin.qq.com/platform/post/create',
                { waitUntil: 'networkidle', timeout: 30000 }
            ).catch(e => {
                logger.error(`[DEBUG] 视频号验证页面 goto 失败: ${e.message}`);
                return null;
            });

            if (response) {
                logger.info(`[DEBUG] 视频号验证页面响应码: ${response.status()}`);
            }

            try {
                // 更宽松的成功判定：URL 包含 platform 且 (渲染了 wujie-app 或 包含“视频号助手”)
                await page.waitForFunction(() => {
                    const url = window.location.href;
                    const hasWujie = !!document.querySelector('wujie-app');
                    const hasText = document.body.innerText.includes('视频号') && document.body.innerText.includes('助手');
                    return url.includes('/platform') && (hasWujie || hasText);
                }, { timeout: 25000 });
                
                logger.info(`[+] 视频号：cookie 有效, 当前 URL: ${page.url()}, 标题: ${await page.title()}`);
                return true;
            } catch (err) {
                const currentUrl = page.url();
                const pageTitle = await page.title();
                logger.error(`[+] 视频号：cookie 失效 (判定条件未达成), 当前 URL: ${currentUrl}, 标题: ${pageTitle}`);
                await debugScreenshot(page, screenshotDir, 'auth_fail.png', `验证失败: ${currentUrl}`);
                return false;
            }
        } catch (outerError: any) {
            logger.error(`[DEBUG] 视频号验证逻辑外部崩溃: ${outerError.message}`);
            return false;
        } finally {
            if (page) await page.close();
            if (context) await context.close();
            await browser.close();
        }
    }

    async cookieAuthKs(accountFile: string): Promise<boolean> {
        const browser = await launchBrowser();
        let context = null;
        let page = null;
        try {
            context = await browser.newContext({ storageState: accountFile });
            context = await setInitScript(context);
            page = await context.newPage();
            await page.goto(
                'https://cp.kuaishou.com/article/publish/video',
                { waitUntil: 'domcontentloaded' }
            );
            try {
                await page.waitForSelector(
                    "div.names div.container div.name:text('机构服务')",
                    { timeout: 5000 }
                );
                kuaishouLogger.info('[+] 等待5秒 cookie 失效');
                return false;
            } catch {
                kuaishouLogger.info('[+] cookie 有效');
                return true;
            }
        } finally {
            if (page) await page.close();
            if (context) await context.close();
            await browser.close();
        }
    }

    async cookieAuthXhs(accountFile: string): Promise<boolean> {
        const browser = await launchBrowser();
        let context = null;
        let page = null;
        try {
            context = await browser.newContext({ storageState: accountFile });
            context = await setInitScript(context);
            page = await context.newPage();
            await page.goto(
                'https://creator.xiaohongshu.com/creator-micro/content/upload',
                { waitUntil: 'domcontentloaded' }
            );
            try {
                await page.waitForURL(
                    'https://creator.xiaohongshu.com/creator-micro/content/upload',
                    { timeout: 5000 }
                );
            } catch {
                xhsLogger.error('[+] 等待5秒 cookie 失效');
                return false;
            }
            if (
                (await page.getByText('手机号登录').count()) > 0 ||
                (await page.getByText('扫码登录').count()) > 0
            ) {
                xhsLogger.error('[+] 等待5秒 cookie 失效');
                return false;
            } else {
                xhsLogger.info('[+] cookie 有效');
                return true;
            }
        } finally {
            if (page) await page.close();
            if (context) await context.close();
            await browser.close();
        }
    }

    async cookieAuthBilibili(accountFile: string): Promise<boolean> {
        const browser = await launchBrowser();
        let context = null;
        let page = null;
        try {
            context = await browser.newContext({ storageState: accountFile });
            context = await setInitScript(context);
            page = await context.newPage();
            await page.goto(
                'https://member.bilibili.com/platform/home',
                { waitUntil: 'domcontentloaded', timeout: 30000 }
            );

            // Wait a bit to ensure potential redirects have happened
            await page.waitForTimeout(3000);

            const currentUrl = page.url();
            const urlObj = new URL(currentUrl);

            if (urlObj.hostname.includes('passport.bilibili.com')) {
                bilibiliLogger.error(`[+] bilibili cookie 失效 (已重定向至登录页: ${currentUrl})`);
                return false;
            }

            // Check for common logged-in indicators in Bilibili Creative Center
            // .avatar, a[href*="space.bilibili.com"], or .nav-item-avatar
            const avatarVisible = await page
                .locator('.avatar, .nav-item-avatar, a[href*="space.bilibili.com"]')
                .first()
                .isVisible({ timeout: 5000 })
                .catch(() => false);

            if (avatarVisible) {
                bilibiliLogger.info('[+] bilibili cookie 有效');
                return true;
            } else {
                bilibiliLogger.error(`[+] bilibili cookie 失效 (未检测到登录特征), 当前 URL: ${currentUrl}`);
                return false;
            }
        } finally {
            if (page) await page.close();
            if (context) await context.close();
            await browser.close();
        }
    }

    async checkCookie(platformType: number, filePath: string): Promise<boolean> {
        let cookiePath: string;
        try {
            cookiePath = safeJoin(this.cookiesDir, filePath);
            logger.info(`[DEBUG] 开始进行 Cookie 验证: 平台=${platformType}, 相对路径=${filePath}, 绝对路径=${cookiePath}`);
            
            if (!fs.existsSync(cookiePath)) {
                logger.error(`[DEBUG] 验证中止：Cookie 文件不存在! ${cookiePath}`);
                return false;
            }
        } catch (error: any) {
            logger.error(`[DEBUG] 路径解析错误: ${error.message}`);
            return false;
        }

        switch (platformType) {
            case PlatformType.XIAOHONGSHU: return this.cookieAuthXhs(cookiePath);
            case PlatformType.WX_CHANNELS: return this.cookieAuthWxChannels(cookiePath);
            case PlatformType.DOUYIN: return this.cookieAuthDouyin(cookiePath);
            case PlatformType.KUAISHOU: return this.cookieAuthKs(cookiePath);
            case PlatformType.BILIBILI: return this.cookieAuthBilibili(cookiePath);
            default: 
                logger.warn(`[DEBUG] 未知的平台类型: ${platformType}`);
                return false;
        }
    }
}

// Global singleton
let _cookieService: CookieService | null = null;

export function getCookieService(): CookieService {
    if (!_cookieService) {
        _cookieService = new DefaultCookieService();
    }
    return _cookieService;
}

export function setCookieService(service: CookieService): void {
    _cookieService = service;
}
