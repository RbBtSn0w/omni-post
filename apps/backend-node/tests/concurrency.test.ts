import { describe, expect, it, vi } from 'vitest';

// Use doMock to handle potential side effects in core/config
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn(),
    },
}));

// Mock taskService to avoid DB dependencies
vi.mock('../src/services/task-service.js', () => ({
    taskService: {
        updateTaskStatus: vi.fn(),
    },
}));

// Mock platform services to avoid browser dependencies
vi.mock('../src/services/publish-service.js', () => ({
    postVideoDouyin: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10))),
    postVideoBilibili: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10))),
    postVideoKs: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10))),
    postVideoWxChannels: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10))),
    postVideoXhs: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10))),
}));

// Import after mocks
import { lockManager } from '../src/services/lock-manager.js';
import { runPublishTask } from '../src/services/publish-executor.js';
import { taskService } from '../src/services/task-service.js';

describe('Concurrency: Account Locking (SC-003)', () => {
    it('should allow a single task to acquire a lock and release it after completion', async () => {
        const taskId = 'task-1';
        const publishData = {
            type: 3, // Douyin
            accountList: ['account-1.json'],
            fileList: ['video-1.mp4'],
        };

        expect(lockManager.isLocked('account-1.json')).toBe(false);
        
        await runPublishTask(taskId, publishData);
        
        expect(lockManager.isLocked('account-1.json')).toBe(false);
        expect(taskService.updateTaskStatus).toHaveBeenCalledWith(taskId, 'completed', 100, null);
    });

    it('should reject a second task if the account is already locked', async () => {
        const account = 'account-shared.json';
        
        // Lock the account manually first
        lockManager.lock(account);
        expect(lockManager.isLocked(account)).toBe(true);

        const taskId = 'task-2';
        const publishData = {
            type: 3,
            accountList: [account],
            fileList: ['video-2.mp4'],
        };

        await runPublishTask(taskId, publishData);

        // Task should fail because account is locked
        expect(taskService.updateTaskStatus).toHaveBeenCalledWith(
            taskId, 
            'failed', 
            undefined, 
            '账号或浏览器配置正在使用中，请稍后再试'
        );

        // Clean up
        lockManager.unlock(account);
    });

    it('should release all locks if a task fails during execution', async () => {
        const account = 'account-fail.json';
        const taskId = 'task-fail';
        const publishData = {
            type: 999, // Unknown type to trigger error
            accountList: [account],
            fileList: ['video-fail.mp4'],
        };

        await runPublishTask(taskId, publishData);

        expect(lockManager.isLocked(account)).toBe(false);
        expect(taskService.updateTaskStatus).toHaveBeenCalledWith(
            taskId, 
            'failed', 
            undefined, 
            expect.stringContaining('Unknown platform type')
        );
    });
});
