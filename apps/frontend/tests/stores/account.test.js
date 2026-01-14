import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAccountStore } from '@/stores/account'
import { createPinia } from 'pinia'
import { setActivePinia } from 'pinia'

describe('useAccountStore', () => {
  let accountStore

  beforeEach(() => {
    // 创建一个新的pinia实例
    const pinia = createPinia()
    setActivePinia(pinia)
    // 重置store
    accountStore = useAccountStore()
  })

  it('should initialize with default values', () => {
    expect(accountStore.accounts).toEqual([])
    expect(accountStore.refreshStatus.isRefreshing).toBe(false)
    expect(accountStore.refreshStatus.refreshingIds).toEqual([])
    expect(accountStore.refreshStatus.totalCount).toBe(0)
    expect(accountStore.refreshStatus.completedCount).toBe(0)
    expect(accountStore.refreshStatus.lastRefreshTime).toBe(null)
    expect(accountStore.dataExpiry.isExpired).toBe(false)
  })

  it('should check data expiry correctly', () => {
    // 初始状态下，数据应该是过期的
    expect(accountStore.checkDataExpiry()).toBe(true)

    // 设置数据已获取，数据应该不再过期
    accountStore.setDataFetched()
    expect(accountStore.checkDataExpiry()).toBe(false)

    // 模拟时间过去31分钟，数据应该过期
    vi.useFakeTimers()
    vi.advanceTimersByTime(31 * 60 * 1000) // 31分钟
    expect(accountStore.checkDataExpiry()).toBe(true)
    vi.useRealTimers()
  })

  it('should set accounts correctly from array format', () => {
    const accountsData = [
      [1, 1, '/path/to/file1', 'user1', 1],
      [2, 2, '/path/to/file2', 'user2', 0]
    ]

    accountStore.setAccounts(accountsData)

    expect(accountStore.accounts.length).toBe(2)
    expect(accountStore.accounts[0]).toEqual({
      id: 1,
      type: 1,
      filePath: '/path/to/file1',
      name: 'user1',
      status: '正常',
      platform: '小红书',
      avatar: '/vite.svg',
      isRefreshing: false,
      retryCount: 0,
      nextRetryTime: 0
    })
    expect(accountStore.accounts[1]).toEqual({
      id: 2,
      type: 2,
      filePath: '/path/to/file2',
      name: 'user2',
      status: '异常',
      platform: '视频号',
      avatar: '/vite.svg',
      isRefreshing: false,
      retryCount: 0,
      nextRetryTime: 0
    })
  })

  it('should set accounts correctly from object format', () => {
    const accountsData = [
      {
        id: 1,
        type: 3,
        filePath: '/path/to/file1',
        userName: 'user1',
        statusText: '正常'
      },
      {
        id: 2,
        type: 4,
        filePath: '/path/to/file2',
        userName: 'user2',
        statusText: '异常'
      }
    ]

    accountStore.setAccounts(accountsData)

    expect(accountStore.accounts.length).toBe(2)
    expect(accountStore.accounts[0]).toEqual({
      id: 1,
      type: 3,
      filePath: '/path/to/file1',
      name: 'user1',
      status: '正常',
      platform: '抖音',
      avatar: '/vite.svg',
      isRefreshing: false,
      retryCount: 0,
      nextRetryTime: 0
    })
    expect(accountStore.accounts[1]).toEqual({
      id: 2,
      type: 4,
      filePath: '/path/to/file2',
      name: 'user2',
      status: '异常',
      platform: '快手',
      avatar: '/vite.svg',
      isRefreshing: false,
      retryCount: 0,
      nextRetryTime: 0
    })
  })

  it('should handle duplicate accounts correctly', () => {
    const accountsData = [
      [1, 1, '/path/to/file1', 'user1', 1],
      [2, 1, '/path/to/file2', 'user1', 0] // 相同用户名和平台，状态异常
    ]

    accountStore.setAccounts(accountsData)

    // 应该只有一个账号，因为去重了
    expect(accountStore.accounts.length).toBe(1)
    // 应该保留状态正常的账号
    expect(accountStore.accounts[0].id).toBe(1)
    expect(accountStore.accounts[0].status).toBe('正常')
  })

  it('should add new account correctly', () => {
    const account = {
      id: 1,
      type: 1,
      filePath: '/path/to/file',
      name: 'user1',
      status: '正常',
      platform: '小红书',
      avatar: '/vite.svg'
    }

    accountStore.addAccount(account)

    expect(accountStore.accounts.length).toBe(1)
    expect(accountStore.accounts[0]).toEqual({
      ...account,
      isRefreshing: false
    })
  })

  it('should update existing account when adding duplicate', () => {
    const account1 = {
      id: 1,
      type: 1,
      filePath: '/path/to/file1',
      name: 'user1',
      status: '正常',
      platform: '小红书',
      avatar: '/vite.svg'
    }

    const account2 = {
      id: 1,
      type: 1,
      filePath: '/path/to/file2',
      name: 'user1',
      status: '异常',
      platform: '小红书',
      avatar: '/vite.svg'
    }

    accountStore.addAccount(account1)
    accountStore.addAccount(account2)

    expect(accountStore.accounts.length).toBe(1)
    expect(accountStore.accounts[0].filePath).toBe('/path/to/file2')
    expect(accountStore.accounts[0].status).toBe('异常')
  })

  it('should update account correctly', () => {
    // 先添加一个账号
    accountStore.addAccount({
      id: 1,
      type: 1,
      filePath: '/path/to/file',
      name: 'user1',
      status: '正常',
      platform: '小红书',
      avatar: '/vite.svg'
    })

    // 更新账号
    accountStore.updateAccount(1, {
      status: '异常',
      filePath: '/path/to/newfile'
    })

    expect(accountStore.accounts[0].status).toBe('异常')
    expect(accountStore.accounts[0].filePath).toBe('/path/to/newfile')
  })

  it('should update account status correctly', () => {
    // 先添加一个账号
    accountStore.addAccount({
      id: 1,
      type: 1,
      filePath: '/path/to/file',
      name: 'user1',
      status: '正常',
      platform: '小红书',
      avatar: '/vite.svg'
    })

    // 更新账号状态为刷新中
    const result = accountStore.updateAccountStatus(1, '刷新中', true)

    expect(accountStore.accounts[0].status).toBe('刷新中')
    expect(accountStore.accounts[0].isRefreshing).toBe(true)
    expect(accountStore.refreshStatus.refreshingIds).toContain(1)
    expect(accountStore.refreshStatus.totalCount).toBe(1)
    expect(result).toBe(null) // 因为isRefreshing为true，不返回状态变化

    // 更新账号状态为正常，结束刷新
    const result2 = accountStore.updateAccountStatus(1, '正常', false)

    expect(accountStore.accounts[0].status).toBe('正常')
    expect(accountStore.accounts[0].isRefreshing).toBe(false)
    expect(accountStore.refreshStatus.refreshingIds).not.toContain(1)
    expect(accountStore.refreshStatus.completedCount).toBe(1)
    expect(result2).toEqual({
      id: 1,
      oldStatus: '刷新中',
      newStatus: '正常',
      account: accountStore.accounts[0]
    })
  })

  it('should delete account correctly', () => {
    // 先添加两个账号
    accountStore.addAccount({
      id: 1,
      type: 1,
      filePath: '/path/to/file1',
      name: 'user1',
      status: '正常',
      platform: '小红书',
      avatar: '/vite.svg'
    })

    accountStore.addAccount({
      id: 2,
      type: 2,
      filePath: '/path/to/file2',
      name: 'user2',
      status: '正常',
      platform: '视频号',
      avatar: '/vite.svg'
    })

    // 删除一个账号
    accountStore.deleteAccount(1)

    expect(accountStore.accounts.length).toBe(1)
    expect(accountStore.accounts[0].id).toBe(2)
  })

  it('should get accounts by platform correctly', () => {
    // 先添加两个不同平台的账号
    accountStore.addAccount({
      id: 1,
      type: 1,
      filePath: '/path/to/file1',
      name: 'user1',
      status: '正常',
      platform: '小红书',
      avatar: '/vite.svg'
    })

    accountStore.addAccount({
      id: 2,
      type: 2,
      filePath: '/path/to/file2',
      name: 'user2',
      status: '正常',
      platform: '视频号',
      avatar: '/vite.svg'
    })

    // 获取小红书账号
    const xiaohongshuAccounts = accountStore.getAccountsByPlatform('小红书')
    expect(xiaohongshuAccounts.length).toBe(1)
    expect(xiaohongshuAccounts[0].platform).toBe('小红书')

    // 获取视频号账号
    const channelsAccounts = accountStore.getAccountsByPlatform('视频号')
    expect(channelsAccounts.length).toBe(1)
    expect(channelsAccounts[0].platform).toBe('视频号')

    // 获取不存在的平台账号
    const douyinAccounts = accountStore.getAccountsByPlatform('抖音')
    expect(douyinAccounts.length).toBe(0)
  })

  it('should get account by id correctly', () => {
    // 先添加一个账号
    accountStore.addAccount({
      id: 1,
      type: 1,
      filePath: '/path/to/file',
      name: 'user1',
      status: '正常',
      platform: '小红书',
      avatar: '/vite.svg'
    })

    // 获取存在的账号
    const account = accountStore.getAccountById(1)
    expect(account).toBeDefined()
    expect(account.id).toBe(1)

    // 获取不存在的账号
    const nonExistentAccount = accountStore.getAccountById(999)
    expect(nonExistentAccount).toBeUndefined()
  })

  it('should handle refresh status correctly', () => {
    // 开始刷新
    accountStore.startRefresh()

    expect(accountStore.refreshStatus.isRefreshing).toBe(true)
    expect(accountStore.refreshStatus.refreshingIds).toEqual([])
    expect(accountStore.refreshStatus.totalCount).toBe(0)
    expect(accountStore.refreshStatus.completedCount).toBe(0)
    expect(accountStore.refreshStatus.lastRefreshTime).not.toBe(null)

    // 先添加两个账号，然后再更新状态
    accountStore.addAccount({
      id: 1,
      type: 1,
      filePath: '/path/to/file1',
      name: 'user1',
      status: '正常',
      platform: '小红书',
      avatar: '/vite.svg'
    })

    accountStore.addAccount({
      id: 2,
      type: 2,
      filePath: '/path/to/file2',
      name: 'user2',
      status: '正常',
      platform: '视频号',
      avatar: '/vite.svg'
    })

    // 模拟添加刷新中的账号
    accountStore.updateAccountStatus(1, '刷新中', true)
    accountStore.updateAccountStatus(2, '刷新中', true)

    expect(accountStore.refreshStatus.refreshingIds.length).toBe(2)
    expect(accountStore.refreshStatus.totalCount).toBe(2)

    // 获取刷新进度
    expect(accountStore.getRefreshProgress()).toBe(0) // 0/2

    // 完成一个账号的刷新
    accountStore.updateAccountStatus(1, '正常', false)

    expect(accountStore.getRefreshProgress()).toBe(50) // 1/2
    expect(accountStore.refreshStatus.completedCount).toBe(1)

    // 完成所有账号的刷新
    accountStore.updateAccountStatus(2, '正常', false)

    expect(accountStore.getRefreshProgress()).toBe(100) // 2/2

    // 结束刷新
    accountStore.endRefresh()

    expect(accountStore.refreshStatus.isRefreshing).toBe(false)
    expect(accountStore.refreshStatus.lastRefreshTime).not.toBe(null)

    // 重置刷新状态
    accountStore.resetRefreshStatus()

    expect(accountStore.refreshStatus.isRefreshing).toBe(false)
    expect(accountStore.refreshStatus.refreshingIds).toEqual([])
    expect(accountStore.refreshStatus.totalCount).toBe(0)
    expect(accountStore.refreshStatus.totalCount).toBe(0)
    expect(accountStore.refreshStatus.completedCount).toBe(0)
  })

  it('should set all accounts refreshing correctly', () => {
    // Add two accounts
    accountStore.addAccount({ id: 1, status: '正常', isRefreshing: false })
    accountStore.addAccount({ id: 2, status: '异常', isRefreshing: false })

    // Call setAllAccountsRefreshing(true)
    accountStore.setAllAccountsRefreshing(true)

    expect(accountStore.refreshStatus.isRefreshing).toBe(true)
    expect(accountStore.refreshStatus.totalCount).toBe(2)
    expect(accountStore.refreshStatus.completedCount).toBe(0)
    expect(accountStore.accounts[0].isRefreshing).toBe(true)
    expect(accountStore.accounts[0].status).toBe('验证中')
    expect(accountStore.accounts[1].isRefreshing).toBe(true)
    expect(accountStore.accounts[1].status).toBe('验证中')

    // Call setAllAccountsRefreshing(false) via endRefresh or manually?
    // The method handles isRefreshing=false too
    accountStore.setAllAccountsRefreshing(false)
    expect(accountStore.refreshStatus.isRefreshing).toBe(false)
    expect(accountStore.accounts[0].isRefreshing).toBe(false)
    // Status should remain '验证中' because setAllAccountsRefreshing(false) doesn't revert status
    // The status update logic relies on API response later
    expect(accountStore.accounts[0].status).toBe('验证中')
  })

  // ========== Validation Cooldown Tests ==========
  describe('validation cooldown', () => {
    it('should return true for needsValidation when never validated', () => {
      expect(accountStore.validationState.lastValidationTime).toBe(null)
      expect(accountStore.needsValidation()).toBe(true)
    })

    it('should return false for needsValidation within cooldown period', () => {
      // Mark validation as completed
      accountStore.setValidationCompleted()

      // Should not need validation immediately after
      expect(accountStore.needsValidation()).toBe(false)
    })

    it('should return true for needsValidation after cooldown expires', () => {
      vi.useFakeTimers()

      // Mark validation as completed
      accountStore.setValidationCompleted()
      expect(accountStore.needsValidation()).toBe(false)

      // Advance time past cooldown (5 minutes + 1 second)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000)
      expect(accountStore.needsValidation()).toBe(true)

      vi.useRealTimers()
    })

    it('should update lastValidationTime when setValidationCompleted is called', () => {
      expect(accountStore.validationState.lastValidationTime).toBe(null)

      accountStore.setValidationCompleted()

      expect(accountStore.validationState.lastValidationTime).not.toBe(null)
      expect(typeof accountStore.validationState.lastValidationTime).toBe('number')
    })
  })
})
