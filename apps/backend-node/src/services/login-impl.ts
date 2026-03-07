/**
 * Login implementation for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/login_impl.py
 *
 * Contains actual Playwright automation logic for 5 platform logins.
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { v1 as uuidv1 } from 'uuid';
import { createScreenshotDir, debugPrint, debugScreenshot, launchBrowser, setInitScript } from '../core/browser.js';
import { COOKIES_DIR } from '../core/config.js';
import { logger } from '../core/logger.js';
import { dbManager } from '../db/database.js';
import { getCookieService } from './cookie-service.js';

/**
 * Helper: Get or create account group
 */
function getOrCreateGroup(groupName?: string | null): number | null {
    if (!groupName) return null;

    const db = dbManager.getDb();
    const existing = db.prepare('SELECT id FROM account_groups WHERE name = ?').get(groupName) as any;
    if (existing) return existing.id;

    const result = db.prepare(
        'INSERT INTO account_groups (name, description) VALUES (?, ?)'
    ).run(groupName, `自动创建的组: ${groupName}`);
    return Number(result.lastInsertRowid);
}

/**
 * Helper: Save user info to database (upsert)
 */
function saveUserInfo(
    platformType: number,
    cookieFile: string,
    userName: string,
    groupId: number | null
): void {
    const db = dbManager.getDb();
    db.prepare(`
    INSERT INTO user_info (type, filePath, userName, status, group_id, created_at, last_validated_at)
    VALUES (?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(type, userName) DO UPDATE SET
      filePath = excluded.filePath,
      status = excluded.status,
      group_id = COALESCE(excluded.group_id, user_info.group_id),
      last_validated_at = CURRENT_TIMESTAMP
  `).run(platformType, cookieFile, userName, groupId);
    logger.info('✅ 用户状态已记录');
}

/**
 * Douyin login implementation
 */
export async function douyinCookieGen(
    id: string,
    emitter: EventEmitter,
    groupName?: string | null
): Promise<any> {
    const screenshotDir = createScreenshotDir('douyin');
    let urlChanged = false;

    const browser = await launchBrowser();
    const context = await setInitScript(await browser.newContext());
    const page = await context.newPage();

    try {
        await debugScreenshot(page, screenshotDir, 'before_navigation.png', '导航前');
        await page.goto('https://creator.douyin.com/');
        const originalUrl = page.url();
        debugPrint(`[DEBUG] 页面加载完成: ${originalUrl}`);
        await debugScreenshot(page, screenshotDir, 'after_navigation.png', '导航后');

        const imgLocator = page.getByRole('img', { name: '二维码' });
        await debugScreenshot(page, screenshotDir, 'qrcode_displayed.png', '二维码显示后');
        const src = await imgLocator.getAttribute('src');
        logger.info(`✅ 抖音 图片地址: ${src}`);
        emitter.emit('message', src);

        // Wait for URL change (login success)
        try {
            await page.waitForURL((url) => url.toString() !== originalUrl, { timeout: 30000 });
            debugPrint('[DEBUG] 抖音登录检测成功');
        } catch {
            logger.warn('抖音登录页面跳转监听超时');
            emitter.emit('message', '500');
            return { success: false, error: 'TIMEOUT' };
        }

        // Save cookies
        const cookieId = uuidv1();
        fs.mkdirSync(COOKIES_DIR, { recursive: true });
        await context.storageState({ path: path.join(COOKIES_DIR, `${cookieId}.json`) });

        // Validate cookie
        const result = await getCookieService().checkCookie(3, `${cookieId}.json`);
        if (!result) {
            emitter.emit('message', '500');
            return null;
        }

        const groupId = getOrCreateGroup(groupName);
        saveUserInfo(3, `${cookieId}.json`, id, groupId);
        emitter.emit('message', '200');
    } finally {
        await page.close();
        await context.close();
        await browser.close();
    }
}

/**
 * Tencent Video (WeChat Channels) login implementation
 */
