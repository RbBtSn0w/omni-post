import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userApi } from '@/api/user'
import { http } from '@/utils/request'

// Mock http工具函数
vi.mock('@/utils/request', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('userApi.js', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should test getUserInfo', () => {
    userApi.getUserInfo(123)
    expect(http.get).toHaveBeenCalledWith('/user/123')
  })

  it('should test getUserList', () => {
    const params = { page: 1, limit: 10 }
    userApi.getUserList(params)
    expect(http.get).toHaveBeenCalledWith('/user/list', params)
  })

  it('should test createUser', () => {
    const userData = { name: 'testuser', email: 'test@example.com' }
    userApi.createUser(userData)
    expect(http.post).toHaveBeenCalledWith('/user', userData)
  })

  it('should test updateUser', () => {
    const userId = 123
    const userData = { name: 'updateduser', email: 'updated@example.com' }
    userApi.updateUser(userId, userData)
    expect(http.put).toHaveBeenCalledWith(`/user/${userId}`, userData)
  })

  it('should test deleteUser', () => {
    userApi.deleteUser(123)
    expect(http.delete).toHaveBeenCalledWith('/user/123')
  })

  it('should test login', () => {
    const loginData = { username: 'testuser', password: 'password123' }
    userApi.login(loginData)
    expect(http.post).toHaveBeenCalledWith('/auth/login', loginData)
  })

  it('should test register', () => {
    const registerData = { username: 'newuser', password: 'password123', email: 'new@example.com' }
    userApi.register(registerData)
    expect(http.post).toHaveBeenCalledWith('/auth/register', registerData)
  })

  it('should test logout', () => {
    userApi.logout()
    expect(http.post).toHaveBeenCalledWith('/auth/logout')
  })

  it('should test refreshToken', () => {
    userApi.refreshToken()
    expect(http.post).toHaveBeenCalledWith('/auth/refresh')
  })
})
