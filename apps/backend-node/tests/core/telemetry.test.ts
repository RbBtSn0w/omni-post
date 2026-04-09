import { afterEach, describe, expect, it } from 'vitest';

describe('Telemetry Module', () => {
    afterEach(async () => {
        // Clean up SDK after each test to avoid state leaks
        const mod = await import('../../src/core/telemetry.js');
        await mod.shutdownTelemetry();
    });

    it('should export initTelemetry and shutdownTelemetry functions', async () => {
        const mod = await import('../../src/core/telemetry.js');
        expect(typeof mod.initTelemetry).toBe('function');
        expect(typeof mod.shutdownTelemetry).toBe('function');
    });

    it('should initialize without throwing', async () => {
        const mod = await import('../../src/core/telemetry.js');
        expect(() => mod.initTelemetry()).not.toThrow();
    });

    it('should provide access to a tracer', async () => {
        const mod = await import('../../src/core/telemetry.js');
        mod.initTelemetry();
        expect(typeof mod.getTracer).toBe('function');
        const tracer = mod.getTracer();
        expect(tracer).toBeDefined();
        expect(typeof tracer.startSpan).toBe('function');
    });

    it('should shutdown gracefully', async () => {
        const mod = await import('../../src/core/telemetry.js');
        mod.initTelemetry();
        await expect(mod.shutdownTelemetry()).resolves.not.toThrow();
    });
});
