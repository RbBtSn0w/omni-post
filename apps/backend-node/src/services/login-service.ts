/**
 * Login service for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/login_service.py
 */

import { EventEmitter } from 'events';
import { logger } from '../core/logger.js';

/**
 * SSE 任务句柄，包含通信通道和取消令牌 (FR-005)
 */
export interface SseTaskHandle {
    emitter: EventEmitter;
    abortController: AbortController;
}

// Global active queues (thread-safe status communication)
export const activeQueues: Map<string, SseTaskHandle> = new Map();

/**
 * SSE stream generator — yields "data: msg\n\n" format
 */
export function createSseStream(emitter: EventEmitter): ReadableStream<string> {
    return new ReadableStream({
        start(controller) {
            const onMessage = (msg: string) => {
                controller.enqueue(`data: ${msg}\n\n`);
            };
            const onEnd = () => {
                controller.close();
            };
            emitter.on('message', onMessage);
            emitter.on('end', onEnd);
        },
    });
}

/**
 * LoginService abstract interface
 */
export interface LoginService {
    loginStatus: boolean;
    cookieValid: boolean;
    pollTimeout: number;
    pollInterval: number;

    douyinCookieGen(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any>;
    getTencentCookie(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any>;
    getKsCookie(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any>;
    xiaohongshuCookieGen(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any>;
    bilibiliCookieGen(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any>;
}

/**
 * MockLoginService — for testing
 */
export class MockLoginService implements LoginService {
    loginStatus: boolean;
    cookieValid: boolean;
    pollTimeout: number;
    pollInterval: number;

    constructor(
        loginStatus = true,
        cookieValid = true,
        pollTimeout = 30,
        pollInterval = 1.0
    ) {
        this.loginStatus = loginStatus;
        this.cookieValid = cookieValid;
        this.pollTimeout = pollTimeout;
        this.pollInterval = pollInterval;
    }

    async douyinCookieGen(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any> {
        if (signal.aborted) return;
        emitter.emit('message', 'https://mock-qrcode-url.com/douyin');
        emitter.emit('message', this.loginStatus && this.cookieValid ? '200' : '500');
        return {};
    }

    async getTencentCookie(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any> {
        if (signal.aborted) return;
        emitter.emit('message', 'https://mock-qrcode-url.com/tencent');
        emitter.emit('message', this.loginStatus && this.cookieValid ? '200' : '500');
        return {};
    }

    async getKsCookie(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any> {
        if (signal.aborted) return;
        emitter.emit('message', 'https://mock-qrcode-url.com/ks');
        emitter.emit('message', this.loginStatus && this.cookieValid ? '200' : '500');
        return {};
    }

    async xiaohongshuCookieGen(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any> {
        if (signal.aborted) return;
        emitter.emit('message', 'https://mock-qrcode-url.com/xiaohongshu');
        emitter.emit('message', this.loginStatus && this.cookieValid ? '200' : '500');
        return {};
    }

    async bilibiliCookieGen(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any> {
        if (signal.aborted) return;
        emitter.emit('message', 'https://mock-qrcode-url.com/bilibili');
        emitter.emit('message', this.loginStatus && this.cookieValid ? '200' : '500');
        return {};
    }
}

/**
 * DefaultLoginService — delegates to actual login implementations
 */
export class DefaultLoginService implements LoginService {
    loginStatus = true;
    cookieValid = true;
    pollTimeout = 30;
    pollInterval = 1.0;

    async douyinCookieGen(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any> {
        const { douyinCookieGen } = await import('./login-impl.js');
        return douyinCookieGen(id, emitter, signal, groupName);
    }

    async getTencentCookie(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any> {
        const { getTencentCookie } = await import('./login-impl.js');
        return getTencentCookie(id, emitter, signal, groupName);
    }

    async getKsCookie(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any> {
        const { getKsCookie } = await import('./login-impl.js');
        return getKsCookie(id, emitter, signal, groupName);
    }

    async xiaohongshuCookieGen(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any> {
        const { xiaohongshuCookieGen } = await import('./login-impl.js');
        return xiaohongshuCookieGen(id, emitter, signal, groupName);
    }

    async bilibiliCookieGen(id: string, emitter: EventEmitter, signal: AbortSignal, groupName?: string | null): Promise<any> {
        const { bilibiliCookieGen } = await import('./login-impl.js');
        return bilibiliCookieGen(id, emitter, signal, groupName);
    }
}

/**
 * Wrapper: Run async login function in a separate execution context.
 * Uses EventEmitter instead of Python's Queue for thread-safe communication.
 */
export function runAsyncFunction(
    type: string,
    id: string,
    emitter: EventEmitter,
    signal: AbortSignal,
    groupName?: string | null
): void {
    const loginService = new DefaultLoginService();

    const run = async () => {
        try {
            switch (type) {
                case '1': await loginService.xiaohongshuCookieGen(id, emitter, signal, groupName); break;
                case '2': await loginService.getTencentCookie(id, emitter, signal, groupName); break;
                case '3': await loginService.douyinCookieGen(id, emitter, signal, groupName); break;
                case '4': await loginService.getKsCookie(id, emitter, signal, groupName); break;
                case '5': await loginService.bilibiliCookieGen(id, emitter, signal, groupName); break;
                default: emitter.emit('message', '500');
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                logger.info(`[Login] Task for ${id} was aborted.`);
            } else {
                logger.error(`[Login] Error: ${error}`);
                emitter.emit('message', '500');
            }
        } finally {
            emitter.emit('end');
        }
    };

    // Run in next tick to not block the current event loop iteration
    setImmediate(() => run());
}

/**
 * Get a LoginService instance.
 * If config is provided, returns a MockLoginService (for testing).
 */
export function getLoginService(config?: Record<string, any>): LoginService {
    if (config !== undefined) {
        return new MockLoginService(
            config.login_status ?? true,
            config.cookie_valid ?? true,
            config.poll_timeout ?? 30,
            config.poll_interval ?? 1.0
        );
    }
    return new DefaultLoginService();
}
