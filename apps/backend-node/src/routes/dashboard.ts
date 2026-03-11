/**
 * Dashboard route for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/routes/dashboard.py
 */

import { Router, type Request, type Response } from 'express';
import { PlatformType } from '../core/constants.js';
import { dbManager } from '../db/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const router = Router();

/**
 * GET /getDashboardStats
 * Get dashboard statistics including account, platform, task, and content stats.
 */
router.get('/getDashboardStats', (_req: Request, res: Response) => {
    try {
        const db = dbManager.getDb();

        // Account stats
        const totalAccounts = (db.prepare('SELECT COUNT(*) as count FROM user_info').get() as any).count;
        const normalAccounts = (db.prepare("SELECT COUNT(*) as count FROM user_info WHERE status = 1").get() as any).count;
        const abnormalAccounts = totalAccounts - normalAccounts;

        // Platform stats
        const platformStats: Record<string, number> = {
            kuaishou: 0,
            douyin: 0,
            channels: 0,
            xiaohongshu: 0,
            bilibili: 0,
        };
        const platformRows = db.prepare('SELECT type, COUNT(*) as count FROM user_info GROUP BY type').all() as any[];
        for (const row of platformRows) {
            switch (row.type) {
                case PlatformType.KUAISHOU: platformStats.kuaishou = row.count; break;
                case PlatformType.DOUYIN: platformStats.douyin = row.count; break;
                case PlatformType.TENCENT: platformStats.channels = row.count; break;
                case PlatformType.XIAOHONGSHU: platformStats.xiaohongshu = row.count; break;
                case PlatformType.BILIBILI: platformStats.bilibili = row.count; break;
            }
        }

        // Task stats
        const totalTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count;
        const completedTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get() as any).count;
        const inProgressTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status IN ('uploading', 'processing')").get() as any).count;
        const failedTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'failed'").get() as any).count;
        const waitingTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'waiting'").get() as any).count;

        // Content stats
        const totalFiles = (db.prepare('SELECT COUNT(*) as count FROM file_records').get() as any).count;

        // Task trend (last 7 days)
        const xAxis: string[] = [];
        const seriesCompleted: number[] = [];
        const seriesFailed: number[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = `${date.getMonth() + 1}-${date.getDate()}`;
            xAxis.push(dateStr);

            const dayStart = date.toISOString().split('T')[0];
            const completed = (db.prepare(
                "SELECT COUNT(*) as count FROM tasks WHERE status = 'completed' AND DATE(created_at) = ?"
            ).get(dayStart) as any).count;
            const failed = (db.prepare(
                "SELECT COUNT(*) as count FROM tasks WHERE status = 'failed' AND DATE(created_at) = ?"
            ).get(dayStart) as any).count;

            seriesCompleted.push(completed);
            seriesFailed.push(failed);
        }

        // Recent tasks - parse JSON fields
        const recentTasks = (db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5').all() as any[]).map(task => ({
            ...task,
            platforms: task.platforms ? JSON.parse(task.platforms) : [],
            account_list: task.account_list ? JSON.parse(task.account_list) : [],
        }));

        sendSuccess(res, {
            accountStats: { total: totalAccounts, normal: normalAccounts, abnormal: abnormalAccounts },
            platformStats,
            taskStats: {
                total: totalTasks,
                completed: completedTasks,
                inProgress: inProgressTasks,
                failed: failedTasks,
                waiting: waitingTasks,
            },
            contentStats: { total: totalFiles, published: completedTasks, draft: 0 },
            taskTrend: {
                xAxis,
                series: [
                    { name: '完成任务', data: seriesCompleted },
                    { name: '失败任务', data: seriesFailed },
                ],
            },
            contentStatsData: {
                xAxis: ['快手', '抖音', '视频号', '小红书', 'Bilibili'],
                series: [
                    { name: '已发布', data: [0, 0, 0, 0, 0] },
                    { name: '草稿', data: [0, 0, 0, 0, 0] },
                ],
            },
            recentTasks,
        }, '获取成功');
    } catch (error: any) {
        console.error(`[Dashboard] Error: ${error.message}`);
        sendError(res, 500, `获取数据失败: ${error.message}`);
    }
});
