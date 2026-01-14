import { describe, it, expect, vi, beforeEach } from 'vitest'
import dataCache from '@/utils/dataCache'

describe('dataCache.js', () => {
  beforeEach(() => {
    // 清除所有缓存，确保测试环境干净
    dataCache.clear()
  })

  it('should initialize correctly', () => {
    expect(dataCache).toBeDefined()
  })

  it('should generate correct cache key', () => {
    // 测试基本键生成
    const key1 = dataCache.generateKey('test-key')
    expect(key1).toBe('sau_data_cache_test-key')
    
    // 测试带参数的键生成
    const params = { page: 1, limit: 10 }
    const key2 = dataCache.generateKey('test-key', params)
    expect(key2).toBe(`sau_data_cache_test-key_${JSON.stringify(params)}`)
  })

  it('should set and get cache correctly', () => {
    const testData = { id: 1, name: 'test' }
    
    // 设置缓存
    dataCache.set('test-key', testData)
    
    // 获取缓存
    const cachedData = dataCache.get('test-key')
    expect(cachedData).toEqual(testData)
    
    // 测试带参数的缓存
    dataCache.set('test-key-with-params', testData, undefined, { param1: 'value1' })
    const cachedDataWithParams = dataCache.get('test-key-with-params', { param1: 'value1' })
    expect(cachedDataWithParams).toEqual(testData)
  })

  it('should handle expired cache correctly', () => {
    const testData = { id: 1, name: 'test' }
    
    // 设置一个非常短的缓存时间（1毫秒）
    dataCache.set('expired-key', testData, 1)
    
    // 立即获取，应该能获取到
    let cachedData = dataCache.get('expired-key')
    expect(cachedData).toEqual(testData)
    
    // 等待2毫秒，让缓存过期
    vi.useFakeTimers()
    vi.advanceTimersByTime(2)
    
    // 现在获取，应该返回null
    cachedData = dataCache.get('expired-key')
    expect(cachedData).toBeNull()
    
    vi.useRealTimers()
  })

  it('should delete cache correctly', () => {
    const testData = { id: 1, name: 'test' }
    
    // 设置缓存
    dataCache.set('delete-test', testData)
    
    // 获取缓存，确保存在
    let cachedData = dataCache.get('delete-test')
    expect(cachedData).toEqual(testData)
    
    // 删除缓存
    dataCache.delete('delete-test')
    
    // 再次获取，应该返回null
    cachedData = dataCache.get('delete-test')
    expect(cachedData).toBeNull()
    
    // 测试删除带参数的缓存
    dataCache.set('delete-test-with-params', testData, undefined, { param1: 'value1' })
    dataCache.delete('delete-test-with-params', { param1: 'value1' })
    expect(dataCache.get('delete-test-with-params', { param1: 'value1' })).toBeNull()
  })

  it('should clear all cache correctly', () => {
    // 设置多个缓存
    dataCache.set('cache1', { id: 1 })
    dataCache.set('cache2', { id: 2 })
    dataCache.set('cache3', { id: 3 })
    
    // 确保缓存存在
    expect(dataCache.get('cache1')).toEqual({ id: 1 })
    expect(dataCache.get('cache2')).toEqual({ id: 2 })
    expect(dataCache.get('cache3')).toEqual({ id: 3 })
    
    // 清除所有缓存
    dataCache.clear()
    
    // 所有缓存应该都被清除
    expect(dataCache.get('cache1')).toBeNull()
    expect(dataCache.get('cache2')).toBeNull()
    expect(dataCache.get('cache3')).toBeNull()
  })

  it('should clear page cache correctly', () => {
    // 设置不同页面的缓存
    dataCache.set('/home', { page: 'home' })
    dataCache.set('/account-management', { page: 'account' })
    dataCache.set('/account-management', { page: 'account', type: 'detail' }, undefined, { id: 1 })
    dataCache.set('/publish-center', { page: 'publish' })
    
    // 清除指定页面的缓存
    dataCache.clearPageCache('/account-management')
    
    // 检查结果
    expect(dataCache.get('/home')).toEqual({ page: 'home' }) // 应该保留
    expect(dataCache.get('/account-management')).toBeNull() // 应该被清除
    expect(dataCache.get('/account-management', { id: 1 })).toBeNull() // 应该被清除
    expect(dataCache.get('/publish-center')).toEqual({ page: 'publish' }) // 应该保留
  })

  it('should preload page data correctly', async () => {
    const testData = { id: 1, name: 'test' }
    const fetchFn = vi.fn().mockResolvedValue(testData)
    
    // 预加载数据
    const data = await dataCache.preloadPageData('/test-page', fetchFn, { param1: 'value1' })
    
    expect(data).toEqual(testData)
    expect(fetchFn).toHaveBeenCalledWith({ param1: 'value1' })
    
    // 从缓存中获取，应该能获取到
    const cachedData = dataCache.get('/test-page', { param1: 'value1' })
    expect(cachedData).toEqual(testData)
  })

  it('should handle getOrLoad correctly', async () => {
    const testData = { id: 1, name: 'test' }
    const fetchFn = vi.fn().mockResolvedValue(testData)
    
    // 第一次调用，应该调用fetchFn
    let data = await dataCache.getOrLoad('test-get-or-load', fetchFn, { param1: 'value1' })
    expect(data).toEqual(testData)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    
    // 第二次调用，应该从缓存获取，不调用fetchFn
    data = await dataCache.getOrLoad('test-get-or-load', fetchFn, { param1: 'value1' })
    expect(data).toEqual(testData)
    expect(fetchFn).toHaveBeenCalledTimes(1) // 仍然是1次
    
    // 清除缓存后调用，应该再次调用fetchFn
    dataCache.delete('test-get-or-load', { param1: 'value1' })
    data = await dataCache.getOrLoad('test-get-or-load', fetchFn, { param1: 'value1' })
    expect(data).toEqual(testData)
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('should handle fetch error in getOrLoad correctly', async () => {
    const error = new Error('Fetch failed')
    const fetchFn = vi.fn().mockRejectedValue(error)
    
    // 调用getOrLoad，应该抛出错误
    await expect(dataCache.getOrLoad('test-error', fetchFn)).rejects.toThrow('Fetch failed')
  })

  it('should get correct cache status', () => {
    // 测试不存在的缓存
    let status = dataCache.getCacheStatus('non-existent-key')
    expect(status).toEqual({ exists: false, isExpired: false, lastUpdated: null })
    
    // 设置缓存并测试状态
    dataCache.set('test-status', { id: 1 })
    status = dataCache.getCacheStatus('test-status')
    expect(status.exists).toBe(true)
    expect(status.isExpired).toBe(false)
    expect(status.lastUpdated).not.toBeNull()
    
    // 测试过期缓存的状态
    dataCache.set('test-expired-status', { id: 1 }, 1)
    vi.useFakeTimers()
    vi.advanceTimersByTime(2)
    status = dataCache.getCacheStatus('test-expired-status')
    expect(status.exists).toBe(true) // 还没被清除，所以exists是true
    expect(status.isExpired).toBe(true) // 但已经过期
    vi.useRealTimers()
  })

  it('should handle preload with error correctly', async () => {
    const error = new Error('Preload failed')
    const fetchFn = vi.fn().mockRejectedValue(error)
    
    // 预加载失败，应该返回null，而不是抛出错误
    const data = await dataCache.preloadPageData('/error-page', fetchFn)
    expect(data).toBeNull()
  })
})
