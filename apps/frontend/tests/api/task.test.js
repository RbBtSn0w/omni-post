
import { taskApi } from '@/api/task'
import { http } from '@/utils/request'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock request module
vi.mock('@/utils/request', () => ({
    http: {
        get: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        post: vi.fn()
    }
}))

describe('Task API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const mockResponse = { code: 200, data: [] }

    it('should get all tasks', async () => {
        http.get.mockResolvedValue(mockResponse)
        const res = await taskApi.getAllTasks()
        expect(http.get).toHaveBeenCalledWith('/tasks')
        expect(res).toEqual(mockResponse)
    })

    it('should delete task', async () => {
        http.delete.mockResolvedValue(mockResponse)
        const taskId = 1
        const res = await taskApi.deleteTask(taskId)
        expect(http.delete).toHaveBeenCalledWith(`/tasks/${taskId}`)
        expect(res).toEqual(mockResponse)
    })

    it('should update task status', async () => {
        http.patch.mockResolvedValue(mockResponse)
        const taskId = 1
        const status = 'completed'
        const progress = 100
        const res = await taskApi.updateTaskStatus(taskId, status, progress)
        expect(http.patch).toHaveBeenCalledWith(`/tasks/${taskId}`, { status, progress })
        expect(res).toEqual(mockResponse)
    })

    it('should start task', async () => {
        http.post.mockResolvedValue(mockResponse)
        const taskId = 1
        const res = await taskApi.startTask(taskId)
        expect(http.post).toHaveBeenCalledWith(`/tasks/${taskId}/start`)
        expect(res).toEqual(mockResponse)
    })
})
