/**
 * Cookie route for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/routes/cookie.py
 */

import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import { COOKIES_DIR } from '../core/config.js';
import { dbManager } from '../db/database.js';
import { safeJoin } from '../utils/path.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const router = Router();

// Configure multer for cookie file uploads
const cookieStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        fs.mkdirSync(COOKIES_DIR, { recursive: true });
        cb(null, COOKIES_DIR);
    },
    filename: (req, file, cb) => {
        // Sanitize components to prevent path injection (SC-001)
        const accountId = String(req.body.id || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
        const platform = String(req.body.platform || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
        cb(null, `${platform}_${accountId}_cookies.json`);
    },
});

const uploadCookie = multer({ storage: cookieStorage });

/**
 * POST /uploadCookie
 * Upload a cookie file for an account.
 */
router.post('/uploadCookie', uploadCookie.single('file'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            sendError(res, 400, '没有选择文件');
            return;
        }

        const accountId = req.body.id;
        const platform = req.body.platform;

        if (!accountId || !platform) {
            sendError(res, 400, '缺少账号ID或平台类型');
            return;
        }

        // Update the account's filePath in the database
        const db = dbManager.getDb();
        db.prepare('UPDATE user_info SET filePath = ?, status = 1, last_validated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(req.file.filename, Number(accountId));

        sendSuccess(res, {
            filePath: req.file.filename,
        }, '上传成功');
    } catch (error: any) {
        sendError(res, 500, `上传Cookie失败: ${error.message}`);
    }
});

/**
 * GET /downloadCookie
 * Download a cookie file.
 */
router.get('/downloadCookie', (req: Request, res: Response) => {
    try {
        const filePath = req.query.filePath as string;
        if (!filePath) {
            sendError(res, 400, '缺少文件路径参数');
            return;
        }

        let fullPath: string;
        try {
            fullPath = safeJoin(COOKIES_DIR, filePath);
        } catch (error: any) {
            sendError(res, 400, error.message);
            return;
        }

        if (!fs.existsSync(fullPath)) {
            sendError(res, 404, 'Cookie文件不存在');
            return;
        }

        res.download(fullPath);
    } catch (error: any) {
        sendError(res, 500, `下载Cookie失败: ${error.message}`);
    }
});
