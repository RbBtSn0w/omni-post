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
import { logger } from '../core/logger.js';
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
    limits: { fileSize: Number(MAX_UPLOAD_SIZE) },
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
router.get('/getFiles', async (_req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const files = db.prepare('SELECT * FROM file_records ORDER BY upload_time DESC').all() as any[];
        
        // Append is_missing flag (Async check to avoid blocking)
        const mappedFiles = await Promise.all(files.map(async (file) => {
            let isMissing = true;
            if (file.file_path) {
                try {
                    const filePath = safeJoin(VIDEOS_DIR, file.file_path);
                    const stats = await fs.promises.stat(filePath).catch(() => null);
                    isMissing = !stats;
                } catch (e) {
                    logger.error(`检查文件存在性失败 [${file.file_path}]:`, e);
                }
            }
            return {
                ...file,
                is_missing: isMissing
            };
        }));

        sendSuccess(res, mappedFiles, '获取成功');
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

/**
 * POST /syncFiles
 * Scan the local VIDEOS_DIR for orphan files and add them to the file_records table.
 */
router.post('/syncFiles', async (_req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const existingRecords = db.prepare('SELECT file_path FROM file_records WHERE file_path IS NOT NULL').all() as any[];
        const existingPaths = new Set(existingRecords.map((r) => r.file_path));

        if (!fs.existsSync(VIDEOS_DIR)) {
            sendSuccess(res, { count: 0 }, '目录不存在，同步了 0 个新文件');
            return;
        }

        const filesInDir = await fs.promises.readdir(VIDEOS_DIR);
        const orphanFiles = filesInDir.filter(f => !existingPaths.has(f));
        
        let syncedCount = 0;
        if (orphanFiles.length > 0) {
            const insertStmt = db.prepare('INSERT INTO file_records (filename, filesize, file_path) VALUES (?, ?, ?)');
            
            // Process metadata in parallel but limited (to avoid EMFILE)
            const tasks = orphanFiles.map(async (file) => {
                const ext = path.extname(file).toLowerCase();
                const validExts = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
                
                if (validExts.includes(ext)) {
                    try {
                        const filePath = safeJoin(VIDEOS_DIR, file);
                        const stats = await fs.promises.stat(filePath);
                        const fileSizeMB = Number((stats.size / (1024 * 1024)).toFixed(2));
                        return { filename: file, filesize: fileSizeMB, file_path: file };
                    } catch (e) {
                        logger.error(`同步文件元数据失败 [${file}]:`, e);
                    }
                }
                return null;
            });

            const results = (await Promise.all(tasks)).filter(r => r !== null) as any[];

            if (results.length > 0) {
                const insertMany = db.transaction((items: any[]) => {
                    for (const item of items) {
                        insertStmt.run(item.filename, item.filesize, item.file_path);
                        syncedCount++;
                    }
                });
                insertMany(results);
            }
        }

        sendSuccess(res, { count: syncedCount }, `成功同步了 ${syncedCount} 个新文件`);
    } catch (error: any) {
        sendError(res, 500, `同步失败: ${error.message}`);
    }
});
