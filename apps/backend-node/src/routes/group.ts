/**
 * Group route for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/routes/group.py
 */

import { Router, type Request, type Response } from 'express';
import { dbManager } from '../db/database.js';

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

        res.json({ code: 200, message: '获取成功', data: groups });
    } catch (error: any) {
        res.status(500).json({ code: 500, message: `获取组列表失败: ${error.message}` });
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
            res.status(400).json({ code: 400, message: '组名不能为空' });
            return;
        }

        // Check for duplicate name
        const existing = db.prepare('SELECT id FROM account_groups WHERE name = ?').get(name);
        if (existing) {
            res.status(400).json({ code: 400, message: '组名已存在' });
            return;
        }

        const result = db.prepare(
            'INSERT INTO account_groups (name, description) VALUES (?, ?)'
        ).run(name, description || null);

        res.json({
            code: 200,
            message: '创建成功',
            data: { id: result.lastInsertRowid, name, description },
        });
    } catch (error: any) {
        res.status(500).json({ code: 500, message: `创建组失败: ${error.message}` });
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
            res.status(400).json({ code: 400, message: '组名不能为空' });
            return;
        }

        // Check group exists
        const group = db.prepare('SELECT id FROM account_groups WHERE id = ?').get(groupId);
        if (!group) {
            res.status(404).json({ code: 404, message: '组不存在' });
            return;
        }

        // Check for duplicate name (excluding current group)
        const duplicate = db.prepare('SELECT id FROM account_groups WHERE name = ? AND id != ?').get(name, groupId);
        if (duplicate) {
            res.status(400).json({ code: 400, message: '组名已存在' });
            return;
        }

        db.prepare(
            'UPDATE account_groups SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(name, description || null, groupId);

        res.json({ code: 200, message: '更新成功' });
    } catch (error: any) {
        res.status(500).json({ code: 500, message: `更新组失败: ${error.message}` });
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
            res.status(404).json({ code: 404, message: '组不存在' });
            return;
        }

        // Check if group has accounts
        const accountCount = (db.prepare('SELECT COUNT(*) as count FROM user_info WHERE group_id = ?').get(groupId) as any).count;
        if (accountCount > 0) {
            res.status(400).json({ code: 400, message: `无法删除，组内还有 ${accountCount} 个账号` });
            return;
        }

        db.prepare('DELETE FROM account_groups WHERE id = ?').run(groupId);
        res.json({ code: 200, message: '删除成功' });
    } catch (error: any) {
        res.status(500).json({ code: 500, message: `删除组失败: ${error.message}` });
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
        res.json({ code: 200, message: '获取成功', data: accounts });
    } catch (error: any) {
        res.status(500).json({ code: 500, message: `获取组内账号失败: ${error.message}` });
    }
});
