import { logger } from '../core/logger.js';
import { taskService } from './task-service.js';

/**
 * StartupService (启动自愈服务)
 *
 * 职责:
 * 1. 在应用启动阶段, 扫描数据库中过期的 "正在发布" 任务。
 * 2. 将它们转为失败状态, 并记录原因。
 * 3. 规避系统崩溃重启后, 前端界面任务卡死在正在发布状态的问题。
 */
export class StartupService {
    public static async runPostBootHousekeeping(): Promise<void> {
        try {
            logger.info('[StartupService] Running post-boot housekeeping...');

            // 获取所有当前在执状态的任务
            const allTasks = taskService.getAllTasks();
            const uploadingTasks = allTasks.filter(task => task.status === 'uploading');

            if (uploadingTasks.length === 0) {
                logger.info('[StartupService] No hung tasks found.');
                return;
            }

            logger.warn(`[StartupService] Found ${uploadingTasks.length} hung uploading tasks. Clearing...`);

            // 批量将状态重置为 failed
            for (const task of uploadingTasks) {
                logger.info(`[StartupService] Rescuing task ${task.id}...`);
                await taskService.updateTaskStatus(
                    task.id,
                    'failed',
                    0,
                    '系统重启或非预见性崩溃，请检查账号状态并点击重新重试。'
                );
            }

            logger.info('[StartupService] Housekeeping complete.');
        } catch (error) {
            logger.error('[StartupService] Housekeeping failed:', error);
        }
    }
}
