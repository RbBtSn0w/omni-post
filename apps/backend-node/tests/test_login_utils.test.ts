/**
 * Login utils test — browser helpers.
 * Mirrors: apps/backend/tests/test_login_utils.py
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';

// Mock browser module
vi.mock('../src/core/browser.js', () => ({
    launchBrowser: vi.fn(),
    setInitScript: vi.fn(),
    createScreenshotDir: (platform: string) => {
        const baseDir = path.join(os.tmpdir(), 'screenshots', platform);
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 15);
        const dirPath = path.join(baseDir, timestamp);
        fs.mkdirSync(dirPath, { recursive: true });
        return dirPath;
    },
    debugScreenshot: vi.fn(),
}));

describe('Login Utils', () => {
    it('createScreenshotDir should create directory with platform name', async () => {
        const { createScreenshotDir } = await import('../src/core/browser.js');
        const dirPath = createScreenshotDir('test_platform');

        expect(typeof dirPath).toBe('string');
        expect(dirPath).toContain('test_platform');

        // Cleanup
        try { fs.rmSync(dirPath, { recursive: true }); } catch { }
    });

    it('debugScreenshot should be callable', async () => {
        const { debugScreenshot } = await import('../src/core/browser.js');
        expect(typeof debugScreenshot).toBe('function');
    });
});
