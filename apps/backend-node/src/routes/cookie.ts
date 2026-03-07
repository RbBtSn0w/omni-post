/**
 * Cookie route for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/routes/cookie.py
 */

import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { COOKIES_DIR } from '../core/config.js';
import { dbManager } from '../db/database.js';

export const router = Router();

// Configure multer for cookie file uploads
const cookieStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        fs.mkdirSync(COOKIES_DIR, { recursive: true });
        cb(null, COOKIES_DIR);
    },
    filename: (req, file, cb) => {
        // Use account ID and platform type as filename prefix
        const accountId = req.body.id || 'unknown';
        const platform = req.body.platform || 'unknown';
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
            res.status(400).json({ code: 400, msg: '没有选择文件' });
            return;
        }

        const accountId = req.body.id;
        const platform = req.body.platform;

        if (!accountId || !platform) {
            res.status(400).json({ code: 400, msg: '缺少账号ID或平台类型' });
            return;
        }

        // Update the account's filePath in the database
        const db = dbManager.getDb();
        db.prepare('UPDATE user_info SET filePath = ?, status = 1, last_validated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(req.file.filename, Number(accountId));

        res.json({
            code: 200,
            msg: '上传成功',
            data: {
                filePath: req.file.filename,
            },
        });
    } catch (error: any) {
        res.status(500).json({ code: 500, msg: `上传Cookie失败: ${error.message}` });
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
            res.status(400).json({ code: 400, msg: '缺少文件路径参数' });
            return;
        }

        const fullPath = path.join(COOKIES_DIR, filePath);
        if (!fs.existsSync(fullPath)) {
            res.status(404).json({ code: 404, msg: 'Cookie文件不存在' });
            return;
        }

        res.download(fullPath);
    } catch (error: any) {
        res.status(500).json({ code: 500, msg: `下载Cookie失败: ${error.message}` });
    }
});