export async function getTencentCookie(
    id: string,
    emitter: EventEmitter,
    groupName?: string | null
): Promise<any> {
    const screenshotDir = createScreenshotDir('tencent');

    const browser = await launchBrowser();
    const context = await setInitScript(await browser.newContext());
    const page = await context.newPage();

    try {
        await debugScreenshot(page, screenshotDir, 'before_navigation.png', '导航前');
        await page.goto('https://channels.weixin.qq.com');
        const originalUrl = page.url();
        debugPrint(`[DEBUG] 页面加载完成: ${originalUrl}`);
        await debugScreenshot(page, screenshotDir, 'after_navigation.png', '导航后');

        // Get QR code from iframe
        const iframeLocator = page.frameLocator('iframe').first();
        const imgLocator = iframeLocator.getByRole('img').first();
        await debugScreenshot(page, screenshotDir, 'qrcode_displayed.png', '二维码显示后');
        const src = await imgLocator.getAttribute('src');
        logger.info(`✅ 视频号 图片地址: ${src}`);
        emitter.emit('message', src);

        // Wait for URL change or new page (login success)
        try {
            await page.waitForURL((url) => url.toString() !== originalUrl, { timeout: 30000 });
            debugPrint('[DEBUG] 监听页面跳转或登录检测成功');
        } catch {
            emitter.emit('message', '500');
            logger.warn('视频号 监听页面跳转超时，登录失败');
            return { success: false, error: 'TIMEOUT' };
        }

        const cookieId = uuidv1();
        fs.mkdirSync(COOKIES_DIR, { recursive: true });
        await context.storageState({ path: path.join(COOKIES_DIR, `${cookieId}.json`) });
        debugPrint(`[DEBUG] Cookie 保存到: ${COOKIES_DIR}/${cookieId}.json`);

        const result = await getCookieService().checkCookie(2, `${cookieId}.json`);
        if (!result) {
            emitter.emit('message', '500');
            logger.warn('视频号 Cookie验证失败，登录状态无效');
            return {};
        }

        const groupId = getOrCreateGroup(groupName);
        saveUserInfo(2, `${cookieId}.json`, id, groupId);
        emitter.emit('message', '200');
        return {};
    } finally {
        await page.close();
        await context.close();
        await browser.close();
        debugPrint('[DEBUG] 浏览器资源已释放');
    }
}

/**
 * Kuaishou login implementation
 */
export async function getKsCookie(
    id: string,
    emitter: EventEmitter,
    groupName?: string | null
): Promise<any> {
    const browser = await launchBrowser();
    const context = await setInitScript(await browser.newContext());
    const page = await context.newPage();

    try {
        await page.goto('https://cp.kuaishou.com', { waitUntil: 'networkidle' });
        const originalUrl = page.url();

        await page.getByRole('link', { name: '立即登录' }).click();
        await page.getByText('扫码登录').click();

        const imgLocator = page.getByRole('img', { name: 'qrcode' });
        const src = await imgLocator.getAttribute('src');
        logger.info(`✅ 快手 图片地址: ${src}`);
        emitter.emit('message', src);

        // Wait for login redirect
        try {
            await page.waitForURL((url) => url.toString() !== originalUrl, { timeout: 30000 });
            debugPrint('[DEBUG] 快手登录检测成功');
        } catch {
            emitter.emit('message', '500');
            logger.warn('快手 监听页面跳转超时，登录失败');
            return { success: false, error: 'URL_CHANGE_TIMEOUT' };
        }

        const cookieId = uuidv1();
        fs.mkdirSync(COOKIES_DIR, { recursive: true });
        await context.storageState({ path: path.join(COOKIES_DIR, `${cookieId}.json`) });

        const result = await getCookieService().checkCookie(4, `${cookieId}.json`);
        if (!result) {
            emitter.emit('message', '500');
            logger.warn('快手 Cookie验证失败，登录状态无效');
            return { success: false, error: 'COOKIE_VALIDATION_FAILED' };
        }

        const groupId = getOrCreateGroup(groupName);
        saveUserInfo(4, `${cookieId}.json`, id, groupId);
        emitter.emit('message', '200');
    } finally {
        await page.close();
        await context.close();
        await browser.close();
    }
}

/**
 * Xiaohongshu login implementation
 */
