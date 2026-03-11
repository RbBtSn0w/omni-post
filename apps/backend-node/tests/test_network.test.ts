/**
 * Async retry utility test.
 * Mirrors: apps/backend/tests/test_network.py
 */

import { describe, expect, it } from 'vitest';
import { asyncRetry, withRetry } from '../src/utils/network.js';

describe('asyncRetry', () => {
    it('should succeed on first attempt', async () => {
        let callCount = 0;
        const result = await asyncRetry(async () => {
            callCount++;
            return 'success';
        }, { timeout: 5000, maxRetries: 3 });

        expect(result).toBe('success');
        expect(callCount).toBe(1);
    });

    it('should succeed after failures', async () => {
        let callCount = 0;
        const result = await asyncRetry(async () => {
            callCount++;
            if (callCount < 3) throw new Error('Simulated failure');
            return 'success';
        }, { timeout: 10000, maxRetries: 5 });

        expect(result).toBe('success');
        expect(callCount).toBe(3);
    });

    it('should throw when max retries exceeded', async () => {
        let callCount = 0;
        await expect(asyncRetry(async () => {
            callCount++;
            throw new Error('Always fails');
        }, { timeout: 30000, maxRetries: 3 })).rejects.toThrow('Failed after 3 retries');

        expect(callCount).toBe(3);
    });

    it('should handle functions with arguments via withRetry', async () => {
        let callCount = 0;
        const fn = withRetry(async (a: number, b: number, c?: number) => {
            callCount++;
            if (callCount < 2) throw new Error('First attempt fails');
            return `${a}+${b}+${c}`;
        }, { timeout: 5000, maxRetries: 3 });

        const result = await fn(1, 2, 3);
        expect(result).toBe('1+2+3');
        expect(callCount).toBe(2);
    });

    it('should handle different exception types', async () => {
        let callCount = 0;
        const result = await asyncRetry(async () => {
            callCount++;
            if (callCount === 1) throw new TypeError('TypeError');
            if (callCount === 2) throw new RangeError('RangeError');
            return 'success';
        }, { timeout: 10000, maxRetries: 5 });

        expect(result).toBe('success');
        expect(callCount).toBe(3);
    });

    it('should preserve return value types', async () => {
        const dictResult = await asyncRetry(async () => ({ key: 'value' }), { timeout: 5000, maxRetries: 3 });
        expect(dictResult).toEqual({ key: 'value' });

        const listResult = await asyncRetry(async () => [1, 2, 3], { timeout: 5000, maxRetries: 3 });
        expect(listResult).toEqual([1, 2, 3]);

        const nullResult = await asyncRetry(async () => null, { timeout: 5000, maxRetries: 3 });
        expect(nullResult).toBeNull();
    });
});
