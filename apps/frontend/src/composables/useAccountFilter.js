import { useAccountStore } from '../stores/account'
import { PLATFORM_NAMES, PlatformType } from '../core/platformConstants'

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
        filteredAccounts.value.filter(account => account.platform === PLATFORM_NAMES[PlatformType.KUAISHOU])
    )

    const filteredDouyinAccounts = computed(() =>
        filteredAccounts.value.filter(account => account.platform === PLATFORM_NAMES[PlatformType.DOUYIN])
    )

    const filteredChannelsAccounts = computed(() =>
        filteredAccounts.value.filter(account => account.platform === PLATFORM_NAMES[PlatformType.WX_CHANNELS])
    )

    const filteredXiaohongshuAccounts = computed(() =>
        filteredAccounts.value.filter(account => account.platform === PLATFORM_NAMES[PlatformType.XIAOHONGSHU])
    )

    const filteredBilibiliAccounts = computed(() =>
        filteredAccounts.value.filter(account => account.platform === PLATFORM_NAMES[PlatformType.BILIBILI])
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
