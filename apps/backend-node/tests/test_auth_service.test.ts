/**
 * Auth service test.
 * Mirrors: apps/backend/tests/test_auth.py + test_auth_service.py
 */

import { describe, expect, it } from 'vitest';
import { DefaultAuthService } from '../src/services/auth-service.js';
import { MockAuthService, MockCookieService } from './mock-services.js';

describe('MockAuthService', () => {
    it('should return true when cookieValid is true', async () => {
        const service = new MockAuthService(true);
        expect(await service.cookieAuthDouyin('test.json')).toBe(true);
        expect(await service.cookieAuthTencent('test.json')).toBe(true);
        expect(await service.cookieAuthKs('test.json')).toBe(true);
        expect(await service.cookieAuthXhs('test.json')).toBe(true);
        expect(await service.cookieAuthBilibili('test.json')).toBe(true);
    });

    it('should return false when cookieValid is false', async () => {
        const service = new MockAuthService(false);
        expect(await service.cookieAuthDouyin('test.json')).toBe(false);
    });
});

describe('MockCookieService', () => {
    it('should validate by platform type', async () => {
        const service = new MockCookieService(true);
        expect(await service.checkCookie(1, 'test.json')).toBe(true);
        expect(await service.checkCookie(5, 'test.json')).toBe(true);
        expect(await service.checkCookie(99, 'test.json')).toBe(false);
    });
});

describe('DefaultAuthService', () => {
    it('should delegate to cookie service', async () => {
        const mockCookie = new MockCookieService(true);
        const authService = new DefaultAuthService(mockCookie);
        expect(await authService.cookieAuthDouyin('test.json')).toBe(true);
    });
});
