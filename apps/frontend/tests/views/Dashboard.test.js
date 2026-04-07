import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

// 完全模拟vue-echarts库，避免在测试环境中执行真实的库代码
vi.mock('vue-echarts', () => ({
  default: {
    template: '<div class="v-chart-stub"></div>'
  }
}))

vi.mock('echarts/charts', () => ({
  BarChart: {},
  LineChart: {}
}))

vi.mock('echarts/components', () => ({
  GridComponent: {},
  LegendComponent: {},
  TitleComponent: {},
  TooltipComponent: {}
}))

vi.mock('echarts/core', () => ({
  use: vi.fn()
}))

vi.mock('echarts/renderers', () => ({
  CanvasRenderer: {}
}))

// 模拟Element Plus图标组件，避免样式问题
vi.mock('@element-plus/icons-vue', () => {
  const mockIcon = { template: '<span class="el-icon"></span>' }
  return {
    Refresh: mockIcon,
    User: mockIcon,
    Platform: mockIcon,
    List: mockIcon,
    Document: mockIcon,
    InfoFilled: mockIcon
  }
})

vi.mock('element-plus', () => ({
  ElMessage: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
  ElMessageBox: { confirm: vi.fn().mockResolvedValue(true) }
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

vi.mock('@/stores/account', () => ({
  useAccountStore: vi.fn(() => ({
    accounts: [],
    setAccounts: vi.fn(),
    fetchAccounts: vi.fn().mockResolvedValue(),
    checkDataExpiry: vi.fn().mockReturnValue(false)
  }))
}))

vi.mock('@/stores/task', () => ({
  useTaskStore: vi.fn(() => ({
    tasks: [],
    recentTasks: [],
    taskStats: { total: 0, completed: 0, inProgress: 0, failed: 0 },
    fetchTasks: vi.fn().mockResolvedValue(),
    checkDataExpiry: vi.fn().mockReturnValue(false)
  }))
}))

vi.mock('@/api/dashboard', () => ({
  dashboardApi: {
    getStats: vi.fn().mockResolvedValue({ code: 200, data: {} }),
    getRecentTasks: vi.fn().mockResolvedValue({ code: 200, data: [] })
  }
}))

vi.mock('@/api/account', () => ({
  accountApi: {
    getAllUsers: vi.fn().mockResolvedValue({ code: 200, data: [] })
  }
}))

vi.mock('@/utils/dataCache', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(() => false),
    clear: vi.fn()
  }
}))

vi.mock('@/core/platformConstants', () => ({
  PLATFORM_NAMES: { 1: '小红书', 2: '微信视频号', 3: '抖音', 4: '快手', 5: 'B站' },
  PlatformType: { XIAOHONGSHU: 1, WX_CHANNELS: 2, DOUYIN: 3, KUAISHOU: 4, BILIBILI: 5 },
  getPlatformTagType: vi.fn(() => '')
}))

describe('Dashboard.vue', () => {
  it('should mount successfully', async () => {
    // 动态导入Dashboard组件，确保mock在导入之前生效
    const { default: Dashboard } = await import('@/views/Dashboard.vue')

    // 简化测试，只验证组件能挂载
    const wrapper = mount(Dashboard, {
      global: {
        stubs: {
          // 为了简化测试，stub掉Element Plus组件
          'ElButton': true,
          'ElRow': true,
          'ElCol': true,
          'ElCard': true,
          'ElTag': true,
          'ElTooltip': true,
          'ElScrollbar': true
        }
      }
    })
    expect(wrapper).toBeDefined()
  })
})
