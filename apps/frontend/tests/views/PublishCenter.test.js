import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PublishCenter from '@/views/PublishCenter.vue'

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
  // 只返回简单的空对象，避免模板渲染问题
  Upload: {},
  Plus: {},
  Close: {},
  Folder: {},
  Management: {},
  Delete: {},
  InfoFilled: {},
  Search: {},
  Grid: {},
  ArrowDown: {}
}))

describe('PublishCenter.vue', () => {
  let wrapper

  beforeEach(() => {
    // 重置mock
    vi.clearAllMocks()

    // 挂载组件，使用最基本的配置
    try {
      wrapper = mount(PublishCenter, {
        global: {
          stubs: {
            // 模拟所有Element Plus组件
            ElCard: { template: '<div class="el-card"><slot></slot></div>' },
            ElButton: { template: '<button class="el-button"><slot></slot></button>' },
            ElIcon: { template: '<span class="el-icon"><slot></slot></span>' },
            ElForm: { template: '<form class="el-form"><slot></slot></form>' },
            ElFormItem: { template: '<div class="el-form-item"><slot></slot></div>' },
            ElSelect: { template: '<div class="el-select"><slot></slot></div>' },
            ElOption: { template: '<div class="el-option"><slot></slot></div>' },
            ElTag: { template: '<span class="el-tag"><slot></slot></span>' },
            ElProgress: { template: '<div class="el-progress"></div>' },
            ElDialog: { template: '<div class="el-dialog"><slot></slot></div>' },
            ElDescriptions: { template: '<div class="el-descriptions"><slot></slot></div>' },
            ElDescriptionsItem: { template: '<div class="el-descriptions-item"><slot></slot></div>' },
            ElPagination: { template: '<div class="el-pagination"></div>' },
            ElTable: { template: '<div class="el-table"><slot></slot></div>' },
            ElTableColumn: { template: '<div class="el-table-column"><slot></slot></div>' },
            ElUpload: { template: '<div class="el-upload"><slot></slot></div>' },
            ElCheckbox: { template: '<div class="el-checkbox"><slot></slot></div>' },
            ElCheckboxGroup: { template: '<div class="el-checkbox-group"><slot></slot></div>' },
            ElSwitch: { template: '<div class="el-switch"><slot></slot></div>' },
            ElTabs: { template: '<div class="el-tabs"><slot></slot></div>' },
            ElTabPane: { template: '<div class="el-tab-pane"><slot></slot></div>' },
            // 禁用所有transition组件
            Transition: false,
            TransitionGroup: false
          }
        }
      })
    } catch (error) {
      console.error('Component mount failed:', error)
      wrapper = null
    }
  })

  it('should be able to mount the component', () => {
    // 只测试组件是否能挂载，不测试具体内容
    expect(wrapper).not.toBeNull()
  })
})

