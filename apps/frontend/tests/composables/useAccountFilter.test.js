import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAccountFilter } from '@/composables/useAccountFilter'
import { createPinia, setActivePinia } from 'pinia'

// Mock store dependencies
const mockAccountStore = {
    accounts: [],
}

const mockGroupStore = {
    groups: [],
    currentGroup: null,
}

// Mock dependencies
vi.mock('@/stores/account', () => ({
    useAccountStore: () => mockAccountStore
}))

vi.mock('@/stores/group', () => ({
    useGroupStore: () => mockGroupStore
}))

describe('useAccountFilter', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        // Reset mocks
        mockAccountStore.accounts = []
        mockGroupStore.groups = []
        mockGroupStore.currentGroup = null
        vi.clearAllMocks()
    })

    it('should initialize with default values', () => {
        const { activeTab, selectedGroupId } = useAccountFilter()
        expect(activeTab.value).toBe('all')
        expect(selectedGroupId.value).toBe(null)
    })

    it('should filter accounts by group', () => {
        const { selectedGroupId, filteredAccounts } = useAccountFilter()

        mockAccountStore.accounts = [
            { id: 1, group_id: 101, name: 'A1' },
            { id: 2, group_id: 102, name: 'A2' },
            { id: 3, group_id: 101, name: 'A3' }
        ]

        selectedGroupId.value = 101

        expect(filteredAccounts.value).toHaveLength(2)
        expect(filteredAccounts.value.map(a => a.id)).toEqual([1, 3])
    })

    it('should provide platform-specific filtered lists', () => {
        const { filteredDouyinAccounts, filteredKuaishouAccounts } = useAccountFilter()

        mockAccountStore.accounts = [
            { id: 1, platform: '抖音', name: 'D1' },
            { id: 2, platform: '快手', name: 'K1' },
            { id: 3, platform: '抖音', name: 'D2' }
        ]

        expect(filteredDouyinAccounts.value).toHaveLength(2)
        expect(filteredDouyinAccounts.value.map(a => a.id)).toEqual([1, 3])

        expect(filteredKuaishouAccounts.value).toHaveLength(1)
        expect(filteredKuaishouAccounts.value[0].id).toBe(2)
    })

    it('should handle group change', () => {
        const { handleGroupChange, selectedGroupId } = useAccountFilter()

        handleGroupChange(999)
        expect(selectedGroupId.value).toBe(999)

        handleGroupChange(null)
        expect(selectedGroupId.value).toBe(null)
    })
})
