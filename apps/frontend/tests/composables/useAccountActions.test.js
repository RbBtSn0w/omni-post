import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Use vi.hoisted for mocks that need to be referenced in factories
const mocks = vi.hoisted(() => ({
    dataCache: {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn()
    },
    accountApi: {
        getAccounts: vi.fn(),
        getValidAccounts: vi.fn(),
        deleteAccount: vi.fn()
    }
}))

vi.mock('@/utils/dataCache', () => ({ default: mocks.dataCache }))
vi.mock('@/api/account', () => ({ accountApi: mocks.accountApi }))

vi.mock('element-plus', () => ({
    ElMessage: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
        closeAll: vi.fn()
    },
    ElMessageBox: {
        confirm: vi.fn(() => Promise.resolve())
    }
}))

const mockAccountStore = {
    accounts: [],
    refreshStatus: { isRefreshing: false },
    validationState: { lastValidationTime: null, validationCooldown: 5 * 60 * 1000 },
    checkDataExpiry: vi.fn(),
    startRefresh: vi.fn(),
    endRefresh: vi.fn(),
    setAccounts: vi.fn(),
    updateAccountStatus: vi.fn(),
    updateAccount: vi.fn(),
    resetRetryCount: vi.fn(),
    incrementRetryCount: vi.fn(),
    getAccountsForRetry: vi.fn(),
    deleteAccount: vi.fn(),
    needsValidation: vi.fn(() => true),
    setValidationCompleted: vi.fn(),
    setAllAccountsRefreshing: vi.fn(),
    MAX_RETRY_COUNT: 3
}

const mockAppStore = {
    isFirstTimeAccountManagement: true,
    setAccountManagementVisited: vi.fn()
}

vi.mock('@/stores/account', () => ({ useAccountStore: () => mockAccountStore }))
vi.mock('@/stores/app', () => ({ useAppStore: () => mockAppStore }))

import { useAccountActions } from '@/composables/useAccountActions'
import { ElMessageBox } from 'element-plus'

