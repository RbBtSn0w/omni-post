import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import About from '@/views/About.vue'

describe('About.vue', () => {
  it('should mount successfully', () => {
    // 简化测试，只验证组件能挂载
    const wrapper = mount(About)
    expect(wrapper).toBeDefined()
  })
})
