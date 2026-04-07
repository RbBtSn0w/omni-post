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
    signal: AbortSignal,
    groupName?: string | null
): Promise<any> {
    const screenshotDir = createScreenshotDir('douyin');

    const browser = await launchBrowser();
    const abortHandler = () => {
        logger.info('[Login:Douyin] Detected abort signal, closing browser...');
        browser.close().catch(() => {});
    };
    signal.addEventListener('abort', abortHandler);

    const context = await setInitScript(await browser.newContext());
    const page = await context.newPage();

    try {
        if (signal.aborted) return;
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
            await page.waitForURL(url => url.href.includes('creator-micro'), { timeout: 30000 });
            await page.waitForLoadState('networkidle');
            debugPrint('[DEBUG] 抖音登录检测成功，页面已加载完成');
        } catch (err: any) {
            if (signal.aborted) throw new Error('AbortError');
            logger.warn('抖音登录跳转超时或验证失败');
            emitter.emit('message', '500');
            return { success: false, error: 'TIMEOUT' };
        }

        if (signal.aborted) throw new Error('AbortError');

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
        signal.removeEventListener('abort', abortHandler);
        await page.close().catch(() => {});
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
    }
}

/**
 * WXChannels (WeChat Channels) login implementation
 */
export async function getWxChannelsCookie(
    id: string,
    emitter: EventEmitter,
    signal: AbortSignal,
    groupName?: string | null
): Promise<any> {
    const screenshotDir = createScreenshotDir('wx_channels');

    const browser = await launchBrowser();
    const abortHandler = () => {
        logger.info('[Login:WxChannels] Detected abort signal, closing browser...');
        browser.close().catch(() => {});
    };
    signal.addEventListener('abort', abortHandler);

    const context = await setInitScript(await browser.newContext());
    const page = await context.newPage();

    try {
        if (signal.aborted) return;
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
            await new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('TIMEOUT'));
                }, 30000);

                const onUrlChange = async () => {
                    if (page.url() !== originalUrl) {
                        clearTimeout(timeoutId);
                        resolve();
                    }
                };

                // Handle new page popups
                context.on('page', async (newPage) => {
                    debugPrint(`[DEBUG] 新窗口创建，URL：${newPage.url()}`);

                    newPage.on('load', () => {
                        debugPrint(`[DEBUG] 新窗口加载完成，URL：${newPage.url()}`);
                        clearTimeout(timeoutId);
                        resolve();
                    });

                    newPage.on('framenavigated', (frame) => {
                        if (frame === newPage.mainFrame()) {
                            debugPrint(`[DEBUG] 新窗口导航，当前URL：${frame.url()}`);
                            clearTimeout(timeoutId);
                            resolve();
                        }
                    });
                });

                // Handle frame navigations in current page
                page.on('framenavigated', async (frame) => {
                    if (frame === page.mainFrame()) {
                        debugPrint(`[DEBUG] 主窗口framenavigated事件触发，当前URL：${frame.url()}`);
                        await onUrlChange();
                    }
                });

                signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new Error('AbortError'));
                });
            });
            debugPrint('[DEBUG] 监听页面跳转或登录检测成功');
        } catch (err: any) {
            if (err.message === 'AbortError') throw err;
            emitter.emit('message', '500');
            logger.warn('视频号 监听页面跳转超时，登录失败');
            return { success: false, error: 'TIMEOUT' };
        }

        if (signal.aborted) throw new Error('AbortError');

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
        signal.removeEventListener('abort', abortHandler);
        await page.close().catch(() => {});
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
        debugPrint('[DEBUG] 浏览器资源已释放');
    }
}

/**
 * Kuaishou login implementation (Strict 1:1 Python port)
 */
