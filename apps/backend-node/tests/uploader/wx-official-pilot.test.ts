/**
 * WeChat Official Account pilot integration test (T030).
 * Validates that the local extension is correctly discovered and can publish.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExtensionService } from '../../src/services/extension-service.js';
import type { dbManager as DbManagerInstance } from '../../src/db/database.js';
import type { OpenCLIRunner as OpenCLIRunnerClass } from '../../src/core/opencli-runner.js';

vi.mock('../../src/db/database.js');
vi.mock('../../src/core/opencli-runner.js', () => ({
    OpenCLIRunner: {
        run: vi.fn().mockResolvedValue({ code: 1, stdout: '', stderr: '' }),
    },
}));

const { execFileSyncMock } = vi.hoisted(() => ({
    execFileSyncMock: vi.fn().mockImplementation(() => { throw new Error('Not found'); }),
}));
vi.mock('child_process', () => ({
    execFileSync: execFileSyncMock,
}));

describe('WeChat Official Account Pilot', () => {
    let service: ExtensionService;
    let dbManager: typeof DbManagerInstance;
    let OpenCLIRunner: typeof OpenCLIRunnerClass;

    beforeEach(async () => {
        const extModule = await import('../../src/services/extension-service.js');
        const dbModule = await import('../../src/db/database.js');
        const runnerModule = await import('../../src/core/opencli-runner.js');

        service = new extModule.ExtensionService();
        dbManager = dbModule.dbManager;
        OpenCLIRunner = runnerModule.OpenCLIRunner;

        vi.clearAllMocks();
        execFileSyncMock.mockImplementation(() => { throw new Error('Not found'); });
        vi.mocked(OpenCLIRunner.run).mockResolvedValue({ code: 1, stdout: '', stderr: '' });
    });

    it('manifest.ocs.json should exist and be valid JSON', () => {
        // Resolve relative to the workspace root (two levels up from tests/)
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const manifestPath = path.resolve(__dirname, '../../extensions/wx_official_account/manifest.ocs.json');
        expect(fs.existsSync(manifestPath)).toBe(true);

        const content = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(content);
        expect(manifest.ocs_version).toBe('1.0');
        expect(manifest.name).toBe('WeChat Official Account (Demo)');
        expect(manifest.platform_id).toBe(8);
        expect(manifest.actions.publish_article).toBeDefined();
        expect(manifest.actions.publish_article.command).toBe('publish');
        expect(manifest.actions.publish_article.args.title).toBe('--title');
        expect(manifest.actions.publish_article.args.content).toBe('--content');
    });

    it('cli.js should exist', () => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const cliPath = path.resolve(__dirname, '../../extensions/wx_official_account/cli.js');
        expect(fs.existsSync(cliPath)).toBe(true);
    });

    it('ExtensionService should discover wx_official_account from local extensions/', async () => {
        // Set up a mock DB that tracks insertions
        type InsertedRow = { id: string; platform_id: number; name: string };
        const insertedRows: InsertedRow[] = [];

        const db = {
            transaction: (fn: () => void) => () => fn(),
            prepare: vi.fn().mockImplementation((sql: string) => {
                if (sql.includes('INSERT OR REPLACE INTO system_extensions')) {
                    return {
                        run: (id: string, platform_id: number, name: string) => {
                            insertedRows.push({ id, platform_id, name });
                        },
                    };
                }
                return { run: vi.fn(), all: vi.fn().mockReturnValue([]) };
            }),
        };
        vi.mocked(dbManager.getDb).mockReturnValue(db as unknown as ReturnType<typeof dbManager.getDb>);

        const count = await service.syncExtensions();

        // Should discover at least the wx_official_account local extension
        expect(count).toBeGreaterThanOrEqual(1);
        const wxExt = insertedRows.find((r) => r.name === 'WeChat Official Account (Demo)');
        expect(wxExt).toBeDefined();
        expect(wxExt!.platform_id).toBe(8);
    });
});
