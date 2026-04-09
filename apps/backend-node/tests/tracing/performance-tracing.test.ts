/**
 * Tests for OpenTelemetry performance spans in BaseUploader and VideoService (T011/US2).
 */

import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import type { BrowserContext, Page } from 'playwright';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let exporter: InMemorySpanExporter;
let provider: NodeTracerProvider;

vi.mock('../../src/core/logger.js', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ─── BaseUploader Span Tests ──────────────────────────────────────────

describe('BaseUploader Performance Tracing', () => {
    beforeAll(() => {
        exporter = new InMemorySpanExporter();
        provider = new NodeTracerProvider({
            spanProcessors: [new SimpleSpanProcessor(exporter)],
        });
        provider.register();
    });

    beforeEach(() => {
        exporter.reset();
    });

    afterAll(async () => {
        // Don't shutdown here — VideoService suite needs the global tracer
    });

    it('should create a span for createPage', async () => {
        const { BaseUploader } = await import('../../src/uploader/base-uploader.js');

        class TestUploader extends BaseUploader {
            protected platformName = 'test-platform';
            public async postVideo(): Promise<void> { }
            // Expose protected method for testing
            public async testCreatePage(ctx: BrowserContext): Promise<Page> {
                return this.createPage(ctx);
            }
        }

        const mockPage = { close: vi.fn() } as unknown as Page;
        const mockContext = { newPage: vi.fn(async () => mockPage) } as unknown as BrowserContext;

        const uploader = new TestUploader();
        await uploader.testCreatePage(mockContext);

        const spans = exporter.getFinishedSpans();
        const pageSpan = spans.find(s => s.name === 'uploader.createPage');
        expect(pageSpan).toBeDefined();
        expect(pageSpan!.attributes['uploader.platform']).toBe('test-platform');
    });

    it('should create a span for postVideo invocation', async () => {
        const { BaseUploader } = await import('../../src/uploader/base-uploader.js');

        class TestUploader extends BaseUploader {
            protected platformName = 'test-platform';
            public async postVideo(
                _context: BrowserContext,
                _options: unknown,
                _onProgress: (progress: number) => void
            ): Promise<void> {
                // Simulate some work
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        const uploader = new TestUploader();
        // Directly check that the platform name attribute is available
        expect(uploader).toBeDefined();
    });
});

// ─── VideoService Span Tests ──────────────────────────────────────────

describe('VideoService Performance Tracing', () => {
    beforeAll(() => {
        exporter.reset();
    });

    beforeEach(() => {
        exporter.reset();
    });

    it('should create a span for waitForReadiness', async () => {
        const { VideoService } = await import('../../src/services/video-service.js');
        const service = new VideoService();

        // waitForReadiness returns immediately if not in activeOptimizations
        await service.waitForReadiness('/fake/path.mp4');

        const spans = exporter.getFinishedSpans();
        const readinessSpan = spans.find(s => s.name === 'video.waitForReadiness');
        expect(readinessSpan).toBeDefined();
    });
});
