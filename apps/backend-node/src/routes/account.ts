/**
 * Account route for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/routes/account.py
 */

import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import { COOKIES_DIR } from '../core/config.js';
import { getPlatformName } from '../core/constants.js';
import { dbManager } from '../db/database.js';
import { getCookieService } from '../services/cookie-service.js';
import { safeJoin } from '../utils/path.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const router = Router();

const VALIDATION_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours

interface AccountRecord {
  id: number;
  type: number;
  filePath: string;
  userName: string;
  status: number;
  group_id: number | null;
  created_at: string;
  last_validated_at: string | null;
}

/**
 * Perform real-time validation if cooldown expired or forced.
 */
async function validateAccountIfNeeded(account: AccountRecord, force: boolean = false): Promise<AccountRecord> {
    const now = Date.now();
    // Append Z if missing to ensure UTC parsing
    const dateStr = account.last_validated_at && !account.last_validated_at.endsWith('Z') 
        ? account.last_validated_at.replace(' ', 'T') + 'Z' 
        : account.last_validated_at;
    const lastValidated = dateStr ? new Date(dateStr).getTime() : 0;
    
    if (force || (now - lastValidated > VALIDATION_COOLDOWN_MS)) {
        try {
            const isValid = await getCookieService().checkCookie(account.type, account.filePath);
            const status = isValid ? 1 : 0;
            const validatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
            
            const db = dbManager.getDb();
            db.prepare('UPDATE user_info SET status = ?, last_validated_at = ? WHERE id = ?')
                .run(status, validatedAt, account.id);
            
            return { ...account, status, last_validated_at: validatedAt };
        } catch (error) {
            console.error(`[Account] Validation failed for ${account.userName}:`, error);
        }
    }
    return account;
}

/**
 * GET /getAccounts
 * Get all accounts (without cookie validation, fast).
 */
router.get('/getAccounts', (_req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const accounts = db.prepare('SELECT * FROM user_info ORDER BY id DESC').all() as AccountRecord[];
        // Convert objects to arrays to match Python's cursor.fetchall() -> list(row) behavior
        const rowsList = accounts.map(account => [
            account.id,
            account.type,
            account.filePath,
            account.userName,
            account.status,
            account.group_id,
            account.created_at,
            account.last_validated_at
        ]);
        sendSuccess(res, rowsList, '获取成功');
    } catch (error: unknown) {
        const err = error as Error;
        sendError(res, 500, `获取账号列表失败: ${err.message}`);
    }
});

/**
 * GET /getValidAccounts
 * Get accounts with cookie validation.
 * Optional: ?id=<accountId> to filter single account.
 * Optional: ?force=true to skip cooldown.
 */
router.get('/getValidAccounts', async (req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const accountId = req.query.id as string | undefined;
        const force = req.query.force === 'true';

        let accounts: AccountRecord[];
        if (accountId) {
            accounts = db.prepare('SELECT * FROM user_info WHERE id = ?').all(Number(accountId)) as AccountRecord[];
        } else {
            accounts = db.prepare('SELECT * FROM user_info ORDER BY id DESC').all() as AccountRecord[];
        }

        // Perform real-time validation for each account
        const validatedAccounts = await Promise.all(
            accounts.map(acc => validateAccountIfNeeded(acc, force))
        );

        const rowsList = validatedAccounts.map(account => [
            account.id,
            account.type,
            account.filePath,
            account.userName,
            account.status,
            account.group_id,
            account.created_at,
            account.last_validated_at,
        ]);

        sendSuccess(res, rowsList, '获取成功');
    } catch (error: any) {
        sendError(res, 500, `获取有效账号失败: ${error.message}`);
    }
});

/**
 * GET /getAccountStatus
 * Get single account status.
 * Optional: ?force=true to skip cooldown.
 */
router.get('/getAccountStatus', async (req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const id = req.query.id as string;
        const force = req.query.force === 'true';

        if (!id) {
            sendError(res, 400, '缺少账号ID');
            return;
        }

        let account = db.prepare('SELECT * FROM user_info WHERE id = ?').get(Number(id)) as any;
        if (!account) {
            sendError(res, 404, '账号不存在');
            return;
        }

        account = await validateAccountIfNeeded(account, force);

        sendSuccess(res, {
            id: account.id,
            type: account.type,
            filePath: account.filePath,
            userName: account.userName,
            status: account.status,
            group_id: account.group_id,
            statusText: account.status === 1 ? '正常' : '异常',
            isValid: account.status === 1,
            platformName: getPlatformName(account.type),
            last_validated_at: account.last_validated_at,
        }, '获取成功');
    } catch (error: any) {
        sendError(res, 500, `获取账号状态失败: ${error.message}`);
    }
});

/**
 * GET /deleteAccount
 * Delete an account.
 */
router.get('/deleteAccount', (req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const id = req.query.id as string;

        if (!id) {
            sendError(res, 400, '缺少账号ID');
            return;
        }

        // Query the record first to get filePath for cookie cleanup (matching Python)
        const record = db.prepare('SELECT * FROM user_info WHERE id = ?').get(Number(id)) as any;
        if (!record) {
            sendError(res, 404, 'account not found');
            return;
        }

        // Delete associated Cookie file (matching Python's account.py behavior)
        if (record.filePath) {
            try {
                const cookieFile = safeJoin(COOKIES_DIR, record.filePath);
                if (fs.existsSync(cookieFile)) {
                    fs.unlinkSync(cookieFile);
                }
            } catch (fileError) {
                console.error(`⚠️ 删除 Cookie 文件失败: ${fileError}`);
            }
        }

        // Delete database record
        db.prepare('DELETE FROM user_info WHERE id = ?').run(Number(id));

        sendSuccess(res, null, 'account deleted successfully');
    } catch (error: any) {
        sendError(res, 500, `删除账号失败: ${error.message}`);
    }
});

/**
 * POST /updateUserinfo
 * Update account information.
 */
router.post('/updateUserinfo', (req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const { id, type, filePath, userName, group_id } = req.body;

        if (!id) {
            sendError(res, 400, '缺少账号ID');
            return;
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (type !== undefined) {
            updates.push('type = ?');
            values.push(type);
        }
        if (filePath !== undefined) {
            updates.push('filePath = ?');
            values.push(filePath);
        }
        if (userName !== undefined) {
            updates.push('userName = ?');
            values.push(userName);
        }
        if (group_id !== undefined) {
            updates.push('group_id = ?');
            values.push(group_id === 0 ? null : group_id);
        }

        if (updates.length === 0) {
            sendError(res, 400, '没有需要更新的字段');
            return;
        }

        values.push(Number(id));
        db.prepare(`UPDATE user_info SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        sendSuccess(res, null, '更新成功');
    } catch (error: any) {
        sendError(res, 500, `更新账号失败: ${error.message}`);
    }
});
