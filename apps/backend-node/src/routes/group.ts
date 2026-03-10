/**
 * Group route for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/routes/group.py
 */

import { Router, type Request, type Response } from 'express';
import { dbManager } from '../db/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const router = Router();

/**
 * GET /getGroups
 * Get all account groups with account counts.
 */
router.get('/getGroups', (_req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const groups = db.prepare(`
      SELECT g.*, COUNT(u.id) as account_count
      FROM account_groups g
      LEFT JOIN user_info u ON u.group_id = g.id
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `).all();

        sendSuccess(res, groups, '获取成功');
    } catch (error: any) {
        sendError(res, 500, `获取组列表失败: ${error.message}`);
    }
});

/**
 * POST /createGroup
 * Create a new account group.
 */
router.post('/createGroup', (req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const { name, description } = req.body;

        if (!name) {
            sendError(res, 400, '组名不能为空');
            return;
        }

        // Check for duplicate name
        const existing = db.prepare('SELECT id FROM account_groups WHERE name = ?').get(name);
        if (existing) {
            sendError(res, 400, '组名已存在');
            return;
        }

        const result = db.prepare(
            'INSERT INTO account_groups (name, description) VALUES (?, ?)'
        ).run(name, description || null);

        sendSuccess(res, { id: result.lastInsertRowid, name, description }, '创建成功');
    } catch (error: any) {
        sendError(res, 500, `创建组失败: ${error.message}`);
    }
});

/**
 * PUT /updateGroup/:groupId
 * Update an account group.
 */
router.put('/updateGroup/:groupId', (req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const groupId = Number(req.params.groupId);
        const { name, description } = req.body;

        if (!name) {
            sendError(res, 400, '组名不能为空');
            return;
        }

        // Check group exists
        const group = db.prepare('SELECT id FROM account_groups WHERE id = ?').get(groupId);
        if (!group) {
            sendError(res, 404, '组不存在');
            return;
        }

        // Check for duplicate name (excluding current group)
        const duplicate = db.prepare('SELECT id FROM account_groups WHERE name = ? AND id != ?').get(name, groupId);
        if (duplicate) {
            sendError(res, 400, '组名已存在');
            return;
        }

        db.prepare(
            'UPDATE account_groups SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(name, description || null, groupId);

        sendSuccess(res, null, '更新成功');
    } catch (error: any) {
        sendError(res, 500, `更新组失败: ${error.message}`);
    }
});

/**
 * DELETE /deleteGroup/:groupId
 * Delete an account group (fails if group has accounts).
 */
router.delete('/deleteGroup/:groupId', (req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const groupId = Number(req.params.groupId);

        // Check group exists
        const group = db.prepare('SELECT id FROM account_groups WHERE id = ?').get(groupId);
        if (!group) {
            sendError(res, 404, '组不存在');
            return;
        }

        // Check if group has accounts
        const accountCount = (db.prepare('SELECT COUNT(*) as count FROM user_info WHERE group_id = ?').get(groupId) as any).count;
        if (accountCount > 0) {
            sendError(res, 400, `无法删除，组内还有 ${accountCount} 个账号`);
            return;
        }

        db.prepare('DELETE FROM account_groups WHERE id = ?').run(groupId);
        sendSuccess(res, null, '删除成功');
    } catch (error: any) {
        sendError(res, 500, `删除组失败: ${error.message}`);
    }
});

/**
 * GET /getGroupAccounts/:groupId
 * Get all accounts in a group.
 */
router.get('/getGroupAccounts/:groupId', (req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();
        const groupId = Number(req.params.groupId);

        const accounts = db.prepare('SELECT * FROM user_info WHERE group_id = ? ORDER BY id DESC').all(groupId);
        sendSuccess(res, accounts, '获取成功');
    } catch (error: any) {
        sendError(res, 500, `获取组内账号失败: ${error.message}`);
    }
});
