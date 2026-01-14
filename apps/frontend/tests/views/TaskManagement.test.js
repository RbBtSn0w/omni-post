import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskManagement from '@/views/TaskManagement.vue'

// 静态mock stores，避免动态导入问题
const mockTaskStore = {
  tasks: [],
  recentTasks: [],
  taskStats: {
    total: 0,
    completed: 0,
    inProgress: 0,
    failed: 0
  },
  taskTrend: {
    xAxis: [],
    series: []
  },
  dataExpiry: {
    expiryTime: 30 * 60 * 1000,
    lastFetchTime: null,
    isExpired: false
  },
  checkDataExpiry: vi.fn().mockReturnValue(false),
  setDataFetched: vi.fn(),
  setTasks: vi.fn(),
  addTask: vi.fn(),
  updateTask: vi.fn(),
  updateTaskProgress: vi.fn(),
  updateTaskStatus: vi.fn(),
  deleteTask: vi.fn(),
  deleteTasks: vi.fn(),
  clearCompletedTasks: vi.fn().mockReturnValue(0),
  getTaskById: vi.fn(),
  getTasksByStatus: vi.fn()
}

// 直接mock stores，避免Pinia版本兼容问题
vi.mock('@/stores/task', () => ({
  useTaskStore: vi.fn(() => mockTaskStore)
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
    confirm: vi.fn().mockResolvedValue(true)
  },
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
  ElCheckbox: { template: '<div class="el-checkbox"><slot></slot></div>' },
  ElCheckboxGroup: { template: '<div class="el-checkbox-group"><slot></slot></div>' },
  ElSwitch: { template: '<div class="el-switch"><slot></slot></div>' },
  ElTabs: { template: '<div class="el-tabs"><slot></slot></div>' },
  ElTabPane: { template: '<div class="el-tab-pane"><slot></slot></div>' }
}))

// 模拟Element Plus图标
vi.mock('@element-plus/icons-vue', () => ({
  // 只返回简单的空对象，避免模板渲染问题
  List: {},
  CircleCheckFilled: {},
  CircleCloseFilled: {},
  Loading: {},
  Refresh: {},
  Delete: {},
  InfoFilled: {},
  Search: {},
  VideoPlay: {},
  VideoPause: {}
}))

describe('TaskManagement Component', () => {
  let wrapper
  
  // 测试数据
  const mockTasks = [
    {
      id: 'test-task-1',
      title: '任务1',
      selectedPlatforms: [1],
      platformNames: ['小红书'],
      status: 'completed',
      statusText: '已完成',
      progress: 100,
      priority: 1,
      priorityText: '正常',
      createdAt: '2023-10-01T10:00:00Z',
      updatedAt: '2023-10-01T10:30:00Z',
      fileList: [{ name: 'test1.mp4' }],
      selectedAccounts: [1],
      selectedTopics: ['测试', '任务']
    },
    {
      id: 'test-task-2',
      title: '任务2',
      selectedPlatforms: [2],
      platformNames: ['视频号'],
      status: 'processing',
      statusText: '处理中',
      progress: 50,
      priority: 2,
      priorityText: '高',
      createdAt: '2023-10-02T10:00:00Z',
      updatedAt: '2023-10-02T10:15:00Z',
      fileList: [{ name: 'test2.mp4' }],
      selectedAccounts: [2],
      selectedTopics: ['测试', '任务2']
    },
    {
      id: 'test-task-3',
      title: '任务3',
      selectedPlatforms: [3],
      platformNames: ['抖音'],
      status: 'failed',
      statusText: '已失败',
      progress: 0,
      priority: 0,
      priorityText: '低',
      createdAt: '2023-10-03T10:00:00Z',
      updatedAt: '2023-10-03T10:05:00Z',
      fileList: [{ name: 'test3.mp4' }],
      selectedAccounts: [3],
      selectedTopics: ['测试', '任务3']
    }
  ]
  
  beforeEach(() => {
    // 重置模拟
    vi.clearAllMocks()
    
    // 更新mockTaskStore的数据
    mockTaskStore.tasks = mockTasks
    mockTaskStore.recentTasks = mockTasks.slice(0, 2)
    mockTaskStore.taskStats = {
      total: 3,
      completed: 1,
      inProgress: 1,
      failed: 1
    }
    mockTaskStore.clearCompletedTasks.mockReturnValue(1)
    mockTaskStore.getTaskById.mockImplementation((id) => mockTasks.find(task => task.id === id))
    mockTaskStore.getTasksByStatus.mockImplementation((status) => mockTasks.filter(task => task.status === status))
    
    // 挂载组件，使用简化的配置
    try {
      wrapper = mount(TaskManagement, {
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
