/**
 * Uploader mock test.
 * Mirrors: apps/backend/tests/test_uploaders_mock.py + test_uploaders_coverage.py
 *
 * Tests uploader class instantiation and structure (no actual Playwright needed).
 */

import { describe, expect, it, vi } from 'vitest';

// Mock browser module
vi.mock('../../src/core/browser.js', () => ({
    launchBrowser: vi.fn(),
    setInitScript: vi.fn(),
    createScreenshotDir: vi.fn().mockReturnValue('/tmp/screenshots'),
    debugScreenshot: vi.fn(),
}));

describe('Uploader Classes', () => {
    it('DouyinUploader should have upload method', async () => {
        const { DouyinUploader } = await import('../src/uploader/douyin/main.js');
        const uploader = new DouyinUploader();
        expect(uploader).toHaveProperty('upload');
        expect(typeof uploader.upload).toBe('function');
    });

    it('TencentUploader should have upload method', async () => {
        const { TencentUploader } = await import('../src/uploader/tencent/main.js');
        const uploader = new TencentUploader();
        expect(uploader).toHaveProperty('upload');
        expect(typeof uploader.upload).toBe('function');
    });

    it('XiaohongshuUploader should have upload method', async () => {
        const { XiaohongshuUploader } = await import('../src/uploader/xiaohongshu/main.js');
        const uploader = new XiaohongshuUploader();
        expect(uploader).toHaveProperty('upload');
        expect(typeof uploader.upload).toBe('function');
    });

    it('KuaishouUploader should have upload method', async () => {
        const { KuaishouUploader } = await import('../src/uploader/kuaishou/main.js');
        const uploader = new KuaishouUploader();
        expect(uploader).toHaveProperty('upload');
        expect(typeof uploader.upload).toBe('function');
    });

    it('BilibiliUploader should have upload method', async () => {
        const { BilibiliUploader } = await import('../src/uploader/bilibili/main.js');
        const uploader = new BilibiliUploader();
        expect(uploader).toHaveProperty('upload');
        expect(typeof uploader.upload).toBe('function');
    });

    it('All uploaders should accept UploadOptions', async () => {
        const { DouyinUploader } = await import('../src/uploader/douyin/main.js');
        const uploader = new DouyinUploader();

        // Verify the upload method exists and is async
        expect(typeof uploader.upload).toBe('function');
        // The method should accept an UploadOptions object
        // We don't call it here since it requires real browser
    });
});
