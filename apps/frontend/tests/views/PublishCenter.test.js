import PublishCenter from '@/views/PublishCenter.vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// 简化Mock依赖，只模拟必要的部分
vi.mock('@/stores/app', () => ({
  useAppStore: vi.fn(() => ({
    materials: []
  }))
}))

vi.mock('@/stores/account', () => ({
  useAccountStore: vi.fn(() => ({
    accounts: []
  }))
}))

vi.mock('@/api/material', () => ({
  materialApi: {
    getMaterialPreviewUrl: vi.fn().mockReturnValue('http://example.com/preview')
  }
}))

vi.mock('@/api/account', () => ({
  accountApi: {
    getValidAccounts: vi.fn().mockResolvedValue({
      code: 200,
      data: []
    })
  }
}))

vi.mock('@/stores/group', () => ({
  useGroupStore: vi.fn(() => ({
    groups: [],
    fetchGroups: vi.fn().mockResolvedValue()
  }))
}))

vi.mock('@/api/group', () => ({
  groupApi: {
    getGroupAccounts: vi.fn().mockResolvedValue({
      code: 200,
      data: []
    })
  }
}))

// 完全模拟element-plus，避免任何插件配置问题
vi.mock('element-plus', () => ({
  // 只模拟组件内部使用的API，不模拟插件
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}))

// 模拟Element Plus图标
vi.mock('@element-plus/icons-vue', () => ({
  Upload: { template: '<i />' },
  Plus: { template: '<i />' },
  Close: { template: '<i />' },
  Folder: { template: '<i />' },
  Management: { template: '<i />' },
  Delete: { template: '<i />' },
  InfoFilled: { template: '<i />' },
  Search: { template: '<i />' },
  Grid: { template: '<i />' },
  ArrowDown: { template: '<i />' },
  VideoPlay: { template: '<i />' }
}))

vi.mock('@/stores/app', () => ({
  useAppStore: vi.fn(() => ({
    materials: [],
    setMaterials: vi.fn()
  }))
}))

vi.mock('@/stores/task', () => ({
  useTaskStore: vi.fn(() => ({
    tasks: [],
    addTask: vi.fn()
  }))
}))

vi.mock('@/stores/platform', () => ({
  usePlatformStore: vi.fn(() => ({
    platforms: [],
    fetchPlatforms: vi.fn().mockResolvedValue()
  }))
}))

vi.mock('@/api/material', () => ({
  materialApi: {
    getAllMaterials: vi.fn().mockResolvedValue({ code: 200, data: [] }),
    getMaterialPreviewUrl: vi.fn().mockReturnValue('http://example.com/preview')
  }
}))

vi.mock('@/core/config', () => ({
  API_BASE_URL: 'http://localhost:8000',
  MAX_UPLOAD_SIZE: 500 * 1024 * 1024,
  MAX_UPLOAD_SIZE_MB: 500
}))

vi.mock('@/core/platformConstants', () => ({
  getPlatformName: vi.fn((id) => ({ 1: '小红书', 2: '视频号', 3: '抖音', 4: '快手' })[id] || ''),
  ALL_PLATFORM_NAMES: { 1: '小红书', 2: '视频号', 3: '抖音', 4: '快手' },
  getPlatformTagType: vi.fn(() => '')
}))

vi.mock('@omni-post/shared', () => ({
  PlatformType: { XIAOHONGSHU: 1, WX_CHANNELS: 2, DOUYIN: 3, KUAISHOU: 4, BILIBILI: 5 }
}))

describe('PublishCenter.vue', () => {
  let wrapper

  beforeEach(() => {
    // 重置mock
    vi.clearAllMocks()

    // 挂载组件，使用最基本的配置
    wrapper = mount(PublishCenter, {
      global: {
        stubs: {
          // stub所有Element Plus组件 - 使用true避免scoped slot渲染问题
          ElCard: true,
          ElButton: true,
          ElIcon: true,
          ElForm: true,
          ElFormItem: true,
          ElSelect: true,
          ElOption: true,
          ElTag: true,
          ElProgress: true,
          ElDialog: true,
          ElDescriptions: true,
          ElDescriptionsItem: true,
          ElPagination: true,
          ElTable: true,
          ElTableColumn: true,
          ElUpload: true,
          ElCheckbox: true,
          ElCheckboxGroup: true,
          ElSwitch: true,
          ElTabs: true,
          ElTabPane: true,
          Transition: false,
          TransitionGroup: false
        }
      }
    })
  })

  it('should be able to mount the component', () => {
    // 只测试组件是否能挂载，不测试具体内容
    expect(wrapper).not.toBeNull()
  })
})

// 独立的账号过滤逻辑测试 (不依赖组件挂载)
describe('Account-Platform Filtering Logic', () => {
  const platformMap = { 1: '小红书', 2: '视频号', 3: '抖音', 4: '快手' }

  // 模拟账号数据
  const mockAccounts = [
    { id: 'acc-1', platform: '抖音', filePath: 'douyin-1.json' },
    { id: 'acc-2', platform: '抖音', filePath: 'douyin-2.json' },
    { id: 'acc-3', platform: '快手', filePath: 'kuaishou-1.json' },
    { id: 'acc-4', platform: '视频号', filePath: 'wx_channels-1.json' }
  ]

  // 模拟过滤函数 (与 PublishCenter.vue 中的逻辑一致)
  const filterAccountsByPlatform = (selectedAccounts, platform, accounts) => {
    return selectedAccounts
      .filter(accountId => {
        const account = accounts.find(acc => acc.id === accountId)
        return account && account.platform === platformMap[platform]
      })
      .map(accountId => {
        const account = accounts.find(acc => acc.id === accountId)
        return account ? account.filePath : accountId
      })
  }

  it('should only return accounts matching the target platform', () => {
    const selectedAccounts = ['acc-1', 'acc-2', 'acc-3'] // 2 抖音 + 1 快手

    // 发布到抖音时，应该只返回抖音账号
    const douyinAccounts = filterAccountsByPlatform(selectedAccounts, 3, mockAccounts)
    expect(douyinAccounts).toEqual(['douyin-1.json', 'douyin-2.json'])

    // 发布到快手时，应该只返回快手账号
    const kuaishouAccounts = filterAccountsByPlatform(selectedAccounts, 4, mockAccounts)
    expect(kuaishouAccounts).toEqual(['kuaishou-1.json'])
  })

  it('should return empty array when no accounts match the platform', () => {
    const selectedAccounts = ['acc-1', 'acc-2'] // 只有抖音账号

    // 发布到快手时，应该返回空数组
    const kuaishouAccounts = filterAccountsByPlatform(selectedAccounts, 4, mockAccounts)
    expect(kuaishouAccounts).toEqual([])
  })

  it('should handle mixed platform accounts correctly', () => {
    const selectedAccounts = ['acc-1', 'acc-3', 'acc-4'] // 抖音 + 快手 + 视频号

    // 验证每个平台只获取对应的账号
    expect(filterAccountsByPlatform(selectedAccounts, 3, mockAccounts)).toEqual(['douyin-1.json'])
    expect(filterAccountsByPlatform(selectedAccounts, 4, mockAccounts)).toEqual(['kuaishou-1.json'])
    expect(filterAccountsByPlatform(selectedAccounts, 2, mockAccounts)).toEqual(['wx_channels-1.json'])
    expect(filterAccountsByPlatform(selectedAccounts, 1, mockAccounts)).toEqual([]) // 没有小红书账号
  })
})
