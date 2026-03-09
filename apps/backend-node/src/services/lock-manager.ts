import { logger } from '../core/logger';

/**
 * AccountLockManager (账号级互斥锁管理器)
 *
 * 背景: Node.js 的异步事件循环 (setImmediate/Promises) 在处理高并发发布请求时,
 * 可能会让同一个账号同时进入两个不同的 Playwright 上下文, 导致 Cookie 冲突或平台封号。
 *
 * 职责:
 * 1. 维护正在运行的账号集合。
 * 2. 确保同一账号在物理发布 (US3) 流程中仅能运行一个 Session。
 * 3. 对标 Python 的线程同步需求。
 */
export class AccountLockManager {
    private static instance: AccountLockManager;
    private lockedAccounts: Set<string> = new Set();

    private constructor() { }

    public static getInstance(): AccountLockManager {
        if (!AccountLockManager.instance) {
            AccountLockManager.instance = new AccountLockManager();
        }
        return AccountLockManager.instance;
    }

    /**
     * 锁定账号 (Lock)
     * @param accountPath 账号 Cookie 路径, 作为唯一标识
     * @returns boolean 是否锁定成功
     */
    public lock(accountPath: string): boolean {
        if (this.lockedAccounts.has(accountPath)) {
            logger.warn(`[LockManager] Account already locked: ${accountPath}`);
            return false;
        }
        this.lockedAccounts.add(accountPath);
        logger.info(`[LockManager] Locked account: ${accountPath}. Active locks: ${this.lockedAccounts.size}`);
        return true;
    }

    /**
     * 解锁账号 (Unlock)
     * @param accountPath 账号 Cookie 路径
     */
    public unlock(accountPath: string): void {
        this.lockedAccounts.delete(accountPath);
        logger.info(`[LockManager] Unlocked account: ${accountPath}. Remaining locks: ${this.lockedAccounts.size}`);
    }

    /**
     * 检查账号是否锁定
     * @param accountPath 账号信息标识
     */
    public isLocked(accountPath: string): boolean {
        return this.lockedAccounts.has(accountPath);
    }

    /**
     * 清空所有锁 (用于系统重启或全局重置)
     */
    public clearAll(): void {
        this.lockedAccounts.clear();
        logger.info(`[LockManager] All locks cleared.`);
    }
}

export const lockManager = AccountLockManager.getInstance();
