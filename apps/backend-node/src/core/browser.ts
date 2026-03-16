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
export const SOCIAL_MEDIA_TENCENT = 'tencent';
export const SOCIAL_MEDIA_KUAISHOU = 'kuaishou';
export const SOCIAL_MEDIA_XIAOHONGSHU = 'xiaohongshu';

/**
 * Print only when DEBUG_MODE is enabled.
 */
export function debugPrint(...args: any[]): void {
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

    const launchOptions: Record<string, any> = {
        headless: headless ?? LOCAL_CHROME_HEADLESS,
        args: browserArgs,
    };

    if (LOCAL_CHROME_PATH && fs.existsSync(LOCAL_CHROME_PATH)) {
        debugPrint(`[DEBUG] 使用系统 Chrome: ${LOCAL_CHROME_PATH}`);
        launchOptions.executablePath = LOCAL_CHROME_PATH;
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

    const launchOptions: Record<string, any> = {
        headless: headless ?? LOCAL_CHROME_HEADLESS,
        args: browserArgs,
        viewport: { width: 1280, height: 800 },
    };

    if (LOCAL_CHROME_PATH && fs.existsSync(LOCAL_CHROME_PATH)) {
        debugPrint(`[DEBUG] 使用系统 Chrome: ${LOCAL_CHROME_PATH}`);
        launchOptions.executablePath = LOCAL_CHROME_PATH;
    }

    // Playwright uses the last path component as profile if not specified otherwise, 
    // but typically it's better to point directly to the user data dir.
    // Note: profileName is often a subdirectory of userDataDir.
    const context = await chromium.launchPersistentContext(userDataDir, launchOptions);
    
    // Apply stealth script
    await setInitScript(context);
    
    return context;
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
            omitBackground: true,
            animations: 'disabled',
        });
        debugPrint(`[DEBUG] 截图保存: ${screenshotPath}${description ? ` - ${description}` : ''}`);
    } catch (e) {
        debugPrint(`[DEBUG] 截图失败: ${screenshotPath} - ${e}`);
    }
}
