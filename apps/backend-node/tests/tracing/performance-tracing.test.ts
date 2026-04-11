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
    await provider.shutdown();
});

// ─── BaseUploader Span Tests ──────────────────────────────────────────

describe('BaseUploader Performance Tracing', () => {
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

});

// ─── VideoService Span Tests ──────────────────────────────────────────

describe('VideoService Performance Tracing', () => {
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
