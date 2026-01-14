import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MaterialManagement from '@/views/MaterialManagement.vue'
import { useAppStore } from '@/stores/app'
import { materialApi } from '@/api/material'

// 简化Mock依赖，只模拟必要的部分
vi.mock('@/stores/app', () => ({
  useAppStore: vi.fn(() => ({
    materials: [],
    setMaterials: vi.fn(),
    removeMaterial: vi.fn()
  }))
}))

vi.mock('@/api/material', () => ({
  materialApi: {
    getAllMaterials: vi.fn().mockResolvedValue({
      code: 200,
      data: []
    }),
    uploadMaterial: vi.fn().mockResolvedValue({
      code: 200,
      msg: 'File uploaded successfully',
      data: {}
    }),
    deleteMaterial: vi.fn().mockResolvedValue({
      code: 200,
      msg: 'File deleted successfully'
    }),
    getMaterialPreviewUrl: vi.fn().mockReturnValue('http://example.com/preview')
  }
}))

// 完全模拟element-plus，避免插件配置问题
vi.mock('element-plus', () => ({
  // 只模拟组件内部使用的API，不模拟插件
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn()
  },
  // 模拟所有Element Plus组件
  ElCard: { template: '<div class="el-card"><slot></slot></div>' },
  ElButton: { template: '<button class="el-button"><slot></slot></button>' },
  ElIcon: { template: '<span class="el-icon"><slot></slot></span>' },
  ElForm: { template: '<form class="el-form"><slot></slot></form>' },
  ElFormItem: { template: '<div class="el-form-item"><slot></slot></div>' },
  ElInput: { template: '<div class="el-input"><slot></slot></div>' },
  ElUpload: { template: '<div class="el-upload"><slot></slot></div>' },
  ElTable: { template: '<div class="el-table"><slot></slot></div>' },
  ElTableColumn: { template: '<div class="el-table-column"><slot></slot></div>' },
  ElDialog: { template: '<div class="el-dialog"><slot></slot></div>' },
  ElPagination: { template: '<div class="el-pagination"></div>' }
}))

// 模拟Element Plus图标
vi.mock('@element-plus/icons-vue', () => ({
  // 只返回简单的空对象，避免模板渲染问题
  Upload: {},
  Delete: {},
  Eye: {},
  Search: {}
}))

describe('MaterialManagement.vue', () => {
  let wrapper
  
  beforeEach(() => {
    // 重置mock
    vi.clearAllMocks()
    
    // 模拟appStore
    const mockAppStore = {
      materials: [],
      setMaterials: vi.fn(),
      removeMaterial: vi.fn()
    }
    useAppStore.mockReturnValue(mockAppStore)
    
    // 模拟materialApi
    materialApi.getAllMaterials.mockResolvedValue({
      code: 200,
      data: []
    })
    
    // 挂载组件，使用最基本的配置
    try {
      wrapper = mount(MaterialManagement, {
        global: {
          stubs: {
            // 模拟所有Element Plus组件
            ElCard: { template: '<div class="el-card"><slot></slot></div>' },
            ElButton: { template: '<button class="el-button"><slot></slot></button>' },
            ElIcon: { template: '<span class="el-icon"><slot></slot></span>' },
            ElForm: { template: '<form class="el-form"><slot></slot></form>' },
            ElFormItem: { template: '<div class="el-form-item"><slot></slot></div>' },
            ElInput: { template: '<div class="el-input"><slot></slot></div>' },
            ElUpload: { template: '<div class="el-upload"><slot></slot></div>' },
            ElTable: { template: '<div class="el-table"><slot></slot></div>' },
            ElTableColumn: { template: '<div class="el-table-column"><slot></slot></div>' },
            ElDialog: { template: '<div class="el-dialog"><slot></slot></div>' },
            ElPagination: { template: '<div class="el-pagination"></div>' },
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
