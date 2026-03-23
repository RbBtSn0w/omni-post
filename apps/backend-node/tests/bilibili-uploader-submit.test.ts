import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/core/browser.js', () => ({
    launchBrowser: vi.fn(),
    setInitScript: vi.fn(),
    createScreenshotDir: vi.fn().mockReturnValue('/tmp/screenshots'),
    debugScreenshot: vi.fn(),
}));

describe('BilibiliUploader submit helpers', () => {
    it('recognizes submit request endpoints', async () => {
        const { BilibiliUploader } = await import('../src/uploader/bilibili/main.js');
        const uploader = new BilibiliUploader() as any;

        expect(uploader.isSubmitRequest('https://member.bilibili.com/x/vu/web/add/v3')).toBe(true);
        expect(uploader.isSubmitRequest('https://member.bilibili.com/x/vu/web/add?csrf=abc')).toBe(true);
        expect(uploader.isSubmitRequest('https://member.bilibili.com/archive/add')).toBe(true);
        expect(uploader.isSubmitRequest('https://member.bilibili.com/upload/multipart/complete')).toBe(false);
    });

    it('treats disabled publish button states as not ready', async () => {
        const { BilibiliUploader } = await import('../src/uploader/bilibili/main.js');
        const uploader = new BilibiliUploader() as any;

        expect(uploader.isPublishButtonReadyState({
            disabled: true,
            ariaDisabled: null,
            className: 'submit-btn',
            text: '立即投稿',
            pointerEvents: 'auto',
        })).toBe(false);

        expect(uploader.isPublishButtonReadyState({
            disabled: false,
            ariaDisabled: 'true',
            className: 'submit-btn is-disabled',
            text: '立即投稿',
            pointerEvents: 'auto',
        })).toBe(false);

        expect(uploader.isPublishButtonReadyState({
            disabled: false,
            ariaDisabled: null,
            className: 'submit-btn ready',
            text: '处理中',
            pointerEvents: 'auto',
        })).toBe(false);

        expect(uploader.isPublishButtonReadyState({
            disabled: false,
            ariaDisabled: null,
            className: 'submit-btn ready',
            text: '立即投稿',
            pointerEvents: 'auto',
        })).toBe(true);
    });
});
