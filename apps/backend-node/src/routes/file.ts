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
import { videoService } from '../services/video-service.js';

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
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            sendError(res, 400, '没有选择文件');
            return;
        }

        // 先立即返回上传成功响应，不阻塞前端
        const filePath = safeJoin(VIDEOS_DIR, req.file.filename);

        sendSuccess(res, {
            filename: req.file.originalname,
            file_path: req.file.filename,
            filesize: (req.file.size / (1024 * 1024)).toFixed(2),
        }, '上传成功');

        // 异步后台优化视频轨道（不阻塞响应）
        videoService.autoFixVideo(filePath).catch((err: unknown) => {
            logger.error(`[FileRoute] 视频后台优化失败: ${err instanceof Error ? err.message : String(err)}`);
        });
    } catch (error: unknown) {
        sendError(res, 500, `上传失败: ${error instanceof Error ? error.message : String(error)}`);
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
    } catch (error: unknown) {
        sendError(res, 500, `获取文件失败: ${error instanceof Error ? error.message : String(error)}`);
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
    } catch (error: unknown) {
        sendError(res, 500, `下载失败: ${error instanceof Error ? error.message : String(error)}`);
    }
});

/**
 * POST /uploadSave
 * Upload and save file record to database.
 */
router.post('/uploadSave', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            sendError(res, 400, '没有选择文件');
            return;
        }

        const filePath = safeJoin(VIDEOS_DIR, req.file.filename);

        const db = dbManager.getDb();
        const originalName = (req.body.filename as string) || req.file.originalname;
        const fileSize = Number((req.file.size / (1024 * 1024)).toFixed(2));
        const filename = req.file.filename;

        db.prepare(
            'INSERT INTO file_records (filename, filesize, file_path) VALUES (?, ?, ?)'
        ).run(originalName, fileSize, filename);

        sendSuccess(res, {
            filename: originalName,
            file_path: filename,
            filesize: fileSize,
        }, '上传成功');

        // 异步后台优化视频轨道（不阻塞响应）
        videoService.autoFixVideo(filePath).then((success) => {
            if (success) {
                try {
                    const stats = fs.statSync(filePath);
                    const finalSize = Number((stats.size / (1024 * 1024)).toFixed(2));
                    const db = dbManager.getDb();
                    db.prepare('UPDATE file_records SET filesize = ? WHERE file_path = ?').run(finalSize, filename);
                    logger.info(`[FileRoute] 视频优化后已更新数据库大小: ${filename} -> ${finalSize} MB`);
                } catch (e) {
                    logger.error(`[FileRoute] 更新优化后大小失败: ${e instanceof Error ? e.message : String(e)}`);
                }
            }
        }).catch((err: unknown) => {
            logger.error(`[FileRoute] 视频后台优化失败: ${err instanceof Error ? err.message : String(err)}`);
        });
    } catch (error: unknown) {
        sendError(res, 500, `上传失败: ${error instanceof Error ? error.message : String(error)}`);
    }
});

/**
 * GET /getFiles
 * Get all file records from the database.
 */
router.get('/getFiles', async (_req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const files = db.prepare('SELECT * FROM file_records ORDER BY upload_time DESC').all() as { id: number, filename: string, filesize: number, file_path: string, upload_time: string }[];
        
        // Append is_missing flag sequentially to avoid EMFILE
        const mappedFiles = [];
        for (const file of files) {
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
            mappedFiles.push({
                ...file,
                is_missing: isMissing
            });
        }

        sendSuccess(res, mappedFiles, '获取成功');
    } catch (error: unknown) {
        sendError(res, 500, `获取文件列表失败: ${error instanceof Error ? error.message : String(error)}`);
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
        const fileRecord = db.prepare('SELECT * FROM file_records WHERE id = ?').get(Number(id)) as { id: number, file_path: string } | undefined;

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
            } catch (error: unknown) {
                // Ignore traversal or invalid path errors during deletion but log them
            }
        }

        // Delete the record
        db.prepare('DELETE FROM file_records WHERE id = ?').run(Number(id));

        sendSuccess(res, null, '删除成功');
    } catch (error: unknown) {
        sendError(res, 500, `删除失败: ${error instanceof Error ? error.message : String(error)}`);
    }
});

/**
 * POST /syncFiles
 * Scan the local VIDEOS_DIR for orphan files and add them to the file_records table.
 */
router.post('/syncFiles', async (_req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const existingRecords = db.prepare('SELECT file_path FROM file_records WHERE file_path IS NOT NULL').all() as { file_path: string }[];
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
            
            // Process metadata sequentially to avoid EMFILE on large directories
            const results = [];
            for (const file of orphanFiles) {
                const ext = path.extname(file).toLowerCase();
                const validExts = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
                
                if (validExts.includes(ext)) {
                    try {
                        const filePath = safeJoin(VIDEOS_DIR, file);
                        const stats = await fs.promises.stat(filePath);
                        const fileSizeMB = Number((stats.size / (1024 * 1024)).toFixed(2));
                        results.push({ filename: file, filesize: fileSizeMB, file_path: file });
                    } catch (e) {
                        logger.error(`同步文件元数据失败 [${file}]:`, e);
                    }
                }
            }

            if (results.length > 0) {
                const insertMany = db.transaction((items: { filename: string, filesize: number, file_path: string }[]) => {
                    for (const item of items) {
                        insertStmt.run(item.filename, item.filesize, item.file_path);
                        syncedCount++;
                    }
                });
                insertMany(results);
            }
        }

        sendSuccess(res, { count: syncedCount }, `成功同步了 ${syncedCount} 个新文件`);
    } catch (error: unknown) {
        sendError(res, 500, `同步失败: ${error instanceof Error ? error.message : String(error)}`);
    }
});
