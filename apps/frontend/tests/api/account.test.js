import { describe, it, expect, vi, beforeEach } from 'vitest'
import { accountApi } from '@/api/account'
import { http } from '@/utils/request'

// Mock http工具函数
vi.mock('@/utils/request', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

describe('accountApi.js', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should test getValidAccounts without id', () => {
    accountApi.getValidAccounts()
    expect(http.get).toHaveBeenCalledWith('/getValidAccounts')
  })

  it('should test getValidAccounts with id', () => {
    accountApi.getValidAccounts(123)
    expect(http.get).toHaveBeenCalledWith('/getValidAccounts?id=123')
  })

  it('should test getAccountStatus', () => {
    accountApi.getAccountStatus(456)
    expect(http.get).toHaveBeenCalledWith('/getAccountStatus?id=456')
  })

  it('should test getAccounts', () => {
    accountApi.getAccounts()
    expect(http.get).toHaveBeenCalledWith('/getAccounts')
  })

  it('should test addAccount', () => {
    const accountData = { name: 'testuser', email: 'test@example.com' }
    accountApi.addAccount(accountData)
    expect(http.post).toHaveBeenCalledWith('/account', accountData)
  })

  it('should test updateAccount', () => {
    const updateData = { id: 789, name: 'updateduser' }
    accountApi.updateAccount(updateData)
    expect(http.post).toHaveBeenCalledWith('/updateUserinfo', updateData)
  })

  it('should test deleteAccount', () => {
    accountApi.deleteAccount(999)
    expect(http.get).toHaveBeenCalledWith('/deleteAccount?id=999')
  })
})
