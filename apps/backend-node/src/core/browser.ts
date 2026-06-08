/**
 * Browser automation utilities for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/core/browser.py
 */

import fs from 'fs';
import path from 'path';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { BASE_DIR, DEBUG_MODE, LOCAL_CHROME_HEADLESS, LOCAL_CHROME_PATH, LOGS_DIR } from './config.js';
import { logger } from './logger.js';

// Social media platform identifiers
export const SOCIAL_MEDIA_DOUYIN = 'douyin';
export const SOCIAL_MEDIA_WX_CHANNELS = 'wx_channels';
export const SOCIAL_MEDIA_KUAISHOU = 'kuaishou';
export const SOCIAL_MEDIA_XIAOHONGSHU = 'xiaohongshu';

/**
 * Print only when DEBUG_MODE is enabled.
 */
export function debugPrint(...args: unknown[]): void {
    if (DEBUG_MODE) {
        logger.info(args.join(' '));
    }
}

/**
 * Apply stealth script to browser context to avoid detection.
 */
export async function setInitScript(context: BrowserContext): Promise<BrowserContext> {
    const stealthJsPath = path.join(BASE_DIR, 'utils', 'stealth.min.js');
    if (fs.existsSync(stealthJsPath)) {
        await context.addInitScript({ path: stealthJsPath });
    } else {
        debugPrint(`[WARN] Stealth script not found: ${stealthJsPath}`);
    }
    return context;
}

/**
 * Launch browser with unified configuration.
 */
export async function launchBrowser(headless?: boolean): Promise<Browser> {
    const browserArgs = [
        '--lang=en-GB',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.6613.100 Safari/537.36',
    ];

    const launchOptions = {
        headless: headless ?? LOCAL_CHROME_HEADLESS,
        args: browserArgs,
        executablePath: LOCAL_CHROME_PATH && fs.existsSync(LOCAL_CHROME_PATH) ? LOCAL_CHROME_PATH : undefined,
    };

    if (launchOptions.executablePath) {
        debugPrint(`[DEBUG] 使用系统 Chrome: ${launchOptions.executablePath}`);
    } else {
        debugPrint('[DEBUG] 使用 Playwright 内置 Chromium');
    }

    return chromium.launch(launchOptions);
}

/**
 * Launch browser with a persistent context (session reuse).
 */
export async function launchPersistentContext(
    userDataDir: string,
    profileName: string = 'Default',
    headless?: boolean
): Promise<BrowserContext> {
    const browserArgs = [
        '--lang=en-GB',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.6613.100 Safari/537.36',
    ];

    if (profileName) {
        browserArgs.push(`--profile-directory=${profileName}`);
    }

    const launchOptions = {
        headless: headless ?? LOCAL_CHROME_HEADLESS,
        args: browserArgs,
        viewport: { width: 1280, height: 800 },
        executablePath: LOCAL_CHROME_PATH && fs.existsSync(LOCAL_CHROME_PATH) ? LOCAL_CHROME_PATH : undefined,
    };

    if (launchOptions.executablePath) {
        debugPrint(`[DEBUG] 使用系统 Chrome: ${launchOptions.executablePath}`);
    }

    try {
        const context = await chromium.launchPersistentContext(userDataDir, launchOptions);
        await setInitScript(context);
        return context;
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('already in use') || msg.includes('User data directory is already in use')) {
            throw new Error(
                `浏览器配置目录正在使用中: ${userDataDir} (profile=${profileName})。请先关闭占用该配置的浏览器窗口后重试。`
            );
        }
        throw error;
    }
}

/**
 * Create platform-specific session screenshot directory.
 */
export function createScreenshotDir(platform: string): string {
    // Sanitize platform name (SC-001)
    const safePlatform = String(platform).replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -1);
    const screenshotsRoot = path.join(LOGS_DIR, 'screenshots');
    fs.mkdirSync(screenshotsRoot, { recursive: true });
    const sessionDir = path.join(screenshotsRoot, safePlatform, timestamp);
    fs.mkdirSync(sessionDir, { recursive: true });
    return sessionDir;
}

/**
 * Take a screenshot only when DEBUG_MODE is enabled.
 */
export async function debugScreenshot(
    page: Page,
    sessionDir: string,
    filename: string,
    description: string = ''
): Promise<void> {
    if (!DEBUG_MODE) return;

    if (!filename.toLowerCase().endsWith('.png')) {
        filename = `${filename}.png`;
    }

    // Sanitize filename (SC-001)
    const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    const screenshotPath = path.join(sessionDir, safeFilename);

    try {
        await page.screenshot({
            path: screenshotPath,
            timeout: 10000,
        });
        debugPrint(`[DEBUG] Screenshot saved: ${screenshotPath}${description ? ` (${description})` : ''}`);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        debugPrint(`[ERROR] Failed to save screenshot: ${msg}`);
    }
}

/**
 * Close browser context and its browser.
 */
export async function closeBrowser(context: BrowserContext): Promise<void> {
    const browser = context.browser();
    await context.close();
    if (browser) {
        await browser.close();
    }
}
