import { http } from '@/utils/request'

// 仪表盘相关API
export const dashboardApi = {
  // 获取仪表盘统计数据
  getDashboardStats() {
    return http.get('/getDashboardStats')
  }
}