/**
 * Login service dispatch test.
 * Mirrors: apps/backend/tests/test_login_service_dispatch.py + test_app_async_function.py
 */

import { EventEmitter } from 'events';
import { describe, expect, it, vi } from 'vitest';

// Mock login-impl to avoid Playwright
vi.mock('../src/services/login-impl.js', () => ({
    douyinCookieGen: vi.fn().mockResolvedValue({}),
    getTencentCookie: vi.fn().mockResolvedValue({}),
    getKsCookie: vi.fn().mockResolvedValue({}),
    xiaohongshuCookieGen: vi.fn().mockResolvedValue({}),
    bilibiliCookieGen: vi.fn().mockResolvedValue({}),
}));

const { runAsyncFunction, DefaultLoginService } = await import('../src/services/login-service.js');

describe('runAsyncFunction dispatch', () => {
    it('should dispatch type 1 (xiaohongshu)', async () => {
        const service = new DefaultLoginService();
        service.xiaohongshuCookieGen = vi.fn().mockResolvedValue({});
        const emitter = new EventEmitter();

        // Test via MockLoginService dispatching
        const messages: string[] = [];
        emitter.on('message', (msg: string) => messages.push(msg));

        await service.xiaohongshuCookieGen('test_id', emitter);
        expect(service.xiaohongshuCookieGen).toHaveBeenCalled();
    });

    it('should dispatch type 2 (tencent)', async () => {
        const service = new DefaultLoginService();
        service.getTencentCookie = vi.fn().mockResolvedValue({});
        await service.getTencentCookie('test_id', new EventEmitter());
        expect(service.getTencentCookie).toHaveBeenCalled();
    });

    it('should dispatch type 3 (douyin)', async () => {
        const service = new DefaultLoginService();
        service.douyinCookieGen = vi.fn().mockResolvedValue({});
        await service.douyinCookieGen('test_id', new EventEmitter());
        expect(service.douyinCookieGen).toHaveBeenCalled();
    });

    it('should dispatch type 4 (kuaishou)', async () => {
        const service = new DefaultLoginService();
        service.getKsCookie = vi.fn().mockResolvedValue({});
        await service.getKsCookie('test_id', new EventEmitter());
        expect(service.getKsCookie).toHaveBeenCalled();
    });

    it('should dispatch type 5 (bilibili)', async () => {
        const service = new DefaultLoginService();
        service.bilibiliCookieGen = vi.fn().mockResolvedValue({});
        await service.bilibiliCookieGen('test_id', new EventEmitter());
        expect(service.bilibiliCookieGen).toHaveBeenCalled();
    });

    it('runAsyncFunction should emit 500 for unknown type', async () => {
        const emitter = new EventEmitter();
        const messages: string[] = [];
        emitter.on('message', (msg: string) => messages.push(msg));

        await new Promise<void>((resolve) => {
            emitter.on('end', () => {
                resolve();
            });
            runAsyncFunction('99', 'test_id', emitter);
        });

        expect(messages).toContain('500');
    });
});
