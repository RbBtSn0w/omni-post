/**
 * Cookie service dispatch test.
 * Mirrors: apps/backend/tests/test_cookie_service_dispatch.py
 */

import { describe, expect, it, vi } from 'vitest';
import { PlatformType } from '../src/core/constants.js';
import { DefaultCookieService } from '../src/services/cookie-service.js';

// Mock the browser module to avoid actual browser launches
vi.mock('../src/core/browser.js', () => ({
    launchBrowser: vi.fn(),
    setInitScript: vi.fn(),
}));

describe('CookieService Dispatch', () => {
    it('should dispatch checkCookie to correct platform methods', async () => {
        const service = new DefaultCookieService();

        // Mock individual methods
        service.cookieAuthXhs = vi.fn().mockResolvedValue(true);
        service.cookieAuthTencent = vi.fn().mockResolvedValue(true);
        service.cookieAuthDouyin = vi.fn().mockResolvedValue(true);
        service.cookieAuthKs = vi.fn().mockResolvedValue(true);
        service.cookieAuthBilibili = vi.fn().mockResolvedValue(true);

        expect(await service.checkCookie(PlatformType.XIAOHONGSHU, 'test.json')).toBe(true);
        expect(service.cookieAuthXhs).toHaveBeenCalled();

        expect(await service.checkCookie(PlatformType.TENCENT, 'test.json')).toBe(true);
        expect(service.cookieAuthTencent).toHaveBeenCalled();

        expect(await service.checkCookie(PlatformType.DOUYIN, 'test.json')).toBe(true);
        expect(service.cookieAuthDouyin).toHaveBeenCalled();

        expect(await service.checkCookie(PlatformType.KUAISHOU, 'test.json')).toBe(true);
        expect(service.cookieAuthKs).toHaveBeenCalled();

        expect(await service.checkCookie(PlatformType.BILIBILI, 'test.json')).toBe(true);
        expect(service.cookieAuthBilibili).toHaveBeenCalled();
    });

    it('should return false for unknown platform type', async () => {
        const service = new DefaultCookieService();
        expect(await service.checkCookie(999, 'test.json')).toBe(false);
    });
});
