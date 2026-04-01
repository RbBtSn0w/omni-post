import { beforeEach, describe, expect, it, vi } from 'vitest';
import { capabilityService } from '../../src/services/capability-service.js';
import { extensionService } from '../../src/services/extension-service.js';

vi.mock('../../src/services/extension-service.js');

describe('CapabilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include builtin capabilities', () => {
    vi.mocked(extensionService.getAllExtensions).mockReturnValue([]);
    const all = capabilityService.getAllCapabilities();
    expect(all.some((item) => item.id === 'builtin:douyin:publish_video')).toBe(true);
  });

  it('should convert extension actions into dynamic capabilities', () => {
    vi.mocked(extensionService.getAllExtensions).mockReturnValue([
      {
        id: 'system-xhs',
        platform_id: 10001,
        name: 'Xiaohongshu',
        manifest: {
          ocs_version: '1.0',
          name: 'Xiaohongshu',
          version: 'system',
          actions: {
            publish_article: {
              command: 'xiaohongshu/publish',
              args: { title: '--title', content: '--content' }
            }
          }
        },
        executable: '/usr/local/bin/opencli',
        source_type: 'system'
      }
    ]);

    const all = capabilityService.getAllCapabilities();
    const cap = all.find((item) => item.id === 'opencli:10001:publish_article');
    expect(cap).toBeTruthy();
    expect(cap?.kind).toBe('publish.article');
  });
});