describe('useAccountActions', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
        vi.useFakeTimers()
        // Reset singleton state (best effort)
        const { lastRefreshTime } = useAccountActions()
        lastRefreshTime.value = 0
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('handleDelete should show confirmation and delete account', async () => {
        const { handleDelete } = useAccountActions()

        mocks.accountApi.deleteAccount.mockResolvedValue({ code: 200 })

        await handleDelete({ id: 123, name: 'Test' })

        expect(ElMessageBox.confirm).toHaveBeenCalled()
        expect(mocks.accountApi.deleteAccount).toHaveBeenCalledWith(123)
        expect(mockAccountStore.deleteAccount).toHaveBeenCalledWith(123)
    })

    it('refreshExceptionAccounts should retry eligible accounts', async () => {
        const { refreshExceptionAccounts } = useAccountActions()

        mockAccountStore.getAccountsForRetry.mockReturnValue([{ id: 1, name: 'RetryMe' }])
        mocks.accountApi.getValidAccounts.mockResolvedValue({
            code: 200,
            data: [[1, 'test', 'pwd', 'path', 1]] // 1 = Normal status
        })

        const promise = refreshExceptionAccounts()
        await promise

        // Expect status update to '验证中' (without isRefreshing=true according to implementation)
        expect(mockAccountStore.updateAccountStatus).toHaveBeenCalledWith(1, '验证中')
        expect(mocks.accountApi.getValidAccounts).toHaveBeenCalledWith(1)
        expect(mockAccountStore.resetRetryCount).toHaveBeenCalledWith(1)
    })

    // ========== forceRefreshAccounts Tests (Critical for SSE login success) ==========
    describe('forceRefreshAccounts', () => {
        it('should clear cache before fetching', async () => {
            const { forceRefreshAccounts } = useAccountActions()
            mocks.accountApi.getValidAccounts.mockResolvedValue({ code: 200, data: [] })

            await forceRefreshAccounts()

            expect(mocks.dataCache.delete).toHaveBeenCalledWith('/account-management/valid')
            expect(mocks.dataCache.delete).toHaveBeenCalledWith('/account-management/quick')
            expect(mockAccountStore.setAllAccountsRefreshing).toHaveBeenCalledWith(true)
        })

        it('should NOT check data expiry (bypass cache logic)', async () => {
            const { forceRefreshAccounts } = useAccountActions()
            mocks.accountApi.getValidAccounts.mockResolvedValue({ code: 200, data: [] })

            await forceRefreshAccounts()

            // Should NOT call checkDataExpiry - this is the key difference from fetchAccounts
            expect(mockAccountStore.checkDataExpiry).not.toHaveBeenCalled()
        })

        it('should return success=true on API success', async () => {
            const { forceRefreshAccounts } = useAccountActions()
            mocks.accountApi.getValidAccounts.mockResolvedValue({
                code: 200,
                data: [[1, 1, 'path', 'user', 1]]
            })

            const result = await forceRefreshAccounts()

            expect(result.success).toBe(true)
            expect(mockAccountStore.setAccounts).toHaveBeenCalled()
        })

        it('should return success=false on API error', async () => {
            const { forceRefreshAccounts } = useAccountActions()
            mocks.accountApi.getValidAccounts.mockRejectedValue(new Error('Network error'))

            const result = await forceRefreshAccounts()

            expect(result.success).toBe(false)
            expect(result.error).toBe('Network error')
        })

        it('should return success=false on non-200 code', async () => {
            const { forceRefreshAccounts } = useAccountActions()
            mocks.accountApi.getValidAccounts.mockResolvedValue({ code: 500, data: null })

            const result = await forceRefreshAccounts()

            expect(result.success).toBe(false)
            expect(result.error).toBe('API returned non-200')
        })

        it('should call endRefresh even on error', async () => {
            const { forceRefreshAccounts } = useAccountActions()
            mocks.accountApi.getValidAccounts.mockRejectedValue(new Error('fail'))

            await forceRefreshAccounts()

            expect(mockAccountStore.endRefresh).toHaveBeenCalled()
        })
    })

    // ========== fetchAccountsQuick Tests ==========
    describe('fetchAccountsQuick', () => {
        it('should use cached data if available and skip API call', async () => {
            const { fetchAccountsQuick, lastRefreshTime } = useAccountActions()
            lastRefreshTime.value = 0 // Reset throttle

            const cachedData = [[1, 1, 'path', 'user', 1]]
            mocks.dataCache.get.mockReturnValue(cachedData)

            await fetchAccountsQuick()

            expect(mocks.accountApi.getAccounts).not.toHaveBeenCalled()
            expect(mockAccountStore.setAccounts).toHaveBeenCalled()
        })

        it('should fetch from API if no cache exists', async () => {
            const { fetchAccountsQuick, lastRefreshTime } = useAccountActions()
            lastRefreshTime.value = 0

            mocks.dataCache.get.mockReturnValue(null)
            mocks.accountApi.getAccounts.mockResolvedValue({
                code: 200,
                data: [[1, 1, 'path', 'user', 1]]
            })

            await fetchAccountsQuick()

            expect(mocks.accountApi.getAccounts).toHaveBeenCalled()
        })

        it('should set status to 验证中 for all accounts', async () => {
            const { fetchAccountsQuick, lastRefreshTime } = useAccountActions()
            lastRefreshTime.value = 0

            mocks.dataCache.get.mockReturnValue(null)
            mocks.accountApi.getAccounts.mockResolvedValue({
                code: 200,
                data: [[1, 1, 'path', 'user', 1]]
            })

            await fetchAccountsQuick()

            // Check that setAccounts was called with status = '验证中'
            const callArgs = mockAccountStore.setAccounts.mock.calls[0][0]
            expect(callArgs[0][4]).toBe('验证中')
        })
    })
})

