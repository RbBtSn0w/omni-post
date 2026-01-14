import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/stores/app'
import { createPinia } from 'pinia'
import { setActivePinia } from 'pinia'

describe('useAppStore', () => {
  let appStore
  
  beforeEach(() => {
    // 创建一个新的pinia实例
    const pinia = createPinia()
    setActivePinia(pinia)
    // 重置store
    appStore = useAppStore()
  })

  it('should initialize with default values', () => {
    expect(appStore.isFirstTimeAccountManagement).toBe(true)
    expect(appStore.isFirstTimeMaterialManagement).toBe(true)
    expect(appStore.isAccountRefreshing).toBe(false)
    expect(appStore.materials).toEqual([])
  })

  it('should set account management visited correctly', () => {
    // 初始状态下，应该是第一次访问
    expect(appStore.isFirstTimeAccountManagement).toBe(true)
    
    // 设置为已访问
    appStore.setAccountManagementVisited()
    
    // 现在应该不是第一次访问了
    expect(appStore.isFirstTimeAccountManagement).toBe(false)
  })

  it('should set material management visited correctly', () => {
    // 初始状态下，应该是第一次访问
    expect(appStore.isFirstTimeMaterialManagement).toBe(true)
    
    // 设置为已访问
    appStore.setMaterialManagementVisited()
    
    // 现在应该不是第一次访问了
    expect(appStore.isFirstTimeMaterialManagement).toBe(false)
  })

  it('should reset visit status correctly', () => {
    // 先设置为已访问
    appStore.setAccountManagementVisited()
    appStore.setMaterialManagementVisited()
    
    expect(appStore.isFirstTimeAccountManagement).toBe(false)
    expect(appStore.isFirstTimeMaterialManagement).toBe(false)
    
    // 重置访问状态
    appStore.resetVisitStatus()
    
    expect(appStore.isFirstTimeAccountManagement).toBe(true)
    expect(appStore.isFirstTimeMaterialManagement).toBe(true)
  })

  it('should handle material list correctly', () => {
    // 添加素材
    appStore.addMaterial({ id: 1, name: '素材1', type: 'image' })
    appStore.addMaterial({ id: 2, name: '素材2', type: 'video' })
    
    expect(appStore.materials.length).toBe(2)
    expect(appStore.materials[0].name).toBe('素材1')
    expect(appStore.materials[1].name).toBe('素材2')
    
    // 设置整个素材列表
    appStore.setMaterials([
      { id: 3, name: '素材3', type: 'image' },
      { id: 4, name: '素材4', type: 'video' }
    ])
    
    expect(appStore.materials.length).toBe(2)
    expect(appStore.materials[0].name).toBe('素材3')
    expect(appStore.materials[1].name).toBe('素材4')
    
    // 删除素材
    appStore.removeMaterial(3)
    
    expect(appStore.materials.length).toBe(1)
    expect(appStore.materials[0].id).toBe(4)
    
    // 删除不存在的素材
    appStore.removeMaterial(999)
    
    // 素材数量应该不变
    expect(appStore.materials.length).toBe(1)
  })

  it('should set account refreshing status correctly', () => {
    // 初始状态下，不应该在刷新
    expect(appStore.isAccountRefreshing).toBe(false)
    
    // 设置为正在刷新
    appStore.setAccountRefreshing(true)
    
    expect(appStore.isAccountRefreshing).toBe(true)
    
    // 设置为刷新完成
    appStore.setAccountRefreshing(false)
    
    expect(appStore.isAccountRefreshing).toBe(false)
  })
})
