/**
 * Async retry utility.
 * Mirrors: apps/backend/src/utils/network.py
 */

import { logger } from '../core/logger.js';

/**
 * Retry an async function with timeout and max retries.
 *
 * @param fn - The async function to retry
 * @param options - Retry options
 * @returns The result of the function
 */
export async function asyncRetry<T>(
    fn: () => Promise<T>,
    options: { timeout?: number; maxRetries?: number } = {}
): Promise<T> {
    const { timeout = 60, maxRetries } = options;
    const startTime = Date.now();
    let attempts = 0;

    while (true) {
        try {
            return await fn();
        } catch (error) {
            attempts++;

            if (maxRetries !== undefined && attempts >= maxRetries) {
                logger.error(`Reached maximum retries of ${maxRetries}.`);
                throw new Error(`Failed after ${maxRetries} retries.`);
            }

            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > timeout) {
                logger.error(`Function timeout after ${timeout} seconds.`);
                throw new Error(`Function execution exceeded ${timeout} seconds timeout.`);
            }

            logger.warn(`Attempt ${attempts} failed: ${error}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

/**
 * Creates a retry decorator (higher-order function).
 * Usage: const retried = withRetry(myAsyncFn, { timeout: 60 });
 */
export function withRetry<TArgs extends any[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    options: { timeout?: number; maxRetries?: number } = {}
): (...args: TArgs) => Promise<TResult> {
    return (...args: TArgs) => asyncRetry(() => fn(...args), options);
}
