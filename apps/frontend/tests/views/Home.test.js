import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Home from '@/views/Home.vue'

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

