import { http } from '@/utils/request'

export const taskApi = {
    // 获取所有任务
    getAllTasks() {
        return http.get('/tasks')
    },

    // 删除任务
    deleteTask(taskId) {
        return http.delete(`/tasks/${taskId}`)
    },

    // 更新任务状态
    updateTaskStatus(taskId, status, progress = null) {
        return http.patch(`/tasks/${taskId}`, { status, progress })
    },

    // 开始/重试任务
    startTask(taskId) {
        return http.post(`/tasks/${taskId}/start`)
    }
}
