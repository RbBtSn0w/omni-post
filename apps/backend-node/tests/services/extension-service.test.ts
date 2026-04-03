import fs from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenCLIRunner } from '../../src/core/opencli-runner.js';
import { dbManager } from '../../src/db/database.js';
import type { OCSManifest } from '../../src/services/extension-service.js';
import { ExtensionService } from '../../src/services/extension-service.js';

vi.mock('fs');
const { execFileSyncMock } = vi.hoisted(() => ({
  execFileSyncMock: vi.fn()
}));
vi.mock('child_process', () => ({
  execFileSync: execFileSyncMock.mockImplementation(() => {
    throw new Error('Not found');
  })
}));
vi.mock('../../src/db/database.js');
vi.mock('../../src/core/opencli-runner.js', () => ({
  OpenCLIRunner: {
    run: vi.fn().mockResolvedValue({ code: 1, stdout: '', stderr: '' })
  }
}));

describe('ExtensionService', () => {
  let service: ExtensionService;

  beforeEach(() => {
    service = new ExtensionService();
    vi.clearAllMocks();
    execFileSyncMock.mockImplementation(() => {
      throw new Error('Not found');
    });
    vi.mocked(OpenCLIRunner.run).mockResolvedValue({ code: 1, stdout: '', stderr: '' });
  });

  type MockRow = Record<string, unknown>;
  type MockDb = {
    transaction: (fn: () => void) => () => void;
    prepare: ReturnType<typeof vi.fn>;
  };

  const createMockDb = (results: MockRow[] = []): MockDb => ({
    transaction: (fn: () => void) => () => fn(),
    prepare: vi.fn().mockReturnValue({
      run: vi.fn(),
      all: vi.fn().mockReturnValue(results)
    })
  });

  it('should skip discovery if extension directory does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);

    const db = createMockDb();
    vi.mocked(dbManager.getDb).mockReturnValue(db as ReturnType<typeof dbManager.getDb>);

    const count = await service.syncExtensions();
    expect(count).toBe(0);
    expect(fs.mkdirSync).toHaveBeenCalled();
  });

  it('should find and register local extensions with valid manifests', async () => {
    const mockManifest: OCSManifest = {
      ocs_version: '1.0',
      name: 'Test Platform',
      version: '1.0.0',
      command: 'node test.js',
      actions: {
        publish_article: { args: { title: '-t', content: '-c' } }
      }
    };

    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const sp = String(p);
      if (sp.endsWith('extensions')) return true;
      if (sp.includes('test_ext') && sp.endsWith('manifest.ocs.json')) return true;
      return false;
    });
    vi.mocked(fs.readdirSync).mockReturnValue(['test_ext'] as unknown as ReturnType<typeof fs.readdirSync>);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as unknown as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockManifest));

    const db = createMockDb();
    vi.mocked(dbManager.getDb).mockReturnValue(db as ReturnType<typeof dbManager.getDb>);

    const count = await service.syncExtensions();
    expect(count).toBe(1);
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE INTO system_extensions'));
  });

  it('should handle invalid JSON in manifest gracefully', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue(['bad_ext'] as unknown as ReturnType<typeof fs.readdirSync>);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as unknown as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue('INVALID JSON');

    const db = createMockDb();
    vi.mocked(dbManager.getDb).mockReturnValue(db as ReturnType<typeof dbManager.getDb>);

    const count = await service.syncExtensions();
    expect(count).toBe(0);
  });

  it('should discover system platforms from opencli list --json output', async () => {
    execFileSyncMock.mockImplementation((cmd: string, args: string[]) => {
      if (cmd === 'which' && args[0] === 'opencli') return '/usr/local/bin/opencli';
      if (args[0] === '--version') return '1.4.0';
      return '';
    });

    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);

    vi.mocked(OpenCLIRunner.run).mockImplementation(async (_command: string, args: string[]) => {
      if (args.join(' ') === 'list --json') {
        return {
          code: 0,
          stdout: JSON.stringify([
            {
              command: 'xiaohongshu/publish',
              site: 'xiaohongshu',
              name: 'publish',
              description: 'publish note',
              args: [{ name: 'title' }, { name: 'content' }, { name: 'images' }]
            },
            {
              command: 'twitter/post',
              site: 'twitter',
              name: 'post',
              description: 'post tweet',
              args: [{ name: 'text' }]
            }
          ]),
          stderr: ''
        };
      }
      return { code: 1, stdout: '', stderr: '' };
    });

    const insertedRows: Array<{ platform_id: number; name: string; manifest: OCSManifest }> = [];
    const db = {
      transaction: (fn: () => void) => () => fn(),
      prepare: vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('INSERT OR REPLACE INTO system_extensions')) {
          return {
            run: (_id: string, platform_id: number, name: string, manifest: string) => {
              insertedRows.push({ platform_id, name, manifest: JSON.parse(manifest) as OCSManifest });
            }
          };
        }
        return { run: vi.fn(), all: vi.fn().mockReturnValue([]) };
      })
    };
    vi.mocked(dbManager.getDb).mockReturnValue(db as ReturnType<typeof dbManager.getDb>);

    const count = await service.syncExtensions();
    expect(count).toBe(2);
    expect(insertedRows).toHaveLength(2);
    const names = insertedRows.map((r) => r.name).sort();
    expect(names).toEqual(['Twitter', 'Xiaohongshu']);
    const xhs = insertedRows.find((r) => r.name === 'Xiaohongshu');
    expect(xhs?.manifest.actions.publish_article).toBeTruthy();
  });
});
