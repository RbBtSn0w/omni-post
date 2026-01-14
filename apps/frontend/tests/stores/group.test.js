
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGroupStore } from '@/stores/group'
import { groupApi } from '@/api/group'

// Mock group API
vi.mock('@/api/group', () => ({
    groupApi: {
        getGroups: vi.fn(),
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn()
    }
}))

describe('Group Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('should initialize with default state', () => {
        const store = useGroupStore()
        expect(store.groups).toEqual([])
        expect(store.loading).toBe(false)
        expect(store.currentGroupId).toBe(null)
    })

    it('should fetch groups successfully', async () => {
        const store = useGroupStore()
        const mockGroups = [{ id: 1, name: 'Group 1' }]
        groupApi.getGroups.mockResolvedValue({ code: 200, data: mockGroups })

        await store.fetchGroups()

        expect(groupApi.getGroups).toHaveBeenCalled()
        expect(store.groups).toEqual(mockGroups)
        expect(store.loading).toBe(false)
    })

    it('should handle fetch groups error', async () => {
        const store = useGroupStore()
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
        groupApi.getGroups.mockRejectedValue(new Error('Network error'))

        await store.fetchGroups()

        expect(store.groups).toEqual([])
        expect(store.loading).toBe(false)
        consoleSpy.mockRestore()
    })

    it('should create group successfully', async () => {
        const store = useGroupStore()
        const newGroup = { name: 'New Group' }
        groupApi.createGroup.mockResolvedValue({ code: 200, data: { id: 2, ...newGroup } })
        groupApi.getGroups.mockResolvedValue({ code: 200, data: [{ id: 2, ...newGroup }] })

        const res = await store.createGroup(newGroup)

        expect(groupApi.createGroup).toHaveBeenCalledWith(newGroup)
        expect(groupApi.getGroups).toHaveBeenCalled()
        expect(res.success).toBe(true)
    })

    it('should update group successfully', async () => {
        const store = useGroupStore()
        const groupId = 1
        const updateData = { name: 'Updated Group' }
        groupApi.updateGroup.mockResolvedValue({ code: 200 })
        groupApi.getGroups.mockResolvedValue({ code: 200, data: [] })

        const res = await store.updateGroup(groupId, updateData)

        expect(groupApi.updateGroup).toHaveBeenCalledWith(groupId, updateData)
        expect(groupApi.getGroups).toHaveBeenCalled()
        expect(res.success).toBe(true)
    })

    it('should delete group successfully', async () => {
        const store = useGroupStore()
        const groupId = 1
        groupApi.deleteGroup.mockResolvedValue({ code: 200 })
        groupApi.getGroups.mockResolvedValue({ code: 200, data: [] })

        // Set current group to the one being deleted
        store.setCurrentGroup(groupId)

        const res = await store.deleteGroup(groupId)

        expect(groupApi.deleteGroup).toHaveBeenCalledWith(groupId)
        expect(groupApi.getGroups).toHaveBeenCalled()
        expect(res.success).toBe(true)
        expect(store.currentGroupId).toBe(null)
    })

    it('should verify getters', async () => {
        const store = useGroupStore()
        store.groups = [
            { id: 1, name: 'Group 1', account_count: 5 },
            { id: 2, name: 'Group 2', account_count: 3 }
        ]
        store.setCurrentGroup(1)

        expect(store.groupCount).toBe(2)
        expect(store.currentGroup).toEqual(store.groups[0])
        expect(store.groupOptions).toEqual([
            { value: 1, label: 'Group 1', accountCount: 5 },
            { value: 2, label: 'Group 2', accountCount: 3 }
        ])
    })
})
