import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { router as cookieRouter } from '../src/routes/cookie.js';
import { router as fileRouter } from '../src/routes/file.js';

describe('Security: Path Traversal Protection (SC-001)', () => {
    const app = express();
    app.use(express.json());
    app.use('/', cookieRouter);
    app.use('/', fileRouter);

    describe('GET /downloadCookie', () => {
        it('should reject path traversal attempts with 400', async () => {
            const response = await request(app)
                .get('/downloadCookie')
                .query({ filePath: '../../package.json' });
            
            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('非法的文件路径');
        });

        it('should reject absolute paths outside root with 400', async () => {
            const response = await request(app)
                .get('/downloadCookie')
                .query({ filePath: '/etc/passwd' });
            
            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('非法的文件路径');
        });
    });

    describe('GET /getFile', () => {
        it('should reject path traversal attempts with 400', async () => {
            const response = await request(app)
                .get('/getFile')
                .query({ filename: '../src/app.ts' });
            
            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('非法的文件路径');
        });
    });

    describe('GET /download/:filename', () => {
        it('should reject path traversal attempts with 400', async () => {
            // Use %2e%2e%2f to try and bypass simple filters
            const response = await request(app)
                .get('/download/%2e%2e%2f%2e%2e%2fpackage.json');
            
            // If it doesn't match the route, Express returns 404, which is also safe.
            // But if it DOES match, safeJoin should return 400.
            expect([400, 404]).toContain(response.status);
            if (response.status === 400) {
                expect(response.body.msg).toBe('非法的文件路径');
            }
        });
    });
});
