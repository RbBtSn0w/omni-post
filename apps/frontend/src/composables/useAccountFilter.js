import { computed, ref } from 'vue'
import { useAccountStore } from '../stores/account'

export function useAccountFilter() {
    const accountStore = useAccountStore()

    const activeTab = ref('all')
    const selectedGroupId = ref(null)

    const handleGroupChange = (val) => {
        selectedGroupId.value = val
    }

    // 基础过滤（按组）
    const filteredAccounts = computed(() => {
        let result = accountStore.accounts
        if (selectedGroupId.value) {
            result = result.filter(account => account.group_id === selectedGroupId.value)
        }
        return result
    })

    // 各平台过滤
    const filteredKuaishouAccounts = computed(() =>
        filteredAccounts.value.filter(account => account.platform === '快手')
    )

    const filteredDouyinAccounts = computed(() =>
        filteredAccounts.value.filter(account => account.platform === '抖音')
    )

    const filteredChannelsAccounts = computed(() =>
        filteredAccounts.value.filter(account => account.platform === '视频号')
    )

    const filteredXiaohongshuAccounts = computed(() =>
        filteredAccounts.value.filter(account => account.platform === '小红书')
    )

    const filteredBilibiliAccounts = computed(() =>
        filteredAccounts.value.filter(account => account.platform === 'Bilibili')
    )

    return {
        activeTab,
        selectedGroupId,
        handleGroupChange,
        filteredAccounts,
        filteredKuaishouAccounts,
        filteredDouyinAccounts,
        filteredChannelsAccounts,
        filteredXiaohongshuAccounts,
        filteredBilibiliAccounts
    }
}
