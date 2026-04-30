import { describe, expect, it, vi } from 'vitest';

vi.mock('../../core/browser.js', () => ({
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

        expect(uploader.isPublishButtonReadyState({
            disabled: false,
            ariaDisabled: null,
            className: 'submit-btn ready',
            text: '刷新中',
            pointerEvents: 'auto',
        })).toBe(false);

        expect(uploader.isPublishButtonReadyState({
            disabled: false,
            ariaDisabled: null,
            className: 'submit-btn ready',
            text: '加载中...',
            pointerEvents: 'auto',
        })).toBe(false);
    });

    it('classifies timeout and runtime probe failures distinctly', async () => {
        const { BilibiliUploader } = await import('../src/uploader/bilibili/main.js');
        const uploader = new BilibiliUploader() as any;

        const timeoutResult = uploader.probeTimeoutResult(new Error('Timeout 10000ms exceeded'), 'file_chooser_injection', 'video_a.mp4');
        expect(timeoutResult).toEqual({ kind: 'timeout' });

        const runtimeResult = uploader.probeRuntimeFailureResult(new Error('Execution context was destroyed'), 'input_file_injection', 'video_b.mp4');
        expect(runtimeResult.kind).toBe('runtime_failure');
        expect(runtimeResult.diagnostic).toMatchObject({
            phase: 'input_file_injection',
            errorType: 'Error',
            accountOrTaskId: 'video_b.mp4',
        });
        expect(runtimeResult.diagnostic.message).toContain('Execution context was destroyed');
    });

    it('passes DIAGNOSTIC_TEXT_LIMIT as argument to evaluate callback, not as closure reference', async () => {
        const { BilibiliUploader } = await import('../src/uploader/bilibili/main.js');
        type UploaderInternals = {
            normalizePublishButton: (locator: unknown) => Promise<typeof mockLocator>;
            getPublishButtonState: (locator: unknown) => Promise<unknown>;
        };

        let capturedArgs: unknown[] = [];
        const mockLocator = {
            evaluate: vi.fn(async (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => {
                capturedArgs = args;
                // Call the callback with a minimal element stub and the passed limit
                const el = {
                    closest: () => null,
                    tagName: 'BUTTON',
                    innerText: 'test',
                    className: '',
                    disabled: false,
                    getAttribute: () => null,
                    parentElement: { className: '' },
                };
                return fn(el, args[0]);
            }),
        };

        const uploader = new BilibiliUploader() as unknown as UploaderInternals;
        // Stub normalizePublishButton to return the mock locator directly
        vi.spyOn(uploader, 'normalizePublishButton').mockResolvedValue(mockLocator);

        await uploader.getPublishButtonState({});

        // The limit must be passed as the second argument to evaluate, not referenced via closure
        expect(capturedArgs).toHaveLength(1);
        expect(capturedArgs[0]).toBe(BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT);
    });
});
