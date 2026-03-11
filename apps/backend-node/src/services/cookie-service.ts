/**
 * Cookie validation service for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/cookie_service.py
 */

import path from 'path';
import { launchBrowser, setInitScript } from '../core/browser.js';
import { COOKIES_DIR } from '../core/config.js';
import { PlatformType } from '../core/constants.js';
import { bilibiliLogger, douyinLogger, kuaishouLogger, tencentLogger, xhsLogger } from '../core/logger.js';
import { safeJoin } from '../utils/path.js';

/**
 * CookieService interface
 */
export interface CookieService {
    cookieAuthDouyin(accountFile: string): Promise<boolean>;
    cookieAuthTencent(accountFile: string): Promise<boolean>;
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
                await page.waitForURL(
                    'https://creator.douyin.com/creator-micro/content/upload',
                    { timeout: 5000 }
                );
                try {
                    await page.getByText('扫码登录').waitFor({ timeout: 5000 });
                    douyinLogger.error('[+] cookie 失效，需要扫码登录');
                    return false;
                } catch {
                    douyinLogger.info('[+] cookie 有效');
                    return true;
                }
            } catch {
                douyinLogger.error('[+] 等待5秒 cookie 失效');
                return false;
            }
        } finally {
            if (page) await page.close();
            if (context) await context.close();
            await browser.close();
        }
    }

    async cookieAuthTencent(accountFile: string): Promise<boolean> {
        const browser = await launchBrowser();
        let context = null;
        let page = null;
        try {
            context = await browser.newContext({ storageState: accountFile });
            context = await setInitScript(context);
            page = await context.newPage();
            await page.goto(
                'https://channels.weixin.qq.com/platform/post/create',
                { waitUntil: 'domcontentloaded' }
            );
            try {
                await page.waitForSelector('div.title-name:has-text("微信小店")', { timeout: 5000 });
                tencentLogger.error('[+] 等待5秒 cookie 失效');
                return false;
            } catch {
                tencentLogger.info('[+] cookie 有效');
                return true;
            }
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
                { waitUntil: 'domcontentloaded' }
            );
            if (page.url().includes('passport.bilibili.com')) {
                bilibiliLogger.error('[+] bilibili cookie 失效');
                return false;
            } else {
                bilibiliLogger.info('[+] bilibili cookie 有效');
                return true;
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
        } catch (error) {
            return false;
        }

        switch (platformType) {
            case PlatformType.XIAOHONGSHU: return this.cookieAuthXhs(cookiePath);
            case PlatformType.TENCENT: return this.cookieAuthTencent(cookiePath);
            case PlatformType.DOUYIN: return this.cookieAuthDouyin(cookiePath);
            case PlatformType.KUAISHOU: return this.cookieAuthKs(cookiePath);
            case PlatformType.BILIBILI: return this.cookieAuthBilibili(cookiePath);
            default: return false;
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
