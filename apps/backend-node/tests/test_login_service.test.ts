/**
 * Login service test — tests MockLoginService behavior.
 * Mirrors: apps/backend/tests/test_login_mock.py + test_login_service.py
 */

import { EventEmitter } from 'events';
import { describe, expect, it } from 'vitest';
import { MockLoginService, getLoginService } from '../src/services/login-service.js';

describe('MockLoginService', () => {
    it('should emit QR code URL and 200 on success', async () => {
        const service = new MockLoginService(true, true);
        const emitter = new EventEmitter();
        const messages: string[] = [];
        emitter.on('message', (msg: string) => messages.push(msg));

        await service.douyinCookieGen('user1', emitter);
        expect(messages).toContain('https://mock-qrcode-url.com/douyin');
        expect(messages).toContain('200');
    });

    it('should emit 500 on login failure', async () => {
        const service = new MockLoginService(false, true);
        const emitter = new EventEmitter();
        const messages: string[] = [];
        emitter.on('message', (msg: string) => messages.push(msg));

        await service.getTencentCookie('user1', emitter);
        expect(messages).toContain('500');
    });

    it('should emit 500 on invalid cookie', async () => {
        const service = new MockLoginService(true, false);
        const emitter = new EventEmitter();
        const messages: string[] = [];
        emitter.on('message', (msg: string) => messages.push(msg));

        await service.getKsCookie('user1', emitter);
        expect(messages).toContain('500');
    });

    it('should work for all platforms', async () => {
        const service = new MockLoginService(true, true);
        const platforms = ['douyinCookieGen', 'getTencentCookie', 'getKsCookie', 'xiaohongshuCookieGen', 'bilibiliCookieGen'] as const;

        for (const method of platforms) {
            const emitter = new EventEmitter();
            const messages: string[] = [];
            emitter.on('message', (msg: string) => messages.push(msg));
            await (service as any)[method]('user1', emitter);
            expect(messages).toContain('200');
        }
    });
});

describe('getLoginService', () => {
    it('should return MockLoginService when config provided', () => {
        const service = getLoginService({ login_status: true, cookie_valid: false });
        expect(service).toBeInstanceOf(MockLoginService);
        expect(service.cookieValid).toBe(false);
    });

    it('should return DefaultLoginService when no config', () => {
        const service = getLoginService();
        expect(service.loginStatus).toBe(true);
    });
});
