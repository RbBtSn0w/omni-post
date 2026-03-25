/**
 * Authentication service for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/services/auth_service.py
 */

import { CookieService, getCookieService } from './cookie-service.js';

/**
 * AuthService interface — delegates to CookieService
 */
export interface AuthService {
    cookieAuthDouyin(accountFile: string): Promise<boolean>;
    cookieAuthWxChannels(accountFile: string): Promise<boolean>;
    cookieAuthKs(accountFile: string): Promise<boolean>;
    cookieAuthXhs(accountFile: string): Promise<boolean>;
    cookieAuthBilibili(accountFile: string): Promise<boolean>;
}

/**
 * Default implementation — delegates to CookieService
 */
export class DefaultAuthService implements AuthService {
    private cookieService: CookieService;

    constructor(cookieService?: CookieService) {
        this.cookieService = cookieService ?? getCookieService();
    }

    async cookieAuthDouyin(accountFile: string): Promise<boolean> {
        return this.cookieService.cookieAuthDouyin(accountFile);
    }

    async cookieAuthWxChannels(accountFile: string): Promise<boolean> {
        return this.cookieService.cookieAuthWxChannels(accountFile);
    }

    async cookieAuthKs(accountFile: string): Promise<boolean> {
        return this.cookieService.cookieAuthKs(accountFile);
    }

    async cookieAuthXhs(accountFile: string): Promise<boolean> {
        return this.cookieService.cookieAuthXhs(accountFile);
    }

    async cookieAuthBilibili(accountFile: string): Promise<boolean> {
        return this.cookieService.cookieAuthBilibili(accountFile);
    }
}

// Singleton
let _authService: AuthService | null = null;

export function getAuthService(): AuthService {
    if (!_authService) {
        _authService = new DefaultAuthService();
    }
    return _authService;
}

/**
 * Set auth service (for testing / dependency injection)
 */
export function setAuthService(service: AuthService): void {
    _authService = service;
}