export async function getKsCookie(
    id: string,
    emitter: EventEmitter,
    signal: AbortSignal,
    groupName?: string | null
): Promise<any> {
    const browser = await launchBrowser();
    const abortHandler = () => {
        logger.info('[Login:Kuaishou] Detected abort signal, closing browser...');
        browser.close().catch(() => {});
    };
    signal.addEventListener('abort', abortHandler);

    const context = await setInitScript(await browser.newContext());
    const page = await context.newPage();

    let originalUrl = '';

    const logWithTimestamp = async (message: string, level: string = 'DEBUG') => {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
        if (level === 'DEBUG') {
            debugPrint(`[${timestamp}] [DEBUG] ${message}`);
        } else {
            if (level === 'ERROR') {
                logger.error(`[${timestamp}] [ERROR] ${message}`);
            } else {
                logger.info(`[${timestamp}] [${level}] ${message}`);
            }
        }
    };

    const verifyLoginSuccess = async (): Promise<boolean> => {
        try {
            await logWithTimestamp('开始基于页面内容验证登录状态...');
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });

            const pageTitle = await page.title().catch(() => 'Unknown');
            await logWithTimestamp(`当前页面标题: ${pageTitle}`);

            try {
                const avatarCount = await page.locator('img[class*="avatar"]').count();
                if (avatarCount > 0) {
                    await logWithTimestamp('检测到用户头像，可能登录成功');
                    return true;
                }
            } catch (e) {
                await logWithTimestamp(`检查头像元素时出错: ${e}`);
            }

            try {
                const publishCount = await page.getByRole('button', { name: '发布' }).count();
                if (publishCount > 0) {
                    await logWithTimestamp('检测到发布按钮，可能登录成功');
                    return true;
                }
            } catch (e) {
                await logWithTimestamp(`检查发布按钮时出错: ${e}`);
            }

            try {
                const userInfoCount = await page.locator('.user-info').count();
                if (userInfoCount > 0) {
                    await logWithTimestamp('检测到用户信息，可能登录成功');
                    return true;
                }
            } catch (e) {
                await logWithTimestamp(`检查用户信息元素时出错: ${e}`);
            }

            try {
                const urlObj = new URL(page.url());
                const loginTextCount = await page.getByText('扫码登录').count();
                if (loginTextCount === 0) {
                    await logWithTimestamp('未检测到扫码登录文本，可能登录成功');
                    if (urlObj.hostname === 'cp.kuaishou.com' && urlObj.pathname.startsWith('/profile')) {
                        await logWithTimestamp('检测到profile页面且无登录文本，登录成功');
                        return true;
                    }
                }
            } catch (e) {
                await logWithTimestamp(`检查登录文本时出错: ${e}`);
            }

            await logWithTimestamp('基于页面内容验证：未确认登录成功');
            return false;
        } catch (e) {
            await logWithTimestamp(`登录验证过程出错: ${e}`, 'ERROR');
            return false;
        }
    };

    try {
        if (signal.aborted) return;
        page.on('request', (request) => {
            const url = request.url();
            const urlObj = new URL(url);
            if (urlObj.hostname === 'cp.kuaishou.com' || urlObj.hostname === 'passport.kuaishou.com') {
                logWithTimestamp(`请求URL: ${url}, 方法: ${request.method()}`).catch(() => { });
            }
        });

        page.on('response', (response) => {
            const url = response.url();
            const urlObj = new URL(url);
            if (urlObj.hostname === 'cp.kuaishou.com' || urlObj.hostname === 'passport.kuaishou.com') {
                logWithTimestamp(`响应URL: ${url}, 状态码: ${response.status()}`).catch(() => { });
            }
        });

        const initialUrl = 'https://cp.kuaishou.com';
        await page.goto(initialUrl, { waitUntil: 'networkidle' });
        originalUrl = page.url();

        await page.getByRole('link', { name: '立即登录' }).click();
        await page.getByText('扫码登录').click();

        const imgLocator = page.getByRole('img', { name: 'qrcode' });
        const src = await imgLocator.getAttribute('src');
        logger.info(`✅ 快手 图片地址: ${src}`);
        emitter.emit('message', src);

        page.on('load', () => {
            logWithTimestamp(`页面加载完成事件触发，当前URL: ${page.url()}`).catch(() => { });
        });

        // Wait for login success via framenavigated events
        try {
            await new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    page.off('framenavigated', onFrameNavigated);
                    reject(new Error('TIMEOUT'));
                }, 30000); // Strict 30s timeout matching Python

                const onFrameNavigated = async (frame: any) => {
                    if (frame !== page.mainFrame()) return;

                    const currentUrl = frame.url();
                    const urlObj = new URL(currentUrl);
                    await logWithTimestamp(`URL变化检测 - 当前URL: ${currentUrl}`);
                    await logWithTimestamp(`URL变化检测 - 原始URL: ${originalUrl}`);

                    let loginSuccess = false;

                    if (urlObj.hostname === 'cp.kuaishou.com' && urlObj.pathname.startsWith('/profile')) {
                        await logWithTimestamp(`检测到跳转到profile页面: ${currentUrl}`);
                        loginSuccess = await verifyLoginSuccess();
                    } else if (currentUrl !== originalUrl) {
                        await logWithTimestamp(`页面URL变化: ${originalUrl} -> ${currentUrl}`);
                        loginSuccess = await verifyLoginSuccess();
                    }

                    if (loginSuccess) {
                        await logWithTimestamp('基于页面内容验证：登录成功');
                        clearTimeout(timeoutId);
                        page.off('framenavigated', onFrameNavigated);
                        resolve();
                    }
                };

                page.on('framenavigated', onFrameNavigated);

                signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    page.off('framenavigated', onFrameNavigated);
                    reject(new Error('AbortError'));
                });
            });
            await logWithTimestamp('快手登录检测成功');
        } catch (error: any) {
            if (error.message === 'AbortError') throw error;
            await logWithTimestamp('监听页面跳转超时，登录失败', 'ERROR');
            emitter.emit('message', '500');
            const errorMsg = '监听页面跳转超时，登录失败';
            logger.error(errorMsg);
            return { success: false, error: 'URL_CHANGE_TIMEOUT', message: errorMsg };
        }

        if (signal.aborted) throw new Error('AbortError');

        const finalLoginSuccess = await verifyLoginSuccess();
        if (!finalLoginSuccess) {
            await logWithTimestamp('最终页面内容验证失败', 'ERROR');
            emitter.emit('message', '500');
            return {
                success: false,
                error: 'FINAL_VERIFICATION_FAILED',
                message: '登录成功后基于页面内容验证失败',
            };
        }

        const cookieId = uuidv1();
        fs.mkdirSync(COOKIES_DIR, { recursive: true });
        const cookiePath = path.join(COOKIES_DIR, `${cookieId}.json`);
        await context.storageState({ path: cookiePath });
        await logWithTimestamp(`Cookie信息已保存到: ${cookiePath}`);

        const result = await getCookieService().checkCookie(4, `${cookieId}.json`);
        if (!result) {
            await logWithTimestamp('Cookie验证失败，登录状态无效', 'ERROR');
            emitter.emit('message', '500');
            const errorMsg = 'Cookie验证失败，登录状态无效';
            logger.error(errorMsg);
            return { success: false, error: 'COOKIE_VALIDATION_FAILED', message: errorMsg };
        }

        const groupId = getOrCreateGroup(groupName);
        saveUserInfo(4, `${cookieId}.json`, id, groupId);
        emitter.emit('message', '200');
    } catch (error: any) {
        if (error.message === 'AbortError') throw error;
        logger.error(`快手登录发生未捕获异常: ${error.message}`);
        emitter.emit('message', '500');
        return { success: false, error: 'UNEXPECTED_ERROR', message: error.message };
    } finally {
        signal.removeEventListener('abort', abortHandler);
        await page.close().catch(() => { });
        await context.close().catch(() => { });
        await browser.close().catch(() => { });
    }
}

