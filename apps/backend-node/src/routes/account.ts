/**
 * Account route for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/routes/account.py
 */

import { Router, type Request, type Response } from 'express';
import { getPlatformName } from '../core/constants.js';
import { dbManager } from '../db/database.js';

export const router = Router();

/**
 * GET /getAccounts
 * Get all accounts (without cookie validation, fast).
 */
router.get('/getAccounts', (_req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const accounts = db.prepare('SELECT * FROM user_info ORDER BY id DESC').all();
        res.json({ code: 200, msg: '获取成功', data: accounts });
    } catch (error: any) {
        res.status(500).json({ code: 500, msg: `获取账号列表失败: ${error.message}` });
    }
});

/**
 * GET /getValidAccounts
 * Get accounts with cookie validation.
 * Optional: ?id=<accountId> to filter single account.
 */
router.get('/getValidAccounts', async (req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const accountId = req.query.id as string | undefined;

        let accounts: any[];
        if (accountId) {
            accounts = db.prepare('SELECT * FROM user_info WHERE id = ?').all(Number(accountId));
        } else {
            accounts = db.prepare('SELECT * FROM user_info ORDER BY id DESC').all();
        }

        // TODO: When cookie-service is implemented, add validation
        // For now, return accounts with current status
        const result = accounts.map(account => ({
            ...account,
            platformName: getPlatformName(account.type),
        }));

        res.json({ code: 200, msg: '获取成功', data: result });
    } catch (error: any) {
        res.status(500).json({ code: 500, msg: `获取有效账号失败: ${error.message}` });
    }
});

/**
 * GET /getAccountStatus
 * Get single account status.
 */
router.get('/getAccountStatus', async (req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const id = req.query.id as string;

        if (!id) {
            res.status(400).json({ code: 400, msg: '缺少账号ID' });
            return;
        }

        const account = db.prepare('SELECT * FROM user_info WHERE id = ?').get(Number(id)) as any;
        if (!account) {
            res.status(404).json({ code: 404, msg: '账号不存在' });
            return;
        }

        // TODO: When cookie-service is implemented, add real-time validation
        res.json({
            code: 200,
            msg: '获取成功',
            data: {
                ...account,
                platformName: getPlatformName(account.type),
            },
        });
    } catch (error: any) {
        res.status(500).json({ code: 500, msg: `获取账号状态失败: ${error.message}` });
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
            res.status(400).json({ code: 400, msg: '缺少账号ID' });
            return;
        }

        const result = db.prepare('DELETE FROM user_info WHERE id = ?').run(Number(id));
        if (result.changes === 0) {
            res.status(404).json({ code: 404, msg: '账号不存在' });
            return;
        }

        res.json({ code: 200, msg: '删除成功' });
    } catch (error: any) {
        res.status(500).json({ code: 500, msg: `删除账号失败: ${error.message}` });
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
            res.status(400).json({ code: 400, msg: '缺少账号ID' });
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
            res.status(400).json({ code: 400, msg: '没有需要更新的字段' });
            return;
        }

        values.push(Number(id));
        db.prepare(`UPDATE user_info SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        res.json({ code: 200, msg: '更新成功' });
    } catch (error: any) {
        res.status(500).json({ code: 500, msg: `更新账号失败: ${error.message}` });
    }
});
