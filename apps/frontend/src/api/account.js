import { http } from '@/utils/request'

// 账号管理相关API
export const accountApi = {
  // 获取有效账号列表（带验证）
  getValidAccounts(id = null, force = false) {
    let url = '/getValidAccounts'
    const params = []
    if (id) params.push(`id=${id}`)
    if (force) params.push('force=true')
    
    if (params.length > 0) {
      url += `?${params.join('&')}`
    }
    return http.get(url)
  },

  // 获取单个账号状态
  getAccountStatus(id, force = false) {
    let url = `/getAccountStatus?id=${id}`
    if (force) url += '&force=true'
    return http.get(url)
  },

  // 获取账号列表（不带验证，快速加载）
  getAccounts() {
    return http.get('/getAccounts')
  },

  // 添加账号
  addAccount(data) {
    return http.post('/account', data)
  },

  // 更新账号
  updateAccount(data) {
    return http.post('/updateUserinfo', data)
  },

  // 删除账号
  deleteAccount(id) {
    return http.get(`/deleteAccount?id=${id}`)
  }
}