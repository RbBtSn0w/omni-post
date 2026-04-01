import AccountManagement from '@/views/AccountManagement.vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Keep global test-utils config from setup.js

// 提升 mock 变量
const { mockForceRefreshAccounts, mockHandleBatchRefresh, mockRefreshAccountsAfterMutation, mockAccountApi } = vi.hoisted(() => ({
  mockForceRefreshAccounts: vi.fn().mockResolvedValue({ success: true }),
  mockHandleBatchRefresh: vi.fn().mockResolvedValue({ success: true }),
  mockRefreshAccountsAfterMutation: vi.fn().mockResolvedValue({ success: true }),
  mockAccountApi: {
    getAccounts: vi.fn().mockResolvedValue({ code: 200, data: [] }),
    getValidAccounts: vi.fn().mockResolvedValue({ code: 200, data: [] }),
    updateAccount: vi.fn().mockResolvedValue({ code: 200 }),
    addAccount: vi.fn().mockResolvedValue({ code: 200 }),
    deleteAccount: vi.fn().mockResolvedValue({ code: 200 })
  }
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
      refreshAccountsAfterMutation: mockRefreshAccountsAfterMutation,
      validateAllAccountsInBackground: vi.fn(),
      refreshExceptionAccounts: vi.fn(),
      handleBatchRefresh: mockHandleBatchRefresh,
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
      filteredXiaohongshuAccounts: ref([]),
      filteredBilibiliAccounts: ref([])
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
  accountApi: mockAccountApi
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
vi.mock('element-plus', () => {
  const ElMessage = vi.fn()
  ElMessage.success = vi.fn()
  ElMessage.error = vi.fn()
  ElMessage.warning = vi.fn()
  ElMessage.info = vi.fn()
  ElMessage.closeAll = vi.fn()
  return {
    ElMessage,
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue(true)
    },
    ElAlert: { template: '<div class="el-alert"><slot></slot></div>' },
    ElCard: { template: '<div class="el-card"><slot></slot></div>' }
  }
})

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
  Setting: { template: '<span class="icon-setting" />' },
  CircleCheckFilled: { template: '<span class="icon-circle-check-filled" />' },
  CircleCloseFilled: { template: '<span class="icon-circle-close-filled" />' }
}))

vi.mock('@/stores/browser', () => ({
  useBrowserStore: vi.fn(() => ({
    profiles: [],
    loading: false,
    fetchProfiles: vi.fn(),
    deleteProfile: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn()
  }))
}))

vi.mock('@/stores/platform', () => ({
  usePlatformStore: vi.fn(() => ({
    allPlatforms: [],
    fetchExtensions: vi.fn().mockResolvedValue([])
  }))
}))

vi.mock('@/core/platformConstants', () => ({
  PlatformType: {}
}))

vi.mock('@/core/config', () => ({
  API_BASE_URL: 'http://localhost:8000'
}))

vi.mock('@/components/GroupSelector.vue', () => ({
  default: { template: '<div class="group-selector"></div>' }
}))

// Shared stubs for tests
const sharedStubs = {
  ElCard: { template: '<div class="el-card"><slot></slot></div>' },
  ElButton: {
    template: '<button class="el-button" @click="$emit(\'click\')"><slot></slot></button>',
    props: ['type', 'loading', 'disabled']
  },
  ElIcon: { template: '<span class="el-icon"><slot></slot></span>' },
  ElForm: {
    template: '<form class="el-form"><slot></slot></form>',
    methods: {
      validate(cb) { cb(true) }
    }
  },
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

// Shared directives mock (e.g. v-loading from Element Plus)
const sharedDirectives = {
  loading: { mounted() { }, updated() { }, unmounted() { } }
}

describe('AccountManagement.vue - Harden Refresh Flow', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(AccountManagement, {
      shallow: true,
      global: {
        stubs: sharedStubs,
        directives: sharedDirectives
      }
    })
  })

  afterEach(() => {
    if (wrapper && wrapper.vm) wrapper.unmount()
  })

  // Basic mount test (formerly skipped)
  it('should be able to mount the component', () => {
    expect(wrapper).toBeTruthy()
    expect(wrapper.vm).toBeTruthy()
  })

  // Global refresh button test (formerly skipped)
  it('should call forceRefreshAccounts when global refresh button is clicked', async () => {
    // The component exposes handleForceRefresh which calls forceRefreshAccounts
    await wrapper.vm.handleForceRefresh()
    expect(mockForceRefreshAccounts).toHaveBeenCalled()
  })

  // T026 [US3]: batch relogin path passes explicit selected scope
  it('batch relogin passes only exception accounts to handleBatchRefresh', async () => {
    const exceptionAccount = { id: 1, name: 'Exc1', platform: 'bilibili', status: '异常' }
    const normalAccount = { id: 2, name: 'Normal1', platform: 'douyin', status: '正常' }

    // Set selectedAccounts via component instance proxy
    wrapper.vm.selectedAccounts = [exceptionAccount, normalAccount]
    await wrapper.vm.$nextTick()

    // Call the batch relogin handler
    await wrapper.vm.handleBatchReLogin()

    // Should filter to only exception accounts and pass to handleBatchRefresh
    expect(mockHandleBatchRefresh).toHaveBeenCalledWith([exceptionAccount])
  })

  // T033 [US4]: cookie upload success path uses validated refresh completion semantics
  it('cookie upload success calls refreshAccountsAfterMutation with cookie_upload', async () => {
    // Mock global fetch for the upload request
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ code: 200 })
    })

    // Capture the file input element via appendChild spy
    let capturedInput = null
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => {
      if (el instanceof HTMLInputElement) capturedInput = el
    })
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => { })

    // Trigger the upload cookie handler
    wrapper.vm.handleUploadCookie({ id: 1, platform: 'bilibili' })

    // The handler creates an input element
    expect(capturedInput).not.toBeNull()
    expect(capturedInput.type).toBe('file')

    // Simulate file selection by invoking the onchange handler directly
    const mockFile = new File(['{}'], 'cookie.json', { type: 'application/json' })
    await capturedInput.onchange({ target: { files: [mockFile] } })
    await flushPromises()

    // Verify validated refresh was called with correct reason
    expect(mockRefreshAccountsAfterMutation).toHaveBeenCalledWith('cookie_upload')

    // Cleanup
    appendSpy.mockRestore()
    removeSpy.mockRestore()
    global.fetch = originalFetch
  })

  // T034 [US4]: account edit success path uses validated refresh completion semantics
  it('account edit success calls refreshAccountsAfterMutation with account_edit', async () => {
    // Set component state for edit mode
    wrapper.vm.dialogType = 'edit'
    Object.assign(wrapper.vm.accountForm, {
      id: 1,
      name: 'TestAccount',
      platform: 'bilibili',
      groupName: '',
      status: '正常'
    })

    // Configure accountApi.updateAccount to return success
    mockAccountApi.updateAccount.mockResolvedValue({ code: 200 })

    // Submit the form - the ElForm stub validates synchronously with true
    wrapper.vm.submitAccountForm()
    await flushPromises()

    // Verify validated refresh was called with correct reason
    expect(mockRefreshAccountsAfterMutation).toHaveBeenCalledWith('account_edit')
  })
})
