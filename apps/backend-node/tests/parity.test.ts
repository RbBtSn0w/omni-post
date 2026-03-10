import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbManager } from '../src/db/database.js';
import { router as accountRouter } from '../src/routes/account.js';
import { cleanupTempDb, createTempDb } from './setup.js';

// Mock CookieService
const mockCheckCookie = vi.fn();
vi.mock('../src/services/cookie-service.js', () => ({
    getCookieService: () => ({
        checkCookie: mockCheckCookie,
    }),
}));

describe('Parity: Account Status Cooldown (SC-003)', () => {
    let app: express.Express;
    let testDb: any;

    beforeEach(async () => {
        const { db } = createTempDb();
        testDb = db;
        
        // Mock dbManager to return our test DB
        vi.spyOn(dbManager, 'getDb').mockReturnValue(testDb);

        app = express();
        app.use(express.json());
        app.use('/', accountRouter);

        // Seed an account
        // Last validated: 2026-03-10 00:00:00 UTC
        testDb.prepare(`
            INSERT INTO user_info (id, type, filePath, userName, status, last_validated_at)
            VALUES (1, 3, 'test.json', 'test_user', 1, ?)
        `).run('2026-03-10 00:00:00');
        
        mockCheckCookie.mockClear();
    });

    it('should NOT trigger validation if within 3-hour cooldown', async () => {
        // Current time: 2026-03-10 01:00:00 UTC (1 hour after validation)
        // Ensure the date parsing in the route handles this correctly
        vi.setSystemTime(new Date('2026-03-10T01:00:00Z'));

        const response = await request(app).get('/getAccountStatus').query({ id: 1 });
        
        expect(response.status).toBe(200);
        expect(mockCheckCookie).not.toHaveBeenCalled();
    });

    it('should trigger validation if after 3-hour cooldown', async () => {
        // Current time: 2026-03-10 04:00:00 (4 hours after validation)
        vi.setSystemTime(new Date('2026-03-10T04:00:00Z'));
        mockCheckCookie.mockResolvedValue(true);

        const response = await request(app).get('/getAccountStatus').query({ id: 1 });
        
        expect(response.status).toBe(200);
        expect(mockCheckCookie).toHaveBeenCalledWith(3, 'test.json');
    });

    it('should trigger validation if force=true even within cooldown', async () => {
        vi.setSystemTime(new Date('2026-03-10T01:00:00Z'));
        mockCheckCookie.mockResolvedValue(true);

        const response = await request(app).get('/getAccountStatus').query({ id: 1, force: 'true' });
        
        expect(response.status).toBe(200);
        expect(mockCheckCookie).toHaveBeenCalled();
    });
});
