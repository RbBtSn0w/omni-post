import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

vi.mock('element-plus', () => {
    // Fix ElMessage mock to be a function with properties
    const ElMessageMock = vi.fn()
    ElMessageMock.success = vi.fn()
    ElMessageMock.error = vi.fn()
    ElMessageMock.warning = vi.fn()
    ElMessageMock.info = vi.fn()
    ElMessageMock.closeAll = vi.fn()

    return {
        ElMessage: ElMessageMock,
        ElMessageBox: {
            confirm: vi.fn(() => Promise.resolve())
        }
    }
})

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
import { ElMessage, ElMessageBox } from 'element-plus'

describe('useAccountActions', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
        vi.useFakeTimers()
        const date = new Date(2000, 1, 1, 13)
        vi.setSystemTime(date)

        // Reset singleton state (best effort)
        const { lastRefreshTime, isGlobalRefreshing, resetGlobalState } = useAccountActions()
        lastRefreshTime.value = 0
        isGlobalRefreshing.value = false
        resetGlobalState() // Ensure abort controller is reset

        // Reset store mock behavior
        mockAccountStore.accounts = []
        mockAccountStore.needsValidation.mockReturnValue(true)
        mockAccountStore.checkDataExpiry.mockReturnValue(true)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    // Existing Tests
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
            data: [[1, 'test', 'pwd', 'path', 1]]
        })

        await refreshExceptionAccounts()

        expect(mockAccountStore.updateAccountStatus).toHaveBeenCalledWith(1, '验证中')
        expect(mocks.accountApi.getValidAccounts).toHaveBeenCalledWith(1)
        expect(mockAccountStore.resetRetryCount).toHaveBeenCalledWith(1)
    })

    describe('forceRefreshAccounts', () => {
        it('should clear cache and force refresh', async () => {
            const { forceRefreshAccounts } = useAccountActions()
            mocks.accountApi.getValidAccounts.mockResolvedValue({ code: 200, data: [] })

            await forceRefreshAccounts()

            expect(mocks.dataCache.delete).toHaveBeenCalledWith('/account-management/valid')
            expect(mockAccountStore.setAllAccountsRefreshing).toHaveBeenCalledWith(true)
        })
    })

    describe('fetchAccountsQuick', () => {
        it('should use cached data if available', async () => {
            const { fetchAccountsQuick } = useAccountActions()
            mocks.dataCache.get.mockReturnValue([[1]])

            await fetchAccountsQuick()

            expect(mocks.accountApi.getAccounts).not.toHaveBeenCalled()
            expect(mockAccountStore.setAccounts).toHaveBeenCalled()
        })
    })

    // NEW TESTS

    describe('fetchAccounts', () => {
        it('should skip if data not expired and accounts exist', async () => {
            const { fetchAccounts } = useAccountActions()
            mockAccountStore.checkDataExpiry.mockReturnValue(false)
            mockAccountStore.accounts = [1]

            await fetchAccounts()
            vi.runAllTimers()

            expect(mocks.accountApi.getValidAccounts).not.toHaveBeenCalled()
        })

        it('should fetch if cache invalid', async () => {
            const { fetchAccounts } = useAccountActions()
            mockAccountStore.checkDataExpiry.mockReturnValue(true)
            mocks.accountApi.getValidAccounts.mockResolvedValue({ code: 200, data: [[1]] })

            const promise = fetchAccounts()
            vi.runAllTimers()
            await promise

            expect(mockAccountStore.startRefresh).toHaveBeenCalled()
            expect(mocks.accountApi.getValidAccounts).toHaveBeenCalled()
            expect(mockAccountStore.setAccounts).toHaveBeenCalled()
            expect(mockAccountStore.endRefresh).toHaveBeenCalled()
        })

        it('should throttle requests', async () => {
            const { fetchAccounts, lastRefreshTime } = useAccountActions()
            mockAccountStore.checkDataExpiry.mockReturnValue(true)

            // Set last refresh time to slightly in the future relative to T=0
            // but effectively making T=2000 (when debounce runs) still within the 2000ms window
            // If T=0, Debounce=2000. Run at T=2000.
            // We want (2000 - last) < 2000  => last > 0.
            // If we set last = 100. 1900 < 2000.
            lastRefreshTime.value = Date.now() + 100

            const promise = fetchAccounts()
            vi.advanceTimersByTime(2000)

            await promise

            expect(mocks.accountApi.getValidAccounts).not.toHaveBeenCalled()
        })
    })

    describe('validateAllAccountsInBackground', () => {
        it('should skip if validation not needed (cooldown)', async () => {
            const { validateAllAccountsInBackground } = useAccountActions()
            mockAccountStore.needsValidation.mockReturnValue(false)

            await validateAllAccountsInBackground()

            expect(mocks.accountApi.getValidAccounts).not.toHaveBeenCalled()
        })

        it('should validate accounts per platform in parallel', async () => {
            const { validateAllAccountsInBackground } = useAccountActions()
            mockAccountStore.accounts = [
                { id: 1, platform: 'douyin', name: 'D1' },
                { id: 2, platform: 'kuaishou', name: 'K1' },
                { id: 3, platform: 'douyin', name: 'D2' }
            ]
            mocks.accountApi.getValidAccounts.mockResolvedValue({ code: 200, data: [[1, 1, 1, 1, 1]] })

            await validateAllAccountsInBackground()

            // Should call for all 3 accounts
            expect(mocks.accountApi.getValidAccounts).toHaveBeenCalledTimes(3)
            // Should update status
            expect(mockAccountStore.updateAccountStatus).toHaveBeenCalledWith(1, '验证中', true)
            expect(mockAccountStore.setValidationCompleted).toHaveBeenCalled()
        })

        it('should handle cancellation correctly', async () => {
            const { validateAllAccountsInBackground, resetGlobalState } = useAccountActions()
            mockAccountStore.accounts = [{ id: 1, platform: 'test', name: 'T1' }]

            // Mock API to be slow
            mocks.accountApi.getValidAccounts.mockImplementation(async () => {
                resetGlobalState() // Cancel during request
                return { code: 200 }
            })

            await validateAllAccountsInBackground()

            // Should not set validation completed if cancelled
            expect(mockAccountStore.setValidationCompleted).not.toHaveBeenCalled()
        })

        it('should skip if global refreshing is active', async () => {
            const { validateAllAccountsInBackground, isGlobalRefreshing } = useAccountActions()
            isGlobalRefreshing.value = true

            await validateAllAccountsInBackground()

            expect(mocks.accountApi.getValidAccounts).not.toHaveBeenCalled()
        })

        it('should handle api failures gracefully', async () => {
            const { validateAllAccountsInBackground } = useAccountActions()
            mockAccountStore.accounts = [{ id: 1, platform: 'test', name: 'T1' }]
            mocks.accountApi.getValidAccounts.mockRejectedValue(new Error('Fail'))

            await validateAllAccountsInBackground()

            expect(mockAccountStore.updateAccountStatus).toHaveBeenCalledWith(1, '异常', false)
        })
    })

    describe('handleBatchRefresh', () => {
        it('should warn if no accounts selected', async () => {
            const { handleBatchRefresh } = useAccountActions()
            await handleBatchRefresh([])
            expect(ElMessage.warning).toHaveBeenCalledWith('请先选择要刷新的账号')
        })

        it('should refresh selected accounts', async () => {
            const { handleBatchRefresh } = useAccountActions()
            const selected = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
            mocks.accountApi.getValidAccounts.mockResolvedValue({ code: 200, data: [[1, 1, 1, 1, 1]] })

            await handleBatchRefresh(selected)

            expect(mocks.accountApi.getValidAccounts).toHaveBeenCalledTimes(2)
            expect(ElMessage.success).toHaveBeenCalled()
        })
    })
})
