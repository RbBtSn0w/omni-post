// 数据缓存服务
// 用于缓存各个页面的数据，避免重复请求和placeholder数据停留问题

// 缓存配置
const CACHE_CONFIG = {
  // 默认缓存时长：5分钟
  DEFAULT_DURATION: 5 * 60 * 1000,
  // 缓存键前缀
  KEY_PREFIX: 'sau_data_cache_',
  // 需要缓存的页面路径
  CACHED_PAGES: [
    '/', // 首页
    '/account-management', // 账号管理
    '/video-resource-management', // 视频资源管理
    '/publish-center' // 发布中心
  ]
}

// 数据缓存类
class DataCache {
  constructor() {
    this.cache = new Map()
    this.init()
  }

  // 初始化缓存
  init() {
    // 可以从localStorage或其他持久化存储中恢复缓存
    // 这里暂时只使用内存缓存
  }

  // 生成缓存键
  generateKey(key, params = {}) {
    // 如果有参数，将参数序列化后添加到键中
    const paramsStr = Object.keys(params).length > 0 ? `_${JSON.stringify(params)}` : ''
    return `${CACHE_CONFIG.KEY_PREFIX}${key}${paramsStr}`
  }

  // 设置缓存
  set(key, data, duration = CACHE_CONFIG.DEFAULT_DURATION, params = {}) {
    const cacheKey = this.generateKey(key, params)
    const expiry = Date.now() + duration
    this.cache.set(cacheKey, {
      data,
      expiry,
      lastUpdated: Date.now()
    })
  }

  // 获取缓存
  get(key, params = {}) {
    const cacheKey = this.generateKey(key, params)
    const cachedItem = this.cache.get(cacheKey)

    if (!cachedItem) {
      return null
    }

    // 检查缓存是否过期
    if (Date.now() > cachedItem.expiry) {
      this.cache.delete(cacheKey)
      return null
    }

    return cachedItem.data
  }

  // 删除缓存
  delete(key, params = {}) {
    const cacheKey = this.generateKey(key, params)
    this.cache.delete(cacheKey)
  }

  // 清除所有缓存
  clear() {
    this.cache.clear()
  }

  // 清除指定页面的缓存
  clearPageCache(pagePath) {
    this.cache.forEach((value, key) => {
      if (key.startsWith(`${CACHE_CONFIG.KEY_PREFIX}${pagePath}`)) {
        this.cache.delete(key)
      }
    })
  }

  // 预加载页面数据
  async preloadPageData(pagePath, fetchFn, params = {}) {
    try {
      const data = await fetchFn(params)
      this.set(pagePath, data, CACHE_CONFIG.DEFAULT_DURATION, params)
      return data
    } catch (error) {
      console.error(`预加载页面 ${pagePath} 数据失败:`, error)
      return null
    }
  }

  // 获取或加载数据
  async getOrLoad(key, fetchFn, params = {}, duration = CACHE_CONFIG.DEFAULT_DURATION) {
    // 先尝试从缓存获取
    const cachedData = this.get(key, params)
    if (cachedData) {
      return cachedData
    }

    // 缓存不存在或已过期，从API获取
    try {
      const data = await fetchFn(params)
      this.set(key, data, duration, params)
      return data
    } catch (error) {
      console.error(`加载数据 ${key} 失败:`, error)
      throw error
    }
  }

  // 获取缓存状态
  getCacheStatus(key, params = {}) {
    const cacheKey = this.generateKey(key, params)
    const cachedItem = this.cache.get(cacheKey)

    if (!cachedItem) {
      return { exists: false, isExpired: false, lastUpdated: null }
    }

    const isExpired = Date.now() > cachedItem.expiry
    return {
      exists: true,
      isExpired,
      lastUpdated: cachedItem.lastUpdated
    }
  }
}

// 创建单例实例
const dataCache = new DataCache()

export default dataCache
