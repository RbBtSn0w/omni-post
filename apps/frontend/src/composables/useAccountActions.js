import { ref } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useAppStore } from '@/stores/app'
import dataCache from '@/utils/dataCache'
import { accountApi } from '@/api/account'
import { ElMessage, ElMessageBox } from 'element-plus'

// 全局状态（单例模式，因为AccountManagement通常是单例路由）
const hasInitiallyLoaded = ref(false)
const lastRefreshTime = ref(0)
const isGlobalRefreshing = ref(false)
const MIN_REFRESH_INTERVAL = 2000

// 防抖函数
const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// 取消控制器 - 用于取消正在进行的验证任务
let validationAbortController = null

// 重置全局状态
const resetGlobalState = () => {
    isGlobalRefreshing.value = false
    // 取消正在进行的验证任务
    if (validationAbortController) {
        validationAbortController.abort()
        validationAbortController = null
    }
}

// 检查是否已取消
const isValidationCancelled = () => {
    return validationAbortController === null || validationAbortController.signal.aborted
}


export function useAccountActions() {
    const accountStore = useAccountStore()
    const appStore = useAppStore()

    // 获取账号数据（快速，不验证）
    const fetchAccountsQuick = async () => {
        try {
            const now = Date.now()
            if (now - lastRefreshTime.value < MIN_REFRESH_INTERVAL) {
                console.log('刷新间隔不足，跳过快速获取账号数据')
                return
            }

            // 检查是否会跳过验证（冷却期内）
            const willSkipValidation = !accountStore.needsValidation()

            // 如果在验证冷却期内，优先使用已验证的缓存数据
            if (willSkipValidation) {
                const cachedValidData = dataCache.get('/account-management/valid')
                if (cachedValidData) {
                    console.log('验证冷却期内，使用已验证的缓存数据')
                    accountStore.setAccounts(cachedValidData)
                    return
                }
                // 如果已有账号数据，保持原状态不变
                if (accountStore.accounts.length > 0) {
                    console.log('验证冷却期内，保持现有账号状态')
                    return
                }
            }

            const cachedQuickData = dataCache.get('/account-management/quick')
            if (cachedQuickData) {
                const accountsWithPendingStatus = cachedQuickData.map(account => {
                    const updatedAccount = [...account];
                    updatedAccount[4] = '验证中';
                    return updatedAccount;
                });
                accountStore.setAccounts(accountsWithPendingStatus);
                return
            }

            const res = await accountApi.getAccounts()
            if (res.code === 200 && res.data) {
                dataCache.set('/account-management/quick', res.data)
                const accountsWithPendingStatus = res.data.map(account => {
                    const updatedAccount = [...account];
                    updatedAccount[4] = '验证中';
                    return updatedAccount;
                });
                accountStore.setAccounts(accountsWithPendingStatus)
            }
        } catch (error) {
            console.error('快速获取账号数据失败:', error)
        }
    }

    // 获取账号数据（带验证和防抖）
    const fetchAccounts = debounce(async () => {
        if (!accountStore.checkDataExpiry() && accountStore.accounts.length > 0) {
            console.log('数据未过期，跳过本次刷新')
            return Promise.resolve()
        }

        const now = Date.now()
        if (now - lastRefreshTime.value < MIN_REFRESH_INTERVAL) {
            console.log('刷新间隔不足，跳过本次刷新')
            return Promise.resolve()
        }

        const cachedValidData = dataCache.get('/account-management/valid')
        if (cachedValidData && !accountStore.checkDataExpiry()) {
            accountStore.setAccounts(cachedValidData)
            ElMessage.success('账号数据获取成功')
            if (appStore.isFirstTimeAccountManagement) {
                appStore.setAccountManagementVisited()
            }
            lastRefreshTime.value = now
            return Promise.resolve()
        }

        accountStore.startRefresh()

        try {
            const res = await accountApi.getValidAccounts()
            if (res.code === 200 && res.data) {
                dataCache.set('/account-management/valid', res.data)
                accountStore.setAccounts(res.data)
                ElMessage.success('账号数据获取成功')
                if (appStore.isFirstTimeAccountManagement) {
                    appStore.setAccountManagementVisited()
                }
            } else {
                ElMessage.error('获取账号数据失败')
            }
        } catch (error) {
            console.error('获取账号数据失败:', error)
            ElMessage.error('获取账号数据失败')
        } finally {
            accountStore.endRefresh()
            lastRefreshTime.value = Date.now()
        }
    }, 2000)

    // 后台验证所有账号
    const validateAllAccountsInBackground = async () => {
        // 检查是否在验证冷却期内
        if (!accountStore.needsValidation()) {
            const lastTime = accountStore.validationState.lastValidationTime
            console.log('验证冷却期内，跳过后台验证（上次验证时间：' +
                new Date(lastTime).toLocaleTimeString() + '）')
            return
        }

        if (isGlobalRefreshing.value) {
            console.log('全局刷新锁生效，跳过后台验证')
            return
        }

        const now = Date.now()
        if (now - lastRefreshTime.value < MIN_REFRESH_INTERVAL) {
            console.log('刷新间隔不足，跳过后台验证')
            return
        }

        // 创建新的取消控制器
        validationAbortController = new AbortController()
        isGlobalRefreshing.value = true

        try {
            accountStore.startRefresh()
            const accounts = accountStore.accounts

            if (accounts.length === 0) {
                console.log('没有账号需要验证')
                return
            }

            const platformGroups = {}
            accounts.forEach(account => {
                const platform = account.platform || 'unknown'
                if (!platformGroups[platform]) {
                    platformGroups[platform] = []
                }
                platformGroups[platform].push(account)
            })

            const platformNames = Object.keys(platformGroups)

            const validateAccount = async (account) => {
                // 检查是否已取消
                if (isValidationCancelled()) {
                    console.log(`验证已取消，跳过账号 ${account.name}`)
                    return
                }

                try {
                    accountStore.updateAccountStatus(account.id, '验证中', true)
                    const res = await accountApi.getValidAccounts(account.id)

                    // 再次检查取消状态
                    if (isValidationCancelled()) {
                        console.log(`验证已取消，跳过账号 ${account.name} 的结果处理`)
                        return
                    }

                    if (res.code === 200 && res.data && res.data.length > 0) {
                        const updatedAccount = res.data[0]
                        const statusText = updatedAccount[4] === 1 ? '正常' : '异常'
                        accountStore.updateAccount(account.id, {
                            status: statusText,
                            isRefreshing: false
                        })
                    } else {
                        accountStore.updateAccountStatus(account.id, '异常', false)
                    }
                } catch (error) {
                    // 如果是取消导致的错误，静默处理
                    if (isValidationCancelled()) {
                        console.log(`验证已取消，忽略账号 ${account.name} 的错误`)
                        return
                    }
                    console.error(`[${account.platform}] 验证账号 ${account.name} 失败:`, error)
                    accountStore.updateAccountStatus(account.id, '异常', false)
                }
            }

            const validatePlatform = async (platform, platformAccounts) => {
                for (const account of platformAccounts) {
                    // 每个账号验证前检查取消状态
                    if (isValidationCancelled()) {
                        console.log(`验证已取消，停止验证平台 ${platform}`)
                        return
                    }
                    await validateAccount(account)
                }
            }

            const platformPromises = platformNames.map(platform =>
                validatePlatform(platform, platformGroups[platform])
            )

            await Promise.all(platformPromises)

            // 只有在未取消的情况下才标记完成
            if (!isValidationCancelled()) {
                console.log('所有账号验证完成')
                // 标记验证完成，进入冷却期
                accountStore.setValidationCompleted()
            } else {
                console.log('验证被取消，不标记完成')
            }
        } catch (error) {
            if (!isValidationCancelled()) {
                console.error('后台验证账号失败:', error)
            }
        } finally {
            isGlobalRefreshing.value = false
            accountStore.endRefresh()
            lastRefreshTime.value = Date.now()
        }
    }

    // 刷新异常账号
    const refreshExceptionAccounts = async () => {
        try {
            const exceptionAccounts = accountStore.getAccountsForRetry()
            if (exceptionAccounts.length === 0) return

            const refreshPromises = exceptionAccounts.map(async (account) => {
                try {
                    accountStore.updateAccountStatus(account.id, '验证中')
                    const res = await accountApi.getValidAccounts(account.id)
                    if (res.code === 200 && res.data && res.data.length > 0) {
                        const updatedAccount = res.data[0]
                        const statusText = updatedAccount[4] === 1 ? '正常' : '异常'
                        accountStore.updateAccount(account.id, {
                            status: statusText
                        })
                        if (statusText === '正常') {
                            accountStore.resetRetryCount(account.id)
                            console.log(`异常账号 ${account.name} 自动恢复正常`)
                        } else {
                            accountStore.incrementRetryCount(account.id)
                        }
                    } else {
                        accountStore.updateAccountStatus(account.id, '异常')
                        accountStore.incrementRetryCount(account.id)
                    }
                } catch {
                    accountStore.updateAccountStatus(account.id, '异常')
                    accountStore.incrementRetryCount(account.id)
                }
            })
            await Promise.all(refreshPromises)
        } catch (error) {
            console.error('后台自动刷新异常账号失败:', error)
        }
    }

    // 批量刷新
    const handleBatchRefresh = async (selectedAccounts) => {
        if (selectedAccounts.length === 0) {
            ElMessage.warning('请先选择要刷新的账号')
            return
        }

        try {
            accountStore.startRefresh()
            ElMessage.closeAll()
            ElMessage({
                type: 'info',
                message: `开始刷新 ${selectedAccounts.length} 个账号`,
                duration: 0
            })

            const refreshPromises = selectedAccounts.map(async (account) => {
                try {
                    accountStore.updateAccountStatus(account.id, '验证中', true)
                    const res = await accountApi.getValidAccounts(account.id)

                    if (res.code === 200 && res.data && res.data.length > 0) {
                        const updatedAccount = res.data[0]
                        const statusText = updatedAccount[4] === 1 ? '正常' : '异常'
                        accountStore.updateAccount(account.id, {
                            status: statusText,
                            isRefreshing: false
                        })
                    } else {
                        accountStore.updateAccountStatus(account.id, '异常', false)
                    }
                } catch (error) {
                    console.error(`刷新账号 ${account.name} 失败:`, error)
                    accountStore.updateAccountStatus(account.id, '异常', false)
                }
            })

            await Promise.allSettled(refreshPromises)
            dataCache.delete('/account-management/valid')
            ElMessage.closeAll()
            ElMessage.success(`批量刷新完成，共刷新 ${selectedAccounts.length} 个账号`)
        } catch (error) {
            console.error('批量刷新账号失败:', error)
            ElMessage.closeAll()
            ElMessage.error('批量刷新失败')
        } finally {
            accountStore.endRefresh()
        }
    }

    // 删除账号
    const handleDelete = (row) => {
        return ElMessageBox.confirm(
            `确定要删除账号 ${row.name} 吗？`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        ).then(async () => {
            try {
                const res = await accountApi.deleteAccount(row.id)
                if (res.code === 200) {
                    ElMessage.success('删除成功')
                    accountStore.deleteAccount(row.id)
                    dataCache.delete('/account-management/valid')
                    dataCache.delete('/account-management/quick')
                } else {
                    ElMessage.error(res.msg || '删除失败')
                }
            } catch (error) {
                console.error('删除账号失败:', error)
                ElMessage.error('删除账号失败')
            }
        }).catch(() => {
            ElMessage.info('已取消删除')
        })
    }

    // 强制刷新账号（用于登录成功后，绕过缓存和防抖）
    const forceRefreshAccounts = async () => {
        // 清除所有缓存
        dataCache.delete('/account-management/valid')
        dataCache.delete('/account-management/quick')

        // 使用 setAllAccountsRefreshing 代替 startRefresh，确保所有账号状态立即变更为"验证中"
        accountStore.setAllAccountsRefreshing(true)

        try {
            const res = await accountApi.getValidAccounts()
            if (res.code === 200 && res.data) {
                dataCache.set('/account-management/valid', res.data)
                accountStore.setAccounts(res.data)
                lastRefreshTime.value = Date.now()
                return { success: true }
            } else {
                return { success: false, error: 'API returned non-200' }
            }
        } catch (error) {
            console.error('强制刷新账号数据失败:', error)
            return { success: false, error: error.message }
        } finally {
            accountStore.endRefresh()
        }
    }

    return {
        hasInitiallyLoaded,
        lastRefreshTime,
        isGlobalRefreshing,
        MIN_REFRESH_INTERVAL,
        fetchAccountsQuick,
        fetchAccounts,
        forceRefreshAccounts,
        validateAllAccountsInBackground,
        refreshExceptionAccounts,
        handleBatchRefresh,
        handleDelete,
        resetGlobalState
    }
}
