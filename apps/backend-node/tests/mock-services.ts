/**
 * Mock services for testing.
 * Mirrors: apps/backend/tests/mock_services.py
 */

import { EventEmitter } from 'events';
import type { AuthService } from '../src/services/auth-service.js';
import type { CookieService } from '../src/services/cookie-service.js';
import type { LoginService } from '../src/services/login-service.js';

/**
 * MockAuthService — always returns configurable cookie_valid
 */
export class MockAuthService implements AuthService {
    constructor(public cookieValid: boolean = true) { }

    async cookieAuthDouyin(_accountFile: string): Promise<boolean> { return this.cookieValid; }
    async cookieAuthTencent(_accountFile: string): Promise<boolean> { return this.cookieValid; }
    async cookieAuthKs(_accountFile: string): Promise<boolean> { return this.cookieValid; }
    async cookieAuthXhs(_accountFile: string): Promise<boolean> { return this.cookieValid; }
    async cookieAuthBilibili(_accountFile: string): Promise<boolean> { return this.cookieValid; }
}

/**
 * MockCookieService — all methods return configurable cookieValid.
 */
export class MockCookieService implements CookieService {
    constructor(public cookieValid: boolean = true) { }

    async cookieAuthDouyin(_accountFile: string): Promise<boolean> { return this.cookieValid; }
    async cookieAuthTencent(_accountFile: string): Promise<boolean> { return this.cookieValid; }
    async cookieAuthKs(_accountFile: string): Promise<boolean> { return this.cookieValid; }
    async cookieAuthXhs(_accountFile: string): Promise<boolean> { return this.cookieValid; }
    async cookieAuthBilibili(_accountFile: string): Promise<boolean> { return this.cookieValid; }
    async checkCookie(platformType: number, _filePath: string): Promise<boolean> {
        return platformType >= 1 && platformType <= 5 ? this.cookieValid : false;
    }
}

/**
 * MockLoginService — emits mock QR code URL + status code
 */
export class MockTestLoginService implements LoginService {
    loginStatus: boolean;
    cookieValid: boolean;
    pollTimeout: number;
    pollInterval: number;

    constructor(loginStatus = true, cookieValid = true, pollTimeout = 30, pollInterval = 1.0) {
        this.loginStatus = loginStatus;
        this.cookieValid = cookieValid;
        this.pollTimeout = pollTimeout;
        this.pollInterval = pollInterval;
    }

    private emitResult(emitter: EventEmitter, platform: string): void {
        emitter.emit('message', `https://mock-qrcode-url.com/${platform}`);
        emitter.emit('message', this.loginStatus && this.cookieValid ? '200' : '500');
    }

    async douyinCookieGen(_id: string, emitter: EventEmitter, _signal: AbortSignal): Promise<any> { this.emitResult(emitter, 'douyin'); return {}; }
    async getTencentCookie(_id: string, emitter: EventEmitter, _signal: AbortSignal): Promise<any> { this.emitResult(emitter, 'tencent'); return {}; }
    async getKsCookie(_id: string, emitter: EventEmitter, _signal: AbortSignal): Promise<any> { this.emitResult(emitter, 'ks'); return {}; }
    async xiaohongshuCookieGen(_id: string, emitter: EventEmitter, _signal: AbortSignal): Promise<any> { this.emitResult(emitter, 'xiaohongshu'); return {}; }
    async bilibiliCookieGen(_id: string, emitter: EventEmitter, _signal: AbortSignal): Promise<any> { this.emitResult(emitter, 'bilibili'); return {}; }
}
