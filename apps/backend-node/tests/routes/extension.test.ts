import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { extensionService } from '../../src/services/extension-service.js';
import { capabilityService } from '../../src/services/capability-service.js';
import type { OCSManifest } from '../../src/services/extension-service.js';

vi.mock('../../src/services/extension-service.js');
vi.mock('../../src/services/capability-service.js');

describe('Extension Routes', () => {
    const app = createApp();
    
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    describe('GET /opencli/status', () => {
        it('should return env status and platform list', async () => {
            vi.mocked(extensionService.checkEnvironment).mockResolvedValue({
                installed: true,
                binary_path: '/usr/bin/opencli',
                version: '1.0.0'
            });
            vi.mocked(extensionService.getAllExtensions).mockReturnValue([
                {
                    id: '1',
                    platform_id: 101,
                    name: 'Test',
                    manifest: { ocs_version: '1.0', name: 'Test', version: '1.0.0', actions: {} } as OCSManifest,
                    executable: 'cmd',
                    source_type: 'system'
                }
            ]);
            vi.mocked(capabilityService.getAllCapabilities).mockReturnValue([]);
            
            const res = await request(app).get('/opencli/status');
            expect(res.status).toBe(200);
            expect(res.body.data.installed).toBe(true);
            expect(res.body.data.platforms).toHaveLength(1);
        });

        it('should auto-sync once when installed and platforms are empty', async () => {
            vi.mocked(extensionService.checkEnvironment).mockResolvedValue({
                installed: true,
                binary_path: '/usr/bin/opencli',
                version: '1.0.0'
            });
            vi.mocked(extensionService.getAllExtensions)
                .mockReturnValueOnce([])
                .mockReturnValueOnce([
                    {
                        id: 's1',
                        platform_id: 10001,
                        name: 'Xiaohongshu',
                        manifest: { ocs_version: '1.0', name: 'Xiaohongshu', version: 'system', actions: {} } as OCSManifest,
                        executable: '/usr/bin/opencli',
                        source_type: 'system'
                    }
                ]);
            vi.mocked(extensionService.syncExtensions).mockResolvedValue(1);
            vi.mocked(capabilityService.getAllCapabilities).mockReturnValue([]);

            const res = await request(app).get('/opencli/status');
            expect(res.status).toBe(200);
            expect(extensionService.syncExtensions).toHaveBeenCalledTimes(1);
            expect(res.body.data.platforms).toHaveLength(1);
        });
    });

    describe('GET /capabilities', () => {
        it('should return capability descriptors', async () => {
            vi.mocked(capabilityService.getAllCapabilities).mockReturnValue([
                {
                    id: 'builtin:douyin:publish_video',
                    site: 'douyin',
                    name: '抖音视频发布',
                    kind: 'publish.video',
                    platform_id: 3,
                    source: 'builtin',
                    requires_auth: true,
                    supports_draft: false,
                    input_schema: { fields: [] }
                }
            ]);

            const res = await request(app).get('/capabilities');
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });
    
    describe('POST /opencli/sync', () => {
        it('should trigger sync and return count', async () => {
            vi.mocked(extensionService.syncExtensions).mockResolvedValue(5);
            
            const res = await request(app).post('/opencli/sync');
            expect(res.status).toBe(200);
            expect(res.body.data.count).toBe(5);
        });
    });
});
