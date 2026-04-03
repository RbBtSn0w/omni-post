import Home from '@/views/Home.vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@element-plus/icons-vue', () => ({
  Lightning: { template: '<i />' },
  Star: { template: '<i />' },
  Setting: { template: '<i />' }
}))

describe('Home.vue', () => {
  it('should mount successfully', () => {
    // 简化测试，只验证组件能挂载
    const wrapper = mount(Home, {
      global: {
        stubs: {
          // 禁用所有子组件
          '*': true
        }
      }
    })
    expect(wrapper).toBeDefined()
  })
})

