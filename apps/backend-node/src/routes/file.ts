/**
 * File route for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/routes/file.py
 */

import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MAX_UPLOAD_SIZE, VIDEOS_DIR } from '../core/config.js';
import { dbManager } from '../db/database.js';
import { safeJoin } from '../utils/path.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        fs.mkdirSync(VIDEOS_DIR, { recursive: true });
        cb(null, VIDEOS_DIR);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_UPLOAD_SIZE },
});

/**
 * POST /upload
 * Upload a file to the videos directory.
 */
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            sendError(res, 400, '没有选择文件');
            return;
        }

        sendSuccess(res, {
            filename: req.file.originalname,
            file_path: req.file.filename,
            filesize: (req.file.size / (1024 * 1024)).toFixed(2),
        }, '上传成功');
    } catch (error: any) {
        sendError(res, 500, `上传失败: ${error.message}`);
    }
});

/**
 * GET /getFile
 * Serve a file from the videos directory.
 */
router.get('/getFile', (req: Request, res: Response) => {
    try {
        const filename = req.query.filename as string;
        if (!filename) {
            sendError(res, 400, '缺少文件名参数');
            return;
        }

        let filePath: string;
        try {
            filePath = safeJoin(VIDEOS_DIR, filename);
        } catch (error: any) {
            sendError(res, 400, error.message);
            return;
        }

        if (!fs.existsSync(filePath)) {
            sendError(res, 404, '文件不存在');
            return;
        }

        res.sendFile(filePath);
    } catch (error: any) {
        sendError(res, 500, `获取文件失败: ${error.message}`);
    }
});

/**
 * GET /download/:filename
 * Download a file from the videos directory.
 */
router.get('/download/:filename', (req: Request, res: Response) => {
    try {
        const filename = req.params.filename as string;
        let filePath: string;
        try {
            filePath = safeJoin(VIDEOS_DIR, filename);
        } catch (error: any) {
            sendError(res, 400, error.message);
            return;
        }

        if (!fs.existsSync(filePath)) {
            sendError(res, 404, '文件不存在');
            return;
        }

        res.download(filePath);
    } catch (error: any) {
        sendError(res, 500, `下载失败: ${error.message}`);
    }
});

/**
 * POST /uploadSave
 * Upload and save file record to database.
 */
router.post('/uploadSave', upload.single('file'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            sendError(res, 400, '没有选择文件');
            return;
        }

        const db = dbManager.getDb();
        const originalName = (req.body.filename as string) || req.file.originalname;
        const fileSize = Number((req.file.size / (1024 * 1024)).toFixed(2));

        db.prepare(
            'INSERT INTO file_records (filename, filesize, file_path) VALUES (?, ?, ?)'
        ).run(originalName, fileSize, req.file.filename);

        sendSuccess(res, {
            filename: originalName,
            file_path: req.file.filename,
            filesize: fileSize,
        }, '上传成功');
    } catch (error: any) {
        sendError(res, 500, `上传失败: ${error.message}`);
    }
});

/**
 * GET /getFiles
 * Get all file records from the database.
 */
router.get('/getFiles', (_req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const files = db.prepare('SELECT * FROM file_records ORDER BY upload_time DESC').all();
        sendSuccess(res, files, '获取成功');
    } catch (error: any) {
        sendError(res, 500, `获取文件列表失败: ${error.message}`);
    }
});

/**
 * GET /deleteFile
 * Delete a file record and the actual file.
 */
router.get('/deleteFile', (req: Request, res: Response) => {
    try {
        const id = req.query.id as string;
        if (!id) {
            sendError(res, 400, '缺少文件ID');
            return;
        }

        const db = dbManager.getDb();
        const fileRecord = db.prepare('SELECT * FROM file_records WHERE id = ?').get(Number(id)) as any;

        if (!fileRecord) {
            sendError(res, 404, '文件记录不存在');
            return;
        }

        // Delete the actual file
        if (fileRecord.file_path) {
            try {
                const filePath = safeJoin(VIDEOS_DIR, fileRecord.file_path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error: any) {
                // Ignore traversal or invalid path errors during deletion but log them
            }
        }

        // Delete the record
        db.prepare('DELETE FROM file_records WHERE id = ?').run(Number(id));

        sendSuccess(res, null, '删除成功');
    } catch (error: any) {
        sendError(res, 500, `删除失败: ${error.message}`);
    }
});
