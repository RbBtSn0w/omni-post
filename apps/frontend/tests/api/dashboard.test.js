import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardApi } from '@/api/dashboard'
import { http } from '@/utils/request'

// Mock http工具函数
vi.mock('@/utils/request', () => ({
  http: {
    get: vi.fn()
  }
}))

describe('dashboardApi.js', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should test getDashboardStats', () => {
    dashboardApi.getDashboardStats()
    expect(http.get).toHaveBeenCalledWith('/getDashboardStats')
  })
})
