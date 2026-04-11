import { BrowserContext, Page } from 'playwright';
import { SpanStatusCode } from '@opentelemetry/api';
import { logger } from '../core/logger.js';
import { getTracer } from '../core/telemetry.js';
import { UploadOptions } from '../db/models.js';

/**
 * PlatformUploader (平台上传器基类接口)
 *
 * 职责:
 * 1. 规范各平台 (抖音, 快手等) 的发布接口。
 * 2. 提供统一的日志和上下文管理辅助。
 * 3. 确保 US3 实施的一致性。
 */
export abstract class BaseUploader {
    protected abstract platformName: string;

    /**
     * 执行视频发布的核心流程
     * @param context Playwright 浏览器上下文
     * @param options 发布参数 (视频路径, 标题, 标签等)
     * @param onProgress 进度回调 (0-100)
     */
    public abstract postVideo(
        context: BrowserContext,
        options: UploadOptions,
        onProgress: (progress: number) => void
    ): Promise<void>;

    /**
     * 执行文章发布的核心流程 (可选实现)
     */
    public postArticle?(
        context: BrowserContext,
        options: UploadOptions,
        onProgress: (progress: number) => void
    ): Promise<void>;

    /**
     * 子类通用的工具方法: 创建并配置新页面
     */
    protected async createPage(context: BrowserContext): Promise<Page> {
        const tracer = getTracer();
        return tracer.startActiveSpan('uploader.createPage', async (span) => {
            span.setAttribute('uploader.platform', this.platformName);
            try {
                const page = await context.newPage();
                logger.info(`[${this.platformName}] New page created.`);
                return page;
            } catch (error: unknown) {
                const exception = error instanceof Error ? error : new Error(String(error));
                span.recordException(exception);
                span.setStatus({ code: SpanStatusCode.ERROR, message: exception.message });
                throw exception;
            } finally {
                span.end();
            }
        });
    }

    /**
     * 记录平台特定的日志
     */
    protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const fullMessage = `[Uploader:${this.platformName}] ${message}`;
        if (level === 'error') logger.error(fullMessage);
        else if (level === 'warn') logger.warn(fullMessage);
        else logger.info(fullMessage);
    }
}
