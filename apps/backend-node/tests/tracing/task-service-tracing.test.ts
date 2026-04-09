/**
 * Tests for OpenTelemetry tracing in task-service.ts (T006/US1).
 */

import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupTempDb, createTempDb } from '../setup.js';

let exporter: InMemorySpanExporter;
let provider: NodeTracerProvider;
let db: Database.Database;
let dbPath: string;

vi.mock('../../src/db/database.js', () => ({
    dbManager: {
        getDb: () => db,
        getDbPath: () => dbPath,
        getDataDir: () => '/tmp',
    },
}));

describe('Task Service Tracing', () => {
    beforeEach(() => {
        exporter = new InMemorySpanExporter();
        provider = new NodeTracerProvider({
            spanProcessors: [new SimpleSpanProcessor(exporter)],
        });
        provider.register();
        ({ db, dbPath } = createTempDb());
    });

    afterEach(() => {
        exporter.reset();
        provider.shutdown();
        cleanupTempDb(dbPath, db);
    });

    it('should create spans for task state updates', async () => {
        const { taskService } = await import('../../src/services/task-service.js');
        const taskId = taskService.createTask({ title: 'Traced Task', type: 1 });
        taskService.updateTaskStatus(taskId, 'uploading', 50);

        const spans = exporter.getFinishedSpans();
        const createSpan = spans.find(s => s.name === 'task.create');
        const updateSpan = spans.find(s => s.name === 'task.updateStatus');

        expect(createSpan).toBeDefined();
        expect(updateSpan).toBeDefined();
        expect(updateSpan!.attributes['task.id']).toBe(taskId);
        expect(updateSpan!.attributes['task.status']).toBe('uploading');
    });
});
