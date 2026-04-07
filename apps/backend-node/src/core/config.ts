/**
 * Core configuration module for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/core/config.py
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

// Directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** src/ directory */
export const BASE_DIR = path.resolve(__dirname, '..');
/** apps/backend-node/ directory */
export const ROOT_DIR = path.resolve(BASE_DIR, '..');
/** apps/backend-node/data/ directory */
export const DATA_DIR = path.join(ROOT_DIR, 'data');
/** apps/backend-node/data/cookies/ */
export const COOKIES_DIR = path.join(DATA_DIR, 'cookies');
/** apps/backend-node/data/videos/ */
export const VIDEOS_DIR = path.join(DATA_DIR, 'videos');
/** apps/backend-node/data/logs/ */
export const LOGS_DIR = path.join(DATA_DIR, 'logs');

// Ensure directories exist
for (const dir of [DATA_DIR, COOKIES_DIR, VIDEOS_DIR, LOGS_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
}

// File upload settings
const parseUploadSize = (val: string | undefined): number => {
    const parsed = parseInt(val || '102400', 10);
    if (isNaN(parsed) || parsed < 1) return 102400;
    // Clamp to 500GB upper bound to avoid extreme allocations or overflows
    return Math.min(parsed, 512000);
};
/** Upload limit in bytes, defaults to 100GB */
export const MAX_UPLOAD_SIZE = parseUploadSize(process.env.MAX_UPLOAD_SIZE_MB) * 1024 * 1024;

// Server settings
export const SERVER_HOST = '0.0.0.0';
export const SERVER_PORT = 5409;
export const XHS_SERVER = 'http://127.0.0.1:11901';

// Debug / Test mode switches
export let DEBUG_MODE = true;
export let TEST_MODE = false;

// Mock configuration (for test patching)
export const MOCK_CONFIG = { login_status: false, cookie_valid: false };

/**
 * Set test mode (used by tests to override)
 */
export function setTestMode(value: boolean): void {
    TEST_MODE = value;
}

/**
 * Set debug mode
 */
export function setDebugMode(value: boolean): void {
    DEBUG_MODE = value;
}

// Chrome browser path configuration
function detectChromePath(): string | null {
    const platform = os.platform();
    if (platform === 'win32') {
        return 'C:/Program Files/Google/Chrome/Application/chrome.exe';
    } else if (platform === 'darwin') {
        return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else {
        return '/usr/bin/google-chrome';
    }
}

export const LOCAL_CHROME_PATH = detectChromePath();

// Headless mode setting - defaults to true (especially for CI/Linux) unless disabled
export const LOCAL_CHROME_HEADLESS = process.env.LOCAL_CHROME_HEADLESS !== 'false';

/**
 * Log browser configuration information at startup.
 */
export function logBrowserInfo(): void {
    if (TEST_MODE) return;

    if (!LOCAL_CHROME_PATH) {
        console.log('📌 使用 Playwright 自带的 Chromium 浏览器');
        console.log('💡 如需使用系统 Chrome，请修改配置中的 LOCAL_CHROME_PATH');
    } else {
        if (!fs.existsSync(LOCAL_CHROME_PATH)) {
            console.log(`⚠️  警告：Chrome 路径不存在: ${LOCAL_CHROME_PATH}`);
            console.log('💡 建议将 LOCAL_CHROME_PATH 设置为 null 以使用 Playwright 自带的 Chromium');
        } else {
            console.log(`📌 使用系统 Chrome: ${LOCAL_CHROME_PATH}`);
        }
    }
}
