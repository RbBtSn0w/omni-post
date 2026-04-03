/**
 * Logging configuration for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/core/logger.py
 *
 * Uses Winston to replicate loguru's per-platform file logging.
 */

import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { LOGS_DIR } from './config.js';

// Ensure logs directory exists
fs.mkdirSync(LOGS_DIR, { recursive: true });

// Custom format matching Python loguru style
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} | ${level.toUpperCase()}: ${message}`;
});

// Console transport with colors
const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
});

// Main logger (console only)
export const logger = winston.createLogger({
    level: 'info',
    transports: [consoleTransport],
});

/**
 * Create a business logger for a specific platform module.
 * Each logger writes to its own file and also outputs to console.
 */
function createBusinessLogger(logName: string, fileName: string): winston.Logger {
    const filePath = path.join(LOGS_DIR, fileName);
    const logDir = path.dirname(filePath);
    fs.mkdirSync(logDir, { recursive: true });

    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            logFormat
        ),
        transports: [
            consoleTransport,
            new winston.transports.File({
                filename: filePath,
                maxsize: 10 * 1024 * 1024, // 10 MB rotation
                maxFiles: 10,
            }),
        ],
        defaultMeta: { business_name: logName },
    });
}

// Create business loggers (matching Python's per-platform loggers)
export const douyinLogger = createBusinessLogger('douyin', 'douyin.log');
export const wxChannelsLogger = createBusinessLogger('wx_channels', 'wx_channels.log');
export const xhsLogger = createBusinessLogger('xhs', 'xhs.log');
export const bilibiliLogger = createBusinessLogger('bilibili', 'bilibili.log');
export const kuaishouLogger = createBusinessLogger('kuaishou', 'kuaishou.log');
export const xiaohongshuLogger = createBusinessLogger('xiaohongshu', 'xiaohongshu.log');
