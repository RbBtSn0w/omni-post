/**
 * OpenCLI Uploader bridge unit tests.
 * Tests parameter mapping, credential injection, and error handling.
 */
import type { BrowserContext } from 'playwright';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('../../src/core/opencli-runner.js', () => ({
    OpenCLIRunner: {
        run: vi.fn(),
    },
}));

vi.mock('../../src/services/extension-service.js', () => ({
    extensionService: {
        getExtensionByPlatformId: vi.fn(),
        getCredentials: vi.fn(),
    },
}));

vi.mock('../../src/core/logger.js', () => ({
    logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { OpenCLIRunner } from '../../src/core/opencli-runner.js';
import { extensionService } from '../../src/services/extension-service.js';

describe('OpenCLIUploader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const makeExtension = (overrides = {}) => ({
        id: 'local-test',
        platform_id: 101,
        name: 'TestPlatform',
        manifest: {
            ocs_version: '1.0',
            name: 'TestPlatform',
            version: '1.0.0',
            executable_args: ['site1'],
            actions: {
                publish_video: {
                    command: 'upload',
                    args: { title: '--title', tags: '--tags', filelist: '--file' },
                    progress_regex: 'Progress: (\\d+)%',
                },
                publish_article: {
                    command: 'publish',
                    args: { title: '--title', content: '--content' },
                },
            },
        },
        executable: '/usr/local/bin/test-cli',
        source_type: 'local' as const,
        ...overrides,
    });

    const baseOpts = {
        title: 'Test Title',
        fileList: ['video.mp4'],
        tags: ['tag1', 'tag2'],
        accountList: [],
        platform_id: 101,
        userName: 'testuser',
    };

    it('should map options to CLI flags for postVideo', async () => {
        const ext = makeExtension();
        vi.mocked(extensionService.getExtensionByPlatformId).mockReturnValue(ext);
        vi.mocked(extensionService.getCredentials).mockReturnValue({});
        vi.mocked(OpenCLIRunner.run).mockResolvedValue({ code: 0, stdout: '', stderr: '' });

        const { OpenCLIUploader } = await import('../../src/uploader/opencli/main.js');
        const uploader = new OpenCLIUploader();
        const ctx = null as unknown as BrowserContext;

        await uploader.postVideo(ctx, baseOpts, vi.fn());

        expect(OpenCLIRunner.run).toHaveBeenCalledTimes(1);
        const [cmd, args] = vi.mocked(OpenCLIRunner.run).mock.calls[0];
        expect(cmd).toBe('/usr/local/bin/test-cli');
        // Should contain: base args + command + mapped flags
        expect(args).toContain('site1');
        expect(args).toContain('upload');
        expect(args).toContain('--title');
        expect(args).toContain('Test Title');
        expect(args).toContain('--tags');
        expect(args).toContain('tag1,tag2');
    });

    it('should inject credentials from extensionService', async () => {
        const ext = makeExtension({
            manifest: {
                ...makeExtension().manifest,
                actions: {
                    publish_video: {
                        command: 'post',
                        args: { title: '--title', token: '--token' },
                    },
                },
            },
        });
        vi.mocked(extensionService.getExtensionByPlatformId).mockReturnValue(ext);
        vi.mocked(extensionService.getCredentials).mockReturnValue({ token: 'secret-abc' });
        vi.mocked(OpenCLIRunner.run).mockResolvedValue({ code: 0, stdout: '', stderr: '' });

        const { OpenCLIUploader } = await import('../../src/uploader/opencli/main.js');
        const uploader = new OpenCLIUploader();

        await uploader.postVideo(null as unknown as BrowserContext, baseOpts, vi.fn());

        const [, args] = vi.mocked(OpenCLIRunner.run).mock.calls[0];
        expect(args).toContain('--token');
        expect(args).toContain('secret-abc');
    });

    it('should throw if platform is not found in registry', async () => {
        vi.mocked(extensionService.getExtensionByPlatformId).mockReturnValue(null);

        const { OpenCLIUploader } = await import('../../src/uploader/opencli/main.js');
        const uploader = new OpenCLIUploader();

        await expect(
            uploader.postVideo(null as unknown as BrowserContext, baseOpts, vi.fn())
        ).rejects.toThrow(/not found/i);
    });

    it('should throw if CLI exits with non-zero code', async () => {
        const ext = makeExtension();
        vi.mocked(extensionService.getExtensionByPlatformId).mockReturnValue(ext);
        vi.mocked(extensionService.getCredentials).mockReturnValue({});
        vi.mocked(OpenCLIRunner.run).mockResolvedValue({
            code: 1,
            stdout: '',
            stderr: 'Publish failed: auth expired',
        });

        const { OpenCLIUploader } = await import('../../src/uploader/opencli/main.js');
        const uploader = new OpenCLIUploader();

        await expect(
            uploader.postVideo(null as unknown as BrowserContext, baseOpts, vi.fn())
        ).rejects.toThrow(/auth expired/);
    });

    it('should handle postArticle with nested article fields', async () => {
        const ext = makeExtension();
        vi.mocked(extensionService.getExtensionByPlatformId).mockReturnValue(ext);
        vi.mocked(extensionService.getCredentials).mockReturnValue({});
        vi.mocked(OpenCLIRunner.run).mockResolvedValue({ code: 0, stdout: '', stderr: '' });

        const { OpenCLIUploader } = await import('../../src/uploader/opencli/main.js');
        const uploader = new OpenCLIUploader();

        const opts = {
            ...baseOpts,
            article: { title: 'Article Title', content: 'Article Body', tags: ['t1'] },
        };

        await uploader.postArticle(null as unknown as BrowserContext, opts, vi.fn());

        const [, args] = vi.mocked(OpenCLIRunner.run).mock.calls[0];
        expect(args).toContain('--title');
        expect(args).toContain('--content');
    });

    it('should throw if platform does not support requested action', async () => {
        const ext = makeExtension({
            manifest: {
                ...makeExtension().manifest,
                actions: {}, // No actions at all
            },
        });
        vi.mocked(extensionService.getExtensionByPlatformId).mockReturnValue(ext);
        vi.mocked(extensionService.getCredentials).mockReturnValue({});

        const { OpenCLIUploader } = await import('../../src/uploader/opencli/main.js');
        const uploader = new OpenCLIUploader();

        await expect(
            uploader.postVideo(null as unknown as BrowserContext, baseOpts, vi.fn())
        ).rejects.toThrow(/does not support/i);
    });
});
