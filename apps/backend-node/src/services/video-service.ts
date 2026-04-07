import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { EventEmitter } from 'node:events';
import { logger } from '../core/logger.js';

const execFileAsync = promisify(execFile);

export class VideoService {
    private activeOptimizations: Set<string> = new Set();
    private eventEmitter = new EventEmitter();

    /**
     * 等待指定视频文件优化完成
     */
    public async waitForReadiness(filePath: string): Promise<void> {
        if (!this.activeOptimizations.has(filePath)) {
            return;
        }

        logger.info(`[VideoService] 文件正在优化中，等待就绪: ${filePath}`);
        return new Promise((resolve) => {
            const check = (finishedPath: string) => {
                if (finishedPath === filePath) {
                    this.eventEmitter.off('finished', check);
                    resolve();
                }
            };
            this.eventEmitter.on('finished', check);
        });
    }

    /**
     * 检查并修复视频轨道结构
     * 
     * 主要目标：
     * 1. 确保主视频流位于 index 0
     * 2. 移除可能干扰平台解析的 mjpeg 流（通常是封面图）
     * 3. 启用 moov atom faststart 相关元数据前置
     */
    public async autoFixVideo(filePath: string): Promise<boolean> {
        if (!fs.existsSync(filePath)) {
            logger.warn(`[VideoService] 文件不存在: ${filePath}`);
            return false;
        }

        const ext = path.extname(filePath).toLowerCase();
        const videoExts = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm'];
        if (!videoExts.includes(ext)) {
            return false;
        }

        try {
            this.activeOptimizations.add(filePath);
            logger.info(`[VideoService] 开始检测并优化视频: ${filePath}`);

            // 1. 获取视频流信息
            const { stdout: probeData } = await execFileAsync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', filePath]);
            const metadata = JSON.parse(probeData);
            const streams = metadata.streams || [];

            const videoStreams = streams.filter((s: Record<string, unknown>) => s.codec_type === 'video');

            if (videoStreams.length === 0) {
                logger.warn(`[VideoService] 无视频流，跳过优化: ${filePath}`);
                return false;
            }

            // 2. 检测是否存在 mjpeg 封面流占用了首位
            const needsFix = videoStreams.length > 1 && videoStreams[0].codec_name === 'mjpeg' && videoStreams[1].codec_name !== 'mjpeg';
            
            // 3. 始终启用 faststart 以优化 web 播放性能
            // 如果不需要重排流，仅执行 faststart
            const tempFile = `${filePath}.optimized${ext}`;

            let args: string[];
            if (needsFix) {
                logger.info(`[VideoService] 检测到 MJPEG 封面轨道在前台且有后置 H.264，执行流重映射同步优化。`);
                // 方案：将第 0:v:1 (通常是 H.264) 排到首位，删除 mjpeg 封面流(0:v:0)
                // 这种情况下，0:v:1 是真正的视频内容
                args = ['-i', filePath, '-map', '0:v:1', '-map', '0:a?', '-c', 'copy', '-movflags', '+faststart', '-y', tempFile];
            } else {
                // 默认仅执行 faststart 处理且确保元数据在前
                args = ['-i', filePath, '-c', 'copy', '-movflags', '+faststart', '-y', tempFile];
            }

            const { stderr } = await execFileAsync('ffmpeg', args);
            if (stderr && stderr.includes('Error')) {
                // 有些 stderr 输出非报错，需要检查文件生成情况
                if (!fs.existsSync(tempFile)) {
                   logger.error(`[VideoService] ffmpeg 优化失败: ${stderr}`);
                   return false;
                }
            }

            // 4. 用优化后的文件替换原文件
            if (fs.existsSync(tempFile)) {
                // 比较文件大小，防止极端异常下变空 (流拷贝通常不应该变太大或太小)
                const originalSize = fs.statSync(filePath).size;
                const optimizedSize = fs.statSync(tempFile).size;

                if (optimizedSize > originalSize * 0.1) { // 简单检查文件是否包含核心数据
                    const backupFile = `${filePath}.bak`;
                    try {
                        // 1. 将原文件重命名为备份文件 (filePath 现在不再指向原内容)
                        fs.renameSync(filePath, backupFile);
                        // 2. 将优化后的文件重命名为原文件名 (filePath 现在指向优化后的内容)
                        fs.renameSync(tempFile, filePath);
                        // 3. 删除备份文件
                        fs.unlinkSync(backupFile);
                        logger.info(`[VideoService] 视频优化成功: ${filePath} (${(optimizedSize / 1024 / 1024).toFixed(2)} MB)`);
                        return true;
                    } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : String(err);
                        logger.error(`[VideoService] 原子替换失败: ${msg}`);
                        // 尝试恢复原状
                        if (fs.existsSync(backupFile) && !fs.existsSync(filePath)) {
                            fs.renameSync(backupFile, filePath);
                        }
                        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                        return false;
                    }
                } else {
                    logger.error(`[VideoService] 优化后文件比例异常 (疑似流丢失)，放弃替换。Original: ${originalSize}, Optimized: ${optimizedSize}`);
                    fs.unlinkSync(tempFile);
                    return false;
                }
            }

            return false;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`[VideoService] 视频处理异常: ${msg}`);
            return false;
        } finally {
            this.activeOptimizations.delete(filePath);
            this.eventEmitter.emit('finished', filePath);
        }
    }
}

export const videoService = new VideoService();