/**
 * Xiaohongshu login implementation
 */
export async function xiaohongshuCookieGen(
    id: string,
    emitter: EventEmitter,
    signal: AbortSignal,
    groupName?: string | null
): Promise<any> {
    const screenshotDir = createScreenshotDir('xiaohongshu');

    const browser = await launchBrowser();
    const abortHandler = () => {
        logger.info('[Login:Xiaohongshu] Detected abort signal, closing browser...');
        browser.close().catch(() => {});
    };
    signal.addEventListener('abort', abortHandler);

    const context = await setInitScript(await browser.newContext());
    const page = await context.newPage();

    try {
        if (signal.aborted) return;
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

        // Wait for login success via framenavigated events
        try {
            await new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('TIMEOUT'));
                }, 30000);

                const onFrameNavigated = async (frame: any) => {
                    if (frame !== page.mainFrame()) return;

                    if (page.url() !== originalUrl) {
                        debugPrint(`[DEBUG] 小红书原页面URL变化: ${originalUrl} -> ${page.url()}`);
                        clearTimeout(timeoutId);
                        page.off('framenavigated', onFrameNavigated);
                        resolve();
                    }
                };

                page.on('framenavigated', onFrameNavigated);

                signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    page.off('framenavigated', onFrameNavigated);
                    reject(new Error('AbortError'));
                });
            });
            logger.info('小红书 监听页面跳转成功');
        } catch (err: any) {
            if (err.message === 'AbortError') throw err;
            emitter.emit('message', '500');
            logger.warn('小红书登录页面跳转监听超时');
            return { success: false, error: 'TIMEOUT' };
        }

        if (signal.aborted) throw new Error('AbortError');

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
        signal.removeEventListener('abort', abortHandler);
        await page.close().catch(() => {});
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
    }
}

/**
 * Bilibili login implementation
 */
export async function bilibiliCookieGen(
    id: string,
    emitter: EventEmitter,
    signal: AbortSignal,
    groupName?: string | null
): Promise<any> {
    const screenshotDir = createScreenshotDir('bilibili');

    const browser = await launchBrowser();
    const abortHandler = () => {
        logger.info('[Login:Bilibili] Detected abort signal, closing browser...');
        browser.close().catch(() => {});
    };
    signal.addEventListener('abort', abortHandler);

    const context = await setInitScript(await browser.newContext());
    const page = await context.newPage();

    try {
        if (signal.aborted) return;
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
            await new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('TIMEOUT'));
                }, 60000);

                const onUrlChange = async () => {
                    const currentUrl = page.url();
                    const urlObj = new URL(currentUrl);
                    if (currentUrl !== originalUrl && urlObj.hostname !== 'passport.bilibili.com') {
                        clearTimeout(timeoutId);
                        resolve();
                    }
                };

                page.on('framenavigated', async (frame) => {
                    if (frame === page.mainFrame()) {
                        await onUrlChange();
                    }
                });

                signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new Error('AbortError'));
                });
            });
            debugPrint('[DEBUG] Bilibili登录检测成功');
        } catch (err: any) {
            if (err.message === 'AbortError') throw err;
            logger.warn('Bilibili登录页面跳转监听超时');
            emitter.emit('message', '500');
            return { success: false, error: 'TIMEOUT' };
        }

        if (signal.aborted) throw new Error('AbortError');

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
        signal.removeEventListener('abort', abortHandler);
        await page.close().catch(() => {});
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
    }
}
