/**
 * 账号组状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { groupApi } from '@/api/group'

export const useGroupStore = defineStore('group', () => {
    // 状态
    const groups = ref([])
    const loading = ref(false)
    const currentGroupId = ref(null)

    // 计算属性
    const groupCount = computed(() => groups.value.length)

    const currentGroup = computed(() => {
        if (!currentGroupId.value) return null
        return groups.value.find(g => g.id === currentGroupId.value)
    })

    const groupOptions = computed(() => {
        return groups.value.map(g => ({
            value: g.id,
            label: g.name,
            accountCount: g.account_count || 0
        }))
    })

    // 操作
    const fetchGroups = async () => {
        loading.value = true
        try {
            const res = await groupApi.getGroups()
            if (res.code === 200) {
                groups.value = res.data || []
            }
        } catch (error) {
            console.error('获取账号组失败:', error)
        } finally {
            loading.value = false
        }
    }

    const createGroup = async (data) => {
        try {
            const res = await groupApi.createGroup(data)
            if (res.code === 200) {
                await fetchGroups()
                return { success: true, data: res.data }
            }
            return { success: false, message: res.message }
        } catch (error) {
            console.error('创建账号组失败:', error)
            return { success: false, message: error.message }
        }
    }

    const updateGroup = async (groupId, data) => {
        try {
            const res = await groupApi.updateGroup(groupId, data)
            if (res.code === 200) {
                await fetchGroups()
                return { success: true }
            }
            return { success: false, message: res.message }
        } catch (error) {
            console.error('更新账号组失败:', error)
            return { success: false, message: error.message }
        }
    }

    const deleteGroup = async (groupId) => {
        try {
            const res = await groupApi.deleteGroup(groupId)
            if (res.code === 200) {
                await fetchGroups()
                // 如果删除的是当前选中的组，清除选择
                if (currentGroupId.value === groupId) {
                    currentGroupId.value = null
                }
                return { success: true }
            }
            return { success: false, message: res.message }
        } catch (error) {
            console.error('删除账号组失败:', error)
            return { success: false, message: error.message }
        }
    }

    const setCurrentGroup = (groupId) => {
        currentGroupId.value = groupId
    }

    return {
        // 状态
        groups,
        loading,
        currentGroupId,
        // 计算属性
        groupCount,
        currentGroup,
        groupOptions,
        // 操作
        fetchGroups,
        createGroup,
        updateGroup,
        deleteGroup,
        setCurrentGroup
    }
})
