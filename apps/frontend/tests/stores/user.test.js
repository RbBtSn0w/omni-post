import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from '@/stores/user'
import { createPinia } from 'pinia'
import { setActivePinia } from 'pinia'

describe('useUserStore', () => {
  let userStore
  
  beforeEach(() => {
    // 创建一个新的pinia实例
    const pinia = createPinia()
    setActivePinia(pinia)
    // 重置store
    userStore = useUserStore()
  })

  it('should initialize with default values', () => {
    expect(userStore.userInfo).toEqual({ name: '', email: '' })
    expect(userStore.isLoggedIn).toBe(false)
  })

  it('should set user info correctly', () => {
    const userInfo = {
      name: 'testuser',
      email: 'test@example.com'
    }
    
    userStore.setUserInfo(userInfo)
    
    expect(userStore.userInfo).toEqual(userInfo)
    expect(userStore.isLoggedIn).toBe(true)
  })

  it('should logout correctly', () => {
    // 先登录
    const userInfo = {
      name: 'testuser',
      email: 'test@example.com'
    }
    userStore.setUserInfo(userInfo)
    
    expect(userStore.isLoggedIn).toBe(true)
    expect(userStore.userInfo).toEqual(userInfo)
    
    // 登出
    userStore.logout()
    
    expect(userStore.userInfo).toEqual({ name: '', email: '' })
    expect(userStore.isLoggedIn).toBe(false)
  })

  it('should handle multiple setUserInfo calls correctly', () => {
    // 第一次设置用户信息
    userStore.setUserInfo({ name: 'user1', email: 'user1@example.com' })
    expect(userStore.userInfo.name).toBe('user1')
    
    // 第二次设置用户信息（更新）
    userStore.setUserInfo({ name: 'user2', email: 'user2@example.com' })
    expect(userStore.userInfo.name).toBe('user2')
    expect(userStore.isLoggedIn).toBe(true)
  })
})