export async function xiaohongshuCookieGen(
    id: string,
    emitter: EventEmitter,
    groupName?: string | null
): Promise<any> {
    const screenshotDir = createScreenshotDir('xiaohongshu');

    const browser = await launchBrowser();
    const context = await setInitScript(await browser.newContext());
    const page = await context.newPage();

    try {
        await debugScreenshot(page, screenshotDir, 'before_navigation.png', '导航前');
        await page.goto('https://creator.xiaohongshu.com/');
        const originalUrl = page.url();
        debugPrint(`[DEBUG] 页面加载完成: ${originalUrl}`);
        await debugScreenshot(page, screenshotDir, 'after_navigation.png', '导航后');

        await page.locator('img.css-wemwzq').click();
        await debugScreenshot(page, screenshotDir, 'after_login_click.png', '点击登录按钮后');

        const imgLocator = page.getByRole('img').nth(2);
        await debugScreenshot(page, screenshotDir, 'qrcode_displayed.png', '二维码显示后');
        const src = await imgLocator.getAttribute('src');
        logger.info(`✅ 小红书 图片地址: ${src}`);
        emitter.emit('message', src);

        try {
            await page.waitForURL((url) => url.toString() !== originalUrl, { timeout: 30000 });
            logger.info('小红书 监听页面跳转成功');
        } catch {
            emitter.emit('message', '500');
            logger.warn('小红书登录页面跳转监听超时');
            return { success: false, error: 'TIMEOUT' };
        }

        const cookieId = uuidv1();
        fs.mkdirSync(COOKIES_DIR, { recursive: true });
        await context.storageState({ path: path.join(COOKIES_DIR, `${cookieId}.json`) });

        const result = await getCookieService().checkCookie(1, `${cookieId}.json`);
        if (!result) {
            emitter.emit('message', '500');
            return null;
        }

        const groupId = getOrCreateGroup(groupName);
        saveUserInfo(1, `${cookieId}.json`, id, groupId);
        emitter.emit('message', '200');
    } finally {
        await page.close();
        await context.close();
        await browser.close();
    }
}

/**
 * Bilibili login implementation
 */
export async function bilibiliCookieGen(
    id: string,
    emitter: EventEmitter,
    groupName?: string | null
): Promise<any> {
    const screenshotDir = createScreenshotDir('bilibili');

    const browser = await launchBrowser();
    const context = await setInitScript(await browser.newContext());
    const page = await context.newPage();

    try {
        await debugScreenshot(page, screenshotDir, 'before_navigation.png', '导航前');
        await page.goto('https://member.bilibili.com/platform/home');
        const originalUrl = page.url();
        debugPrint(`[DEBUG] 页面加载完成: ${originalUrl}`);
        await debugScreenshot(page, screenshotDir, 'after_navigation.png', '导航后');

        // Get QR code
        try {
            const imgLocator = page.locator(
                'img[alt="Scan me!"], .bcc-qrcode-img img, .qr-code-box img'
            ).first();
            await imgLocator.waitFor({ timeout: 10000 });
            const src = await imgLocator.getAttribute('src');
            logger.info(`✅ Bilibili 图片地址: ${src}`);
            emitter.emit('message', src);
        } catch (e) {
            logger.error(`❌ 获取二维码失败: ${e}`);
            emitter.emit('message', '500');
            return;
        }

        // Wait for login redirect (not to passport page)
        try {
            await page.waitForURL(
                (url) => {
                    const urlStr = url.toString();
                    return urlStr !== originalUrl && !urlStr.includes('passport.bilibili.com');
                },
                { timeout: 60000 }
            );
            debugPrint('[DEBUG] Bilibili登录检测成功');
        } catch {
            logger.warn('Bilibili登录页面跳转监听超时');
            emitter.emit('message', '500');
            return { success: false, error: 'TIMEOUT' };
        }

        const cookieId = uuidv1();
        fs.mkdirSync(COOKIES_DIR, { recursive: true });
        await context.storageState({ path: path.join(COOKIES_DIR, `${cookieId}.json`) });

        const result = await getCookieService().checkCookie(5, `${cookieId}.json`);
        if (!result) {
            emitter.emit('message', '500');
            return null;
        }

        const groupId = getOrCreateGroup(groupName);
        saveUserInfo(5, `${cookieId}.json`, id, groupId);
        emitter.emit('message', '200');
    } finally {
        await page.close();
        await context.close();
        await browser.close();
    }
}
