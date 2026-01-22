import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useAccountStore = defineStore('account', () => {
  // 存储所有账号信息
  const accounts = ref([])

  // 刷新状态管理
  const refreshStatus = reactive({
    isRefreshing: false,
    refreshingIds: [], // 当前正在刷新的账号ID列表
    totalCount: 0,      // 总刷新数量
    completedCount: 0,  // 已完成数量
    lastRefreshTime: null // 最后刷新时间
  })

  // 数据有效期管理
  const dataExpiry = reactive({
    // 默认数据有效期为30分钟（基于cookie的典型有效期）
    expiryTime: 30 * 60 * 1000, // 30分钟，单位毫秒
    lastFetchTime: null,         // 最后获取数据的时间
    isExpired: false             // 数据是否已过期
  })

  // 验证状态管理（防止页面切换时重复验证）
  const validationState = reactive({
    lastValidationTime: null,      // 最后一次完整验证的时间
    validationCooldown: 5 * 60 * 1000, // 验证冷却期：5分钟
  })

  // 检查是否需要验证（冷却期外才需要验证）
  const needsValidation = () => {
    if (!validationState.lastValidationTime) return true
    return Date.now() - validationState.lastValidationTime > validationState.validationCooldown
  }

  // 标记验证完成
  const setValidationCompleted = () => {
    validationState.lastValidationTime = Date.now()
  }

  // 平台类型映射
  const platformTypes = {
    1: '小红书',
    2: '视频号',
    3: '抖音',
    4: '快手',
    5: 'Bilibili'
  }

  // 状态机映射
  const statusMap = {
    1: '正常',
    0: '异常'
  }

  // 初始状态映射
  const initialStatus = '验证中'

  // 检查数据是否已过期
  const checkDataExpiry = () => {
    if (!dataExpiry.lastFetchTime) {
      // 从未获取过数据，需要获取
      dataExpiry.isExpired = true
      return true
    }

    const now = Date.now()
    const isExpired = (now - dataExpiry.lastFetchTime) > dataExpiry.expiryTime
    dataExpiry.isExpired = isExpired
    return isExpired
  }

  // 设置数据为已获取（更新最后获取时间）
  const setDataFetched = () => {
    dataExpiry.lastFetchTime = Date.now()
    dataExpiry.isExpired = false
  }

  // 设置账号列表
  const setAccounts = (accountsData) => {
    // 转换后端返回的数据格式为前端使用的格式
    const transformedAccounts = accountsData.map(item => {
      // 如果是数组格式（getValidAccounts返回）
      if (Array.isArray(item)) {
        return {
          id: item[0],
          type: item[1],
          filePath: item[2],
          name: item[3],
          status: statusMap[item[4]] || initialStatus,
          group_id: item[5],
          platform: platformTypes[item[1]] || '未知',
          avatar: '/vite.svg', // 默认使用vite.svg作为头像
          isRefreshing: false,
          retryCount: 0,        // 连续失败次数
          nextRetryTime: 0      // 下次可重试时间戳
        }
      }
      // 如果是对象格式（getAccountStatus返回）
      else {
        return {
          id: item.id,
          type: item.type,
          filePath: item.filePath,
          name: item.userName,
          status: item.statusText || initialStatus,
          platform: platformTypes[item.type] || '未知',
          avatar: '/vite.svg',
          isRefreshing: false,
          retryCount: 0,        // 连续失败次数
          nextRetryTime: 0      // 下次可重试时间戳
        }
      }
    })

    // 去重处理：根据用户名和平台进行去重，确保每个用户名和平台组合只有一个账号
    // 优先保留状态正常的账号，如果没有正常账号则保留最新添加的账号
    const uniqueAccounts = []
    const accountMap = new Map()

    // 先按状态排序：正常 > 异常 > 验证中
    const statusPriority = {
      '正常': 3,
      '异常': 2,
      '验证中': 1
    }

    transformedAccounts.sort((a, b) => {
      // 优先按状态排序
      const statusDiff = statusPriority[b.status] - statusPriority[a.status]
      if (statusDiff !== 0) {
        return statusDiff
      }
      // 状态相同时按ID排序，保留最新添加的账号（ID更大的）
      return b.id - a.id
    })

    // 去重：根据用户名和平台组合去重
    for (const account of transformedAccounts) {
      const key = `${account.name}_${account.platform}`
      if (!accountMap.has(key)) {
        accountMap.set(key, account)
        uniqueAccounts.push(account)
      } else {
        console.warn(`重复的账号: ${account.name} (${account.platform})，已自动去重，保留状态更好的账号`)
      }
    }

    accounts.value = uniqueAccounts
    // 更新数据获取时间
    setDataFetched()
  }

  // 添加账号
  const addAccount = (account) => {
    if (!account || !account.id) {
      console.error('无效的账号数据:', account)
      return
    }

    // 检查是否已存在相同ID的账号
    const existingIndex = accounts.value.findIndex(acc => acc.id === account.id)
    if (existingIndex !== -1) {
      // 如果已存在，更新现有账号
      console.warn(`账号ID ${account.id} 已存在，将更新现有账号`)
      accounts.value[existingIndex] = {
        ...accounts.value[existingIndex],
        ...account,
        isRefreshing: false
      }
    } else {
      // 如果不存在，添加新账号
      accounts.value.push({
        ...account,
        isRefreshing: false
      })
    }
    // 更新数据获取时间，因为账号列表已更新
    setDataFetched()
  }

  // 更新单个账号
  const updateAccount = (id, updatedAccount) => {
    const index = accounts.value.findIndex(acc => acc.id === id)
    if (index !== -1) {
      accounts.value[index] = { ...accounts.value[index], ...updatedAccount }
      // 更新数据获取时间，因为账号列表已更新
      setDataFetched()
    }
  }

  // 更新单个账号状态
  const updateAccountStatus = (id, status, isRefreshing = false) => {
    const index = accounts.value.findIndex(acc => acc.id === id)
    if (index !== -1) {
      const oldStatus = accounts.value[index].status
      accounts.value[index].status = status
      accounts.value[index].isRefreshing = isRefreshing

      // 更新刷新状态统计
      if (isRefreshing && !refreshStatus.refreshingIds.includes(id)) {
        refreshStatus.refreshingIds.push(id)
        refreshStatus.totalCount++
      } else if (!isRefreshing && refreshStatus.refreshingIds.includes(id)) {
        refreshStatus.refreshingIds = refreshStatus.refreshingIds.filter(item => item !== id)
        refreshStatus.completedCount++
      }

      // 更新数据获取时间，因为账号状态已更新
      setDataFetched()

      // 触发状态变化事件
      if (oldStatus !== status && !isRefreshing) {
        // 这里可以通过事件总线或其他方式通知组件
        // 由于Pinia没有内置事件系统，我们可以返回状态变化信息
        return {
          id,
          oldStatus,
          newStatus: status,
          account: accounts.value[index]
        }
      }
    }
    return null
  }

  // 删除账号
  const deleteAccount = (id) => {
    accounts.value = accounts.value.filter(acc => acc.id !== id)

    // 更新刷新状态统计
    if (refreshStatus.refreshingIds.includes(id)) {
      refreshStatus.refreshingIds = refreshStatus.refreshingIds.filter(item => item !== id)
      refreshStatus.totalCount--
    }
    // 更新数据获取时间，因为账号列表已更新
    setDataFetched()
  }

  // 根据平台获取账号
  const getAccountsByPlatform = (platform) => {
    return accounts.value.filter(acc => acc.platform === platform)
  }

  // 获取单个账号
  const getAccountById = (id) => {
    return accounts.value.find(acc => acc.id === id)
  }

  // 开始刷新
  const startRefresh = () => {
    refreshStatus.isRefreshing = true
    refreshStatus.refreshingIds = []
    refreshStatus.totalCount = 0
    refreshStatus.completedCount = 0
    refreshStatus.lastRefreshTime = Date.now()
  }

  // 结束刷新
  const endRefresh = () => {
    refreshStatus.isRefreshing = false
    refreshStatus.lastRefreshTime = Date.now()
    // 更新数据获取时间，因为刷新完成后数据已更新
    setDataFetched()
  }

  // 设置所有账号为刷新状态（用于全局强制刷新）
  const setAllAccountsRefreshing = (isRefreshing) => {
    refreshStatus.isRefreshing = isRefreshing

    // 更新所有账号的状态
    accounts.value.forEach(account => {
      account.isRefreshing = isRefreshing
      if (isRefreshing) {
        account.status = '验证中'
      }
    })

    if (isRefreshing) {
      // 重置统计
      refreshStatus.totalCount = accounts.value.length
      refreshStatus.completedCount = 0
      refreshStatus.refreshingIds = accounts.value.map(acc => acc.id)
    }
  }

  // 重置刷新状态
  const resetRefreshStatus = () => {
    refreshStatus.isRefreshing = false
    refreshStatus.refreshingIds = []
    refreshStatus.totalCount = 0
    refreshStatus.completedCount = 0
  }

  // 获取刷新进度
  const getRefreshProgress = () => {
    if (refreshStatus.totalCount === 0) return 0
    return Math.round((refreshStatus.completedCount / refreshStatus.totalCount) * 100)
  }

  // ==================== 重试管理（指数退避）====================

  // 最大重试次数，超过后停止自动刷新（减少到3次避免无休止执行）
  const MAX_RETRY_COUNT = 3
  // 基础退避时间（秒）- 增加到60秒以减少刷新频率
  const BASE_BACKOFF_SECONDS = 60

  // 增加账号重试计数，并计算下次可重试时间（指数退避）
  const incrementRetryCount = (id) => {
    const index = accounts.value.findIndex(acc => acc.id === id)
    if (index !== -1) {
      const currentCount = (accounts.value[index].retryCount || 0) + 1
      // 指数退避：30s, 60s, 120s, 240s, 480s
      const backoffSeconds = BASE_BACKOFF_SECONDS * Math.pow(2, currentCount - 1)
      const nextRetryTime = Date.now() + backoffSeconds * 1000

      accounts.value[index].retryCount = currentCount
      accounts.value[index].nextRetryTime = nextRetryTime

      console.log(`账号 ${accounts.value[index].name} 第 ${currentCount} 次失败，下次可重试时间: ${new Date(nextRetryTime).toLocaleTimeString()}`)

      return currentCount
    }
    return 0
  }

  // 重置账号重试计数（刷新成功时调用）
  const resetRetryCount = (id) => {
    const index = accounts.value.findIndex(acc => acc.id === id)
    if (index !== -1) {
      accounts.value[index].retryCount = 0
      accounts.value[index].nextRetryTime = 0
    }
  }

  // 检查账号是否应该重试
  const shouldRetry = (account) => {
    // 如果超过最大重试次数，停止自动刷新
    if ((account.retryCount || 0) >= MAX_RETRY_COUNT) {
      return false
    }
    // 如果未到下次重试时间，跳过
    if (account.nextRetryTime && Date.now() < account.nextRetryTime) {
      return false
    }
    return true
  }

  // 获取可以重试的异常账号列表
  const getAccountsForRetry = () => {
    return accounts.value.filter(account =>
      account.status === '异常' && shouldRetry(account)
    )
  }

  return {
    accounts,
    refreshStatus,
    dataExpiry,
    validationState,
    checkDataExpiry,
    setDataFetched,
    needsValidation,
    setValidationCompleted,
    setAccounts,
    addAccount,
    updateAccount,
    updateAccountStatus,
    deleteAccount,
    getAccountsByPlatform,
    getAccountById,
    startRefresh,
    endRefresh,
    setAllAccountsRefreshing,
    resetRefreshStatus,
    getRefreshProgress,
    // 重试管理
    incrementRetryCount,
    resetRetryCount,
    shouldRetry,
    getAccountsForRetry,
    MAX_RETRY_COUNT
  }
})
