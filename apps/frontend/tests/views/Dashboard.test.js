import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// 完全模拟vue-echarts库，避免在测试环境中执行真实的库代码
vi.mock('vue-echarts', () => ({
  default: {
    template: '<div class="v-chart-stub"></div>'
  }
}))

// 模拟Element Plus图标组件，避免样式问题
vi.mock('@element-plus/icons-vue', () => {
  const mockIcon = { template: '<span class="el-icon"></span>' }
  return {
    Refresh: mockIcon,
    User: mockIcon,
    Platform: mockIcon,
    List: mockIcon,
    Document: mockIcon
  }
})

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
