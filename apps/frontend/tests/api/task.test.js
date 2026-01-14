
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { taskApi } from '@/api/task'
import { http } from '@/utils/request'

// Mock request module
vi.mock('@/utils/request', () => ({
    http: {
        get: vi.fn(),
        delete: vi.fn()
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
})
