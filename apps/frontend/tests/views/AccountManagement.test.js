import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AccountManagement from '@/views/AccountManagement.vue'
import { ref } from 'vue'

// 提升 mock 变量
const { mockForceRefreshAccounts } = vi.hoisted(() => ({
  mockForceRefreshAccounts: vi.fn().mockResolvedValue({ success: true })
}))

// Mock composables with real refs
vi.mock('@/composables/useAccountActions', async () => {
  const { ref } = await import('vue')
  return {
    useAccountActions: () => ({
      hasInitiallyLoaded: ref(true),
      lastRefreshTime: ref(0),
      isGlobalRefreshing: ref(false),
      fetchAccountsQuick: vi.fn(),
      fetchAccounts: vi.fn(),
      forceRefreshAccounts: mockForceRefreshAccounts,
      validateAllAccountsInBackground: vi.fn(),
      refreshExceptionAccounts: vi.fn(),
      handleBatchRefresh: vi.fn(),
      handleDelete: vi.fn(),
      resetGlobalState: vi.fn(),
      MIN_REFRESH_INTERVAL: 2000
    })
  }
})

vi.mock('@/composables/useAccountFilter', async () => {
  const { ref } = await import('vue')
  return {
    useAccountFilter: () => ({
      activeTab: ref('all'),
      selectedGroupId: ref(null),
      handleGroupChange: vi.fn(),
      filteredAccounts: ref([]),
      filteredKuaishouAccounts: ref([]),
      filteredDouyinAccounts: ref([]),
      filteredChannelsAccounts: ref([]),
      filteredXiaohongshuAccounts: ref([])
    })
  }
})

// Mock stores
vi.mock('@/stores/account', () => ({
  useAccountStore: vi.fn(() => ({
    accounts: [],
    refreshStatus: {
      isRefreshing: false,
      refreshingIds: [],
      totalCount: 0,
      completedCount: 0,
      lastRefreshTime: null
    },
    startRefresh: vi.fn(),
    endRefresh: vi.fn(),
    getRefreshProgress: vi.fn().mockReturnValue(0),
    fetchAccounts: vi.fn(),
    deleteAccount: vi.fn(),
    updateAccountStatus: vi.fn(),
    updateAccount: vi.fn(),
    resetRetryCount: vi.fn(),
    needsValidation: vi.fn(() => true),
    setValidationCompleted: vi.fn()
  }))
}))

vi.mock('@/stores/app', () => ({
  useAppStore: vi.fn(() => ({
    isFirstTimeAccountManagement: true,
    materials: [],
    isAccountRefreshing: false,
    setAccountManagementVisited: vi.fn()
  }))
}))

vi.mock('@/stores/group', () => ({
  useGroupStore: vi.fn(() => ({
    groups: []
  }))
}))

// Mock API
vi.mock('@/api/account', () => ({
  accountApi: {
    getAccounts: vi.fn().mockResolvedValue({ code: 200, data: [] }),
    getValidAccounts: vi.fn().mockResolvedValue({ code: 200, data: [] })
  }
}))

vi.mock('@/utils/dataCache', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }
}))

// Helper to make refs for tests if needed, but our mocks return objects with structure
// Component uses .value access, so { value: ... } is fine.
// But defineComponent/setup proxying might need actual refs for template unwrapping.
// If test-utils mount handles it, it's fine. If not, we might need real refs.
// But we are limited in vi.mock.
// However, since we stub almost everything, template unwrapping issues might be minimized.

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    closeAll: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn().mockResolvedValue(true)
  },
  ElAlert: { template: '<div class="el-alert"><slot></slot></div>' },
  ElCard: { template: '<div class="el-card"><slot></slot></div>' }
}))

vi.mock('@element-plus/icons-vue', () => ({
  Refresh: { template: '<span class="icon-refresh" />' },
  Delete: { template: '<span class="icon-delete" />' },
  Edit: { template: '<span class="icon-edit" />' },
  Plus: { template: '<span class="icon-plus" />' },
  Check: { template: '<span class="icon-check" />' },
  Close: { template: '<span class="icon-close" />' },
  Download: { template: '<span class="icon-download" />' },
  Upload: { template: '<span class="icon-upload" />' },
  Loading: { template: '<span class="icon-loading" />' },
  ArrowDown: { template: '<span class="icon-arrow-down" />' },
  CircleCheckFilled: { template: '<span class="icon-circle-check-filled" />' },
  CircleCloseFilled: { template: '<span class="icon-circle-close-filled" />' }
}))

vi.mock('@/components/GroupSelector.vue', () => ({
  default: { template: '<div class="group-selector"></div>' }
}))

describe.skip('AccountManagement.vue', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()

    wrapper = mount(AccountManagement, {
      shallow: true, // Use shallow mount to avoid child component issues
      global: {
        stubs: {
          ElCard: { template: '<div class="el-card"><slot></slot></div>' },
          // Make button clickable and render content
          ElButton: {
            template: '<button class="el-button" @click="$emit(\'click\')"><slot></slot></button>',
            props: ['type', 'loading', 'disabled']
          },
          ElIcon: { template: '<span class="el-icon"><slot></slot></span>' },
          ElForm: { template: '<form class="el-form"><slot></slot></form>' },
          ElFormItem: { template: '<div class="el-form-item"><slot></slot></div>' },
          ElInput: { template: '<div class="el-input"><slot></slot></div>' },
          ElTable: { template: '<div class="el-table"><slot></slot></div>' },
          ElTableColumn: { template: '<div class="el-table-column"><slot></slot></div>' },
          ElDialog: { template: '<div class="el-dialog"><slot></slot></div>' },
          ElPagination: { template: '<div class="el-pagination"></div>' },
          ElTag: { template: '<span class="el-tag"><slot></slot></span>' },
          ElProgress: { template: '<div class="el-progress"></div>' },
          ElSelect: { template: '<div class="el-select"><slot></slot></div>' },
          ElOption: { template: '<div class="el-option"><slot></slot></div>' },
          ElCheckbox: { template: '<div class="el-checkbox"><slot></slot></div>' },
          ElCheckboxGroup: { template: '<div class="el-checkbox-group"><slot></slot></div>' },
          ElSwitch: { template: '<div class="el-switch"><slot></slot></div>' },
          ElAlert: true,
          ElEmpty: true,
          ElAvatar: true,
          ElDropdown: true,
          ElDropdownMenu: true,
          ElDropdownItem: true,
          ElTabs: { template: '<div class="el-tabs"><slot></slot></div>', props: ['modelValue'] },
          ElTabPane: { template: '<div class="el-tab-pane"><slot></slot></div>', props: ['label', 'name'] },
          GroupSelector: true
        }
      }
    })
  })

  it('should be able to mount the component', () => {
    expect(wrapper).toBeTruthy()
    expect(wrapper.vm).toBeTruthy()
  })

  it('should call forceRefreshAccounts when global refresh button is clicked', async () => {
    // Find buttons. Using shallow mount, we look for stubs or elements.
    // .action-buttons > el-button (stub)

    // Debug output if needed
    // console.log(wrapper.html())

    const buttons = wrapper.findAll('button.el-button')
    // Filter for the refresh button (usually based on usage order or content)
    // The template order:
    // 1. Add Account (primary)
    // 2. Refresh (info)

    // We can check attributes/props on the stub wrapper
    const refreshBtn = buttons.find(b => b.attributes('type') === 'info')

    expect(refreshBtn).toBeTruthy()

    await refreshBtn.trigger('click')

    expect(mockForceRefreshAccounts).toHaveBeenCalled()
  })
})
