import { beforeEach, describe, expect, it } from 'vitest';
import { lockManager } from '../src/services/lock-manager.js';

describe('AccountLockManager', () => {
    beforeEach(() => {
        lockManager.clearAll();
    });

    it('should lock an account successfully', () => {
        const path = '/data/cookies/test.json';
        expect(lockManager.lock(path)).toBe(true);
        expect(lockManager.isLocked(path)).toBe(true);
    });

    it('should fail to lock an already locked account', () => {
        const path = '/data/cookies/test.json';
        lockManager.lock(path);
        expect(lockManager.lock(path)).toBe(false);
    });

    it('should unlock an account successfully', () => {
        const path = '/data/cookies/test.json';
        lockManager.lock(path);
        lockManager.unlock(path);
        expect(lockManager.isLocked(path)).toBe(false);
        expect(lockManager.lock(path)).toBe(true);
    });

    it('should clear all locks', () => {
        lockManager.lock('a');
        lockManager.lock('b');
        lockManager.clearAll();
        expect(lockManager.isLocked('a')).toBe(false);
        expect(lockManager.isLocked('b')).toBe(false);
    });
});
