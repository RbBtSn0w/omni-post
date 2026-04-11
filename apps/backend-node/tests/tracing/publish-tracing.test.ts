/**
 * Tests for OpenTelemetry trace span instrumentation in the publish workflow.
 * Verifies root trace spans are generated upon publishing requests (T006/US1).
 */

import { SpanStatusCode } from '@opentelemetry/api';
import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let exporter: InMemorySpanExporter;
let provider: NodeTracerProvider;

// Controllable mock: set to true before a test to make postVideoDouyin throw
let shouldThrow = false;

vi.mock('../../src/db/database.js', () => ({
    dbManager: {
        getDb: () => ({ prepare: () => ({ get: () => ({ userName: 'test' }), all: () => [] }) }),
    },
}));
vi.mock('../../src/services/task-service.js', () => ({
    taskService: {
        updateTaskStatus: vi.fn(),
        getTask: vi.fn(() => null),
    },
}));
vi.mock('../../src/services/lock-manager.js', () => ({
    lockManager: { lock: () => true, unlock: vi.fn() },
}));
vi.mock('../../src/services/publish-service.js', () => ({
    postVideoDouyin: vi.fn(async () => {
        if (shouldThrow) throw new Error('Upload failed');
    }),
    postVideoBilibili: vi.fn(async () => { }),
    postVideoXhs: vi.fn(async () => { }),
    postVideoWxChannels: vi.fn(async () => { }),
    postVideoKs: vi.fn(async () => { }),
    postArticleZhihu: vi.fn(async () => { }),
    postArticleJuejin: vi.fn(async () => { }),
    postOpenCLI: vi.fn(async () => { }),
}));
vi.mock('../../src/services/video-service.js', () => ({
    videoService: { waitForReadiness: vi.fn(async () => { }) },
}));
vi.mock('fs', async () => {
    const actual = await vi.importActual<typeof import('fs')>('fs');
    return {
        ...actual,
        default: { ...actual, existsSync: () => true },
        existsSync: () => true,
    };
});

const { runPublishTask } = await import('../../src/services/publish-executor.js');

// ─── Publish Executor Span Tests ──────────────────────────────────────

describe('Publish Executor Tracing', () => {
    beforeAll(() => {
        exporter = new InMemorySpanExporter();
        provider = new NodeTracerProvider({
            spanProcessors: [new SimpleSpanProcessor(exporter)],
        });
        provider.register();
    });

    beforeEach(() => {
        shouldThrow = false;
        exporter.reset();
    });

    afterAll(async () => {
        await provider.shutdown();
    });

    it('should create a root span for runPublishTask', async () => {
        await runPublishTask('test-task-1', {
            type: 3, // DOUYIN
            title: 'Test Video',
            fileList: ['test.mp4'],
            accountList: ['acc.json'],
        });

        const spans = exporter.getFinishedSpans();
        const rootSpan = spans.find(s => s.name === 'publish.task');
        expect(rootSpan).toBeDefined();
        expect(rootSpan!.attributes['task.id']).toBe('test-task-1');
        expect(rootSpan!.attributes['task.platform']).toBeDefined();
    });

    it('should record exception on task failure', async () => {
        shouldThrow = true;

        await runPublishTask('test-task-fail', {
            type: 3,
            title: 'Failing Video',
            fileList: ['test.mp4'],
            accountList: ['acc.json'],
        });

        await provider.forceFlush();
        const spans = exporter.getFinishedSpans();
        const rootSpan = spans.find(s => s.name === 'publish.task');
        expect(rootSpan).toBeDefined();
        expect(rootSpan!.status.code).toBe(SpanStatusCode.ERROR);
        expect(rootSpan!.events.some(e => e.name === 'exception')).toBe(true);
    });
});
