<template>
  <div class="account-management">
    <div class="page-header">
      <h1>账号管理</h1>

      <!-- 异常状态告警 -->
      <el-alert
        v-if="showAlert"
        title="账号异常告警"
        type="warning"
        :closable="true"
        @close="handleAlertClose"
        show-icon
      >
        当前有 {{ statusStats.exception }} 个账号处于异常状态，占比 {{ exceptionRatio }}%，建议及时处理
      </el-alert>

      <!-- 状态统计卡片 -->
      <div class="status-stats">
        <el-card shadow="hover" class="stat-card normal-card">
          <div class="stat-content">
            <div class="stat-number">{{ statusStats.normal }}</div>
            <div class="stat-label">正常账号</div>
          </div>
        </el-card>
        <el-card shadow="hover" class="stat-card exception-card">
          <div class="stat-content">
            <div class="stat-number">{{ statusStats.exception }}</div>
            <div class="stat-label">异常账号</div>
          </div>
        </el-card>
        <el-card shadow="hover" class="stat-card verifying-card">
          <div class="stat-content">
            <div class="stat-number">{{ statusStats.verifying }}</div>
            <div class="stat-label">验证中</div>
          </div>
        </el-card>
        <el-card shadow="hover" class="stat-card total-card">
          <div class="stat-content">
            <div class="stat-number">{{ statusStats.total }}</div>
            <div class="stat-label">总账号数</div>
          </div>
        </el-card>
      </div>
    </div>

    <div class="account-tabs">
      <el-tabs v-model="activeTab" class="account-tabs-nav">
        <el-tab-pane label="全部" name="all">
          <div class="account-list-container">
            <div class="account-search">
              <GroupSelector v-model="selectedGroupId" @change="handleGroupChange" />
              <div class="action-buttons">
                <el-button type="primary" @click="handleAddAccount">添加账号</el-button>
                <el-button type="info" @click="handleForceRefresh" :loading="accountStore.refreshStatus.isRefreshing">
                  <el-icon :class="{ 'is-loading': accountStore.refreshStatus.isRefreshing }"><Refresh /></el-icon>
                  <span v-if="accountStore.refreshStatus.isRefreshing">刷新中</span>
                </el-button>

                <!-- 批量操作按钮 -->
                <el-dropdown v-if="selectedAccounts.length > 0">
                  <el-button type="warning">
                    批量操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleBatchRefresh">批量刷新</el-dropdown-item>
                      <el-dropdown-item @click="handleBatchReLogin">批量重新登录</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <!-- 刷新进度显示 -->
            <div v-if="accountStore.refreshStatus.isRefreshing" class="refresh-progress">
              <el-progress
                type="line"
                :percentage="accountStore.getRefreshProgress()"
                :show-text="true"
                text-inside
                :stroke-width="10"
              />
              <span class="progress-text">
                正在刷新: {{ accountStore.refreshStatus.completedCount }}/{{ accountStore.refreshStatus.totalCount }}
              </span>
            </div>

            <div v-if="filteredAccounts.length > 0" class="account-list">
              <el-table
                :data="filteredAccounts"
                style="width: 100%"
                @selection-change="handleSelectionChange"
                ref="accountTableRef"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column label="头像" width="80">
                  <template #default="scope">
                    <el-avatar :src="getDefaultAvatar(scope.row.name)" :size="40" />
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="名称" width="180" />
                <el-table-column prop="platform" label="平台">
                  <template #default="scope">
                    <el-tag
                      :type="getPlatformTagType(scope.row.platform)"
                      effect="plain"
                    >
                      {{ scope.row.platform }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag
                      :type="getStatusTagType(scope.row.status)"
                      effect="plain"
                      :class="{
                        'clickable-status': isStatusClickable(scope.row.status),
                        'refreshing-status': scope.row.isRefreshing
                      }"
                      @click="handleStatusClick(scope.row)"
                    >
                      <el-icon :class="{'is-loading': scope.row.isRefreshing || scope.row.status === '验证中'}" v-if="scope.row.isRefreshing || scope.row.status === '验证中'">
                        <Loading />
                      </el-icon>
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button
                      size="small"
                      :icon="Refresh"
                      :loading="scope.row.isRefreshing"
                      @click="handleRefreshSingleAccount(scope.row)"
                      :disabled="scope.row.isRefreshing"
                    >
                      刷新
                    </el-button>
                    <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button size="small" type="primary" :icon="Download" @click="handleDownloadCookie(scope.row)">下载Cookie</el-button>
                    <el-button size="small" type="info" :icon="Upload" @click="handleUploadCookie(scope.row)">上传Cookie</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div v-else class="empty-data">
              <el-empty description="暂无账号数据" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="快手" name="kuaishou">
          <div class="account-list-container">
            <div class="account-search">
              <GroupSelector v-model="selectedGroupId" @change="handleGroupChange" />
              <div class="action-buttons">
                <el-button type="primary" @click="handleAddAccount">添加账号</el-button>
                <el-button type="info" @click="handleForceRefresh" :loading="false">
                  <el-icon :class="{ 'is-loading': appStore.isAccountRefreshing }"><Refresh /></el-icon>
                  <span v-if="appStore.isAccountRefreshing">刷新中</span>
                </el-button>
              </div>
            </div>

            <div v-if="filteredKuaishouAccounts.length > 0" class="account-list">
              <el-table :data="filteredKuaishouAccounts" style="width: 100%">
                <el-table-column label="头像" width="80">
                  <template #default="scope">
                    <el-avatar :src="getDefaultAvatar(scope.row.name)" :size="40" />
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="名称" width="180" />
                <el-table-column prop="platform" label="平台">
                  <template #default="scope">
                    <el-tag
                      :type="getPlatformTagType(scope.row.platform)"
                      effect="plain"
                    >
                      {{ scope.row.platform }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag
                      :type="getStatusTagType(scope.row.status)"
                      effect="plain"
                      :class="{'clickable-status': isStatusClickable(scope.row.status)}"
                      @click="handleStatusClick(scope.row)"
                    >
                      <el-icon :class="scope.row.status === '验证中' ? 'is-loading' : ''" v-if="scope.row.status === '验证中'">
                        <Loading />
                      </el-icon>
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button size="small" type="primary" :icon="Download" @click="handleDownloadCookie(scope.row)">下载Cookie</el-button>
                    <el-button size="small" type="info" :icon="Upload" @click="handleUploadCookie(scope.row)">上传Cookie</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div v-else class="empty-data">
              <el-empty description="暂无快手账号数据" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="抖音" name="douyin">
          <div class="account-list-container">
            <div class="account-search">
              <GroupSelector v-model="selectedGroupId" @change="handleGroupChange" />
              <div class="action-buttons">
                <el-button type="primary" @click="handleAddAccount">添加账号</el-button>
                <el-button type="info" @click="handleForceRefresh" :loading="false">
                  <el-icon :class="{ 'is-loading': appStore.isAccountRefreshing }"><Refresh /></el-icon>
                  <span v-if="appStore.isAccountRefreshing">刷新中</span>
                </el-button>
              </div>
            </div>

            <div v-if="filteredDouyinAccounts.length > 0" class="account-list">
              <el-table :data="filteredDouyinAccounts" style="width: 100%">
                <el-table-column label="头像" width="80">
                  <template #default="scope">
                    <el-avatar :src="getDefaultAvatar(scope.row.name)" :size="40" />
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="名称" width="180" />
                <el-table-column prop="platform" label="平台">
                  <template #default="scope">
                    <el-tag
                      :type="getPlatformTagType(scope.row.platform)"
                      effect="plain"
                    >
                      {{ scope.row.platform }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag
                      :type="getStatusTagType(scope.row.status)"
                      effect="plain"
                      :class="{'clickable-status': isStatusClickable(scope.row.status)}"
                      @click="handleStatusClick(scope.row)"
                    >
                      <el-icon :class="scope.row.status === '验证中' ? 'is-loading' : ''" v-if="scope.row.status === '验证中'">
                        <Loading />
                      </el-icon>
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button size="small" type="primary" :icon="Download" @click="handleDownloadCookie(scope.row)">下载Cookie</el-button>
                    <el-button size="small" type="info" :icon="Upload" @click="handleUploadCookie(scope.row)">上传Cookie</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div v-else class="empty-data">
              <el-empty description="暂无抖音账号数据" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="视频号" name="channels">
          <div class="account-list-container">
            <div class="account-search">
              <GroupSelector v-model="selectedGroupId" @change="handleGroupChange" />
              <div class="action-buttons">
                <el-button type="primary" @click="handleAddAccount">添加账号</el-button>
                <el-button type="info" @click="handleForceRefresh" :loading="false">
                  <el-icon :class="{ 'is-loading': appStore.isAccountRefreshing }"><Refresh /></el-icon>
                  <span v-if="appStore.isAccountRefreshing">刷新中</span>
                </el-button>
              </div>
            </div>

            <div v-if="filteredChannelsAccounts.length > 0" class="account-list">
              <el-table :data="filteredChannelsAccounts" style="width: 100%">
                <el-table-column label="头像" width="80">
                  <template #default="scope">
                    <el-avatar :src="getDefaultAvatar(scope.row.name)" :size="40" />
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="名称" width="180" />
                <el-table-column prop="platform" label="平台">
                  <template #default="scope">
                    <el-tag
                      :type="getPlatformTagType(scope.row.platform)"
                      effect="plain"
                    >
                      {{ scope.row.platform }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag
                      :type="getStatusTagType(scope.row.status)"
                      effect="plain"
                      :class="{'clickable-status': isStatusClickable(scope.row.status)}"
                      @click="handleStatusClick(scope.row)"
                    >
                      <el-icon :class="scope.row.status === '验证中' ? 'is-loading' : ''" v-if="scope.row.status === '验证中'">
                        <Loading />
                      </el-icon>
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button size="small" type="primary" :icon="Download" @click="handleDownloadCookie(scope.row)">下载Cookie</el-button>
                    <el-button size="small" type="info" :icon="Upload" @click="handleUploadCookie(scope.row)">上传Cookie</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div v-else class="empty-data">
              <el-empty description="暂无视频号账号数据" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="小红书" name="xiaohongshu">
          <div class="account-list-container">
            <div class="account-search">
              <GroupSelector v-model="selectedGroupId" @change="handleGroupChange" />
              <div class="action-buttons">
                <el-button type="primary" @click="handleAddAccount">添加账号</el-button>
                <el-button type="info" @click="handleForceRefresh" :loading="false">
                  <el-icon :class="{ 'is-loading': appStore.isAccountRefreshing }"><Refresh /></el-icon>
                  <span v-if="appStore.isAccountRefreshing">刷新中</span>
                </el-button>
              </div>
            </div>

            <div v-if="filteredXiaohongshuAccounts.length > 0" class="account-list">
              <el-table :data="filteredXiaohongshuAccounts" style="width: 100%">
                <el-table-column label="头像" width="80">
                  <template #default="scope">
                    <el-avatar :src="getDefaultAvatar(scope.row.name)" :size="40" />
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="名称" width="180" />
                <el-table-column prop="platform" label="平台">
                  <template #default="scope">
                    <el-tag
                      :type="getPlatformTagType(scope.row.platform)"
                      effect="plain"
                    >
                      {{ scope.row.platform }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag
                      :type="getStatusTagType(scope.row.status)"
                      effect="plain"
                      :class="{'clickable-status': isStatusClickable(scope.row.status)}"
                      @click="handleStatusClick(scope.row)"
                    >
                      <el-icon :class="scope.row.status === '验证中' ? 'is-loading' : ''" v-if="scope.row.status === '验证中'">
                        <Loading />
                      </el-icon>
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button size="small" type="primary" :icon="Download" @click="handleDownloadCookie(scope.row)">下载Cookie</el-button>
                    <el-button size="small" type="info" :icon="Upload" @click="handleUploadCookie(scope.row)">上传Cookie</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div v-else class="empty-data">
              <el-empty description="暂无小红书账号数据" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 添加/编辑账号对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加账号' : '编辑账号'"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="!sseConnecting"
      :show-close="!sseConnecting"
    >
      <el-form :model="accountForm" label-width="80px" :rules="rules" ref="accountFormRef">
        <el-form-item label="平台" prop="platform">
          <el-select
            v-model="accountForm.platform"
            placeholder="请选择平台"
            style="width: 100%"
            :disabled="dialogType === 'edit' || sseConnecting"
          >
            <el-option label="快手" value="快手" />
            <el-option label="抖音" value="抖音" />
            <el-option label="视频号" value="视频号" />
            <el-option label="小红书" value="小红书" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="groupName">
          <el-select
            v-model="accountForm.groupName"
            placeholder="请选择或输入名称"
            style="width: 100%"
            filterable
            allow-create
            default-first-option
            :disabled="sseConnecting"
          >
            <el-option
              v-for="group in groupStore.groups"
              :key="group.id"
              :label="group.name"
              :value="group.name"
            />
          </el-select>
        </el-form-item>

        <!-- 二维码显示区域 -->
        <div v-if="sseConnecting" class="qrcode-container">
          <div v-if="qrCodeData && !loginStatus" class="qrcode-wrapper">
            <p class="qrcode-tip">请使用对应平台APP扫描二维码登录</p>
            <img :src="qrCodeData" alt="登录二维码" class="qrcode-image" />
          </div>
          <div v-else-if="!qrCodeData && !loginStatus" class="loading-wrapper">
            <el-icon class="is-loading"><Refresh /></el-icon>
            <span>请求中...</span>
          </div>
          <div v-else-if="loginStatus === '200'" class="success-wrapper">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>添加成功</span>
          </div>
          <div v-else-if="loginStatus === '500'" class="error-wrapper">
            <el-icon><CircleCloseFilled /></el-icon>
            <span>添加失败，请稍后再试</span>
          </div>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="submitAccountForm"
            :loading="sseConnecting"
            :disabled="sseConnecting"
          >
            {{ sseConnecting ? '请求中' : '确认' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { Refresh, CircleCheckFilled, CircleCloseFilled, Download, Upload, Loading, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElAlert, ElCard } from 'element-plus'
import { accountApi } from '@/api/account'
import { useAccountStore } from '@/stores/account'
import { useAppStore } from '@/stores/app'
import { useGroupStore } from '@/stores/group'
import GroupSelector from '@/components/GroupSelector.vue'
// 导入全局数据缓存服务
import dataCache from '@/utils/dataCache'
import { useAccountFilter } from '@/composables/useAccountFilter'
import { useAccountActions } from '@/composables/useAccountActions'
import { API_BASE_URL } from '@/core/config'

// 获取账号状态管理
const accountStore = useAccountStore()
// 获取应用状态管理
const appStore = useAppStore()
// 获取组状态管理
const groupStore = useGroupStore()

const {
  activeTab,
  selectedGroupId,
  handleGroupChange,
  filteredAccounts,
  filteredKuaishouAccounts,
  filteredDouyinAccounts,
  filteredChannelsAccounts,
  filteredXiaohongshuAccounts
} = useAccountFilter()

const {
  hasInitiallyLoaded,
  lastRefreshTime,
  isGlobalRefreshing,
  fetchAccountsQuick,
  fetchAccounts,
  forceRefreshAccounts,
  validateAllAccountsInBackground,
  refreshExceptionAccounts,
  handleBatchRefresh,
  handleDelete,
  resetGlobalState
} = useAccountActions()

// 搜索关键词


// 批量选择的账号
const selectedAccounts = ref([])

// 表格引用
const accountTableRef = ref(null)





// 强制刷新（手动点击刷新按钮）
const handleForceRefresh = async () => {
  // 防止重复点击
  if (accountStore.refreshStatus.isRefreshing || appStore.isAccountRefreshing) {
    return
  }

  // 使用 forceRefreshAccounts 方法，它会绕过缓存检查
  const res = await forceRefreshAccounts()

  if (!res.success) {
    if (res.error !== 'API returned non-200') {
      ElMessage.error(res.error || '刷新失败')
    }
  }
}

// 单个账号刷新
const handleRefreshSingleAccount = async (row) => {
  try {
    // 更新状态为刷新中
    accountStore.updateAccountStatus(row.id, '验证中', true)

    // 调用API刷新单个账号
    const res = await accountApi.getValidAccounts(row.id)

    if (res.code === 200 && res.data && res.data.length > 0) {
      // 更新单个账号信息
      const updatedAccount = res.data[0]
      const statusText = updatedAccount[4] === 1 ? '正常' : '异常'

      accountStore.updateAccount(row.id, {
        status: statusText,
        isRefreshing: false
      })

      // 清除缓存，下次获取时会重新验证所有账号
      dataCache.delete('/account-management/valid')

      if (statusText === '正常') {
        // 刷新成功，重置重试计数
        accountStore.resetRetryCount(row.id)
        ElMessage.success(`账号 ${row.name} 刷新成功`)
      } else {
        // 仍然异常，询问用户是否需要重新登录
        ElMessageBox.confirm(
          `账号 ${row.name} 验证失败，Cookie 可能已过期。是否需要重新登录？`,
          '账号异常',
          {
            confirmButtonText: '重新登录',
            cancelButtonText: '稍后处理',
            type: 'warning',
          }
        ).then(() => {
          // 用户选择重新登录，触发重新登录流程
          handleReLogin(row)
        }).catch(() => {
          // 用户选择稍后处理
          ElMessage.info('您可以稍后点击异常状态进行重新登录')
        })
      }
    } else {
      // API调用失败，保持异常状态
      accountStore.updateAccountStatus(row.id, '异常', false)

      // 清除缓存，下次获取时会重新验证所有账号
      dataCache.delete('/account-management/valid')

      // 询问用户是否需要重新登录
      ElMessageBox.confirm(
        `账号 ${row.name} 刷新失败，是否需要重新登录？`,
        '刷新失败',
        {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'error',
        }
      ).then(() => {
        handleReLogin(row)
      }).catch(() => {
        // 用户取消
      })
    }
  } catch (error) {
    console.error(`刷新账号 ${row.name} 失败:`, error)
    accountStore.updateAccountStatus(row.id, '异常', false)

    // 清除缓存，下次获取时会重新验证所有账号
    dataCache.delete('/account-management/valid')

    ElMessage.error(`账号 ${row.name} 刷新失败: ${error.message || '网络错误'}`)
  }
}

// 处理表格选择变化
const handleSelectionChange = (selection) => {
  selectedAccounts.value = selection
}



// 批量重新登录选中账号
const handleBatchReLogin = async () => {
  if (selectedAccounts.value.length === 0) {
    ElMessage.warning('请先选择要重新登录的账号')
    return
  }

  // 过滤出异常状态的账号
  const exceptionAccounts = selectedAccounts.value.filter(account => account.status === '异常')
  if (exceptionAccounts.length === 0) {
    ElMessage.warning('请选择异常状态的账号进行重新登录')
    return
  }

  try {
    // 显示新消息前关闭所有现有消息
    ElMessage.closeAll()

    ElMessage({
      type: 'info',
      message: `开始重新登录 ${exceptionAccounts.length} 个异常账号`,
      duration: 0
    })

    // 这里可以根据实际需求实现批量重新登录逻辑
    // 目前暂时只实现批量刷新
    await handleBatchRefresh()

    ElMessage.closeAll()
    ElMessage.success(`批量重新登录完成`)
  } catch (error) {
    console.error('批量重新登录失败:', error)
    ElMessage.closeAll()
    ElMessage.error('批量重新登录失败')
  }
}



// 自动刷新定时器
let autoRefreshTimer = null
let exceptionRefreshTimer = null

// 页面加载时获取账号数据
onMounted(() => {
  // 快速获取 & 后台验证
  fetchAccountsQuick()
  setTimeout(() => {
    validateAllAccountsInBackground()
  }, 100)

  // 标记已完成初始加载
  hasInitiallyLoaded.value = true

  // 设置自动刷新定时器（每5分钟）
  autoRefreshTimer = setInterval(() => {
    fetchAccounts()
  }, 5 * 60 * 1000)

  // 设置异常账号自动刷新定时器（每60秒）
  exceptionRefreshTimer = setInterval(() => {
    refreshExceptionAccounts()
  }, 60 * 1000)
})

// 组件卸载前清理定时器和SSE连接
onBeforeUnmount(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }
  if (exceptionRefreshTimer) {
    clearInterval(exceptionRefreshTimer)
  }
  // 清理SSE连接，防止内存泄漏
  closeSSEConnection()

  // 重置全局状态并取消正在进行的验证任务
  // 这可以防止页面切换时出现持续loading的问题
  resetGlobalState()
})



// 获取平台标签类型
const getPlatformTagType = (platform) => {
  const typeMap = {
    '快手': 'success',
    '抖音': 'danger',
    '视频号': 'warning',
    '小红书': 'info'
  }
  return typeMap[platform] || 'info'
}

// 判断状态是否可点击（异常状态可点击）
const isStatusClickable = (status) => {
  // 只有异常状态可点击，验证中和正常状态不可点击
  return status === '异常';
}

// 验证账号是否有效
const isValidAccount = (row) => {
  // 确保账号对象有效且包含必要字段
  return row && row.id && row.platform && row.name;
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  if (status === '验证中') {
    return 'info'; // 验证中使用灰色
  } else if (status === '正常') {
    return 'success'; // 正常使用绿色
  } else {
    return 'danger'; // 无效使用红色
  }
}

// 处理状态点击事件
const handleStatusClick = (row) => {
  if (isStatusClickable(row.status) && isValidAccount(row)) {
    // 触发重新登录流程
    handleReLogin(row)
  } else {
    console.warn('无效的账号或状态不可点击:', row)
  }
}



// 状态统计
const statusStats = computed(() => {
  const stats = {
    total: accountStore.accounts.length,
    normal: 0,
    exception: 0,
    verifying: 0
  }

  accountStore.accounts.forEach(account => {
    if (account.status === '正常') {
      stats.normal++
    } else if (account.status === '异常') {
      stats.exception++
    } else {
      stats.verifying++
    }
  })

  return stats
})

// 异常账号占比
const exceptionRatio = computed(() => {
  if (statusStats.value.total === 0) return 0
  return Math.round((statusStats.value.exception / statusStats.value.total) * 100)
})

// 是否显示告警
const showAlert = computed(() => {
  return statusStats.value.exception > 0 && exceptionRatio.value > 20
})



// 处理告警关闭
const handleAlertClose = () => {
  // 可以在这里添加一些逻辑，比如记录用户已关闭告警
  console.log('告警已关闭')
}

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' 或 'edit'
const accountFormRef = ref(null)

// 账号表单
const accountForm = reactive({
  id: null,
  name: '',
  groupName: '',
  platform: '',
  status: '正常'
})

// 表单验证规则
const rules = {
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  groupName: [{ required: true, message: '请选择或输入名称', trigger: 'change' }]
}

// SSE连接状态
const sseConnecting = ref(false)
const qrCodeData = ref('')
const loginStatus = ref('')

// 添加账号
const handleAddAccount = () => {
  dialogType.value = 'add'
  Object.assign(accountForm, {
    id: null,
    name: '',
    groupName: '',
    platform: '',
    status: '正常'
  })
  // 重置SSE状态
  sseConnecting.value = false
  qrCodeData.value = ''
  loginStatus.value = ''
  dialogVisible.value = true
}

// 编辑账号
const handleEdit = (row) => {
  dialogType.value = 'edit'
  // 根据 group_id 查找 groupName
  const group = groupStore.groups.find(g => g.id === row.group_id)

  Object.assign(accountForm, {
    id: row.id,
    name: row.name,
    groupName: group ? group.name : '',
    platform: row.platform,
    status: row.status
  })
  dialogVisible.value = true
}



// 下载Cookie文件
const handleDownloadCookie = (row) => {
  // 从后端获取Cookie文件
  const downloadUrl = `${API_BASE_URL}/downloadCookie?filePath=${encodeURIComponent(row.filePath)}`

  // 创建一个隐藏的链接来触发下载
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = `${row.name}_cookie.json`
  link.target = '_blank'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 上传Cookie文件
const handleUploadCookie = (row) => {
  // 创建一个隐藏的文件输入框
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.style.display = 'none'
  document.body.appendChild(input)

  input.onchange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 检查文件类型
    if (!file.name.endsWith('.json')) {
      ElMessage.error('请选择JSON格式的Cookie文件')
      document.body.removeChild(input)
      return
    }

    try {
      // 创建FormData对象
      const formData = new FormData()
      formData.append('file', file)
      formData.append('id', row.id)
      formData.append('platform', row.platform)

      // 发送上传请求
      const response = await fetch(`${API_BASE_URL}/uploadCookie`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.code === 200) {
        ElMessage.success('Cookie文件上传成功')
        // 刷新账号列表以显示更新
        fetchAccounts()
      } else {
        ElMessage.error(result.msg || 'Cookie文件上传失败')
      }
    } catch (error) {
      console.error('上传Cookie文件失败:', error)
      ElMessage.error('Cookie文件上传失败')
    } finally {
      document.body.removeChild(input)
    }
  }

  input.click()
}

// 重新登录账号
const handleReLogin = (row) => {
  if (!isValidAccount(row)) {
    console.error('无效的账号数据:', row)
    ElMessage.error('账号数据无效，无法进行重新登录')
    return
  }

  // 设置表单信息
  dialogType.value = 'edit'
  Object.assign(accountForm, {
    id: row.id,
    name: row.name,
    platform: row.platform,
    status: row.status
  })

  // 重置SSE状态
  sseConnecting.value = false
  qrCodeData.value = ''
  loginStatus.value = ''

  // 显示对话框
  dialogVisible.value = true

  // 立即开始登录流程
  setTimeout(() => {
    connectSSE(row.platform, row.name, row.groupName)
  }, 300)
}

// 获取默认头像
const getDefaultAvatar = (name) => {
  // 使用简单的默认头像，可以基于用户名生成不同的颜色
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
}

// SSE事件源对象
let eventSource = null

// 关闭SSE连接
const closeSSEConnection = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

// 建立SSE连接
const connectSSE = (platform, name, groupName) => {
  // 关闭可能存在的连接
  closeSSEConnection()

  // 设置连接状态
  sseConnecting.value = true
  qrCodeData.value = ''
  loginStatus.value = ''

  // 获取平台类型编号
  const platformTypeMap = {
    '小红书': '1',
    '视频号': '2',
    '抖音': '3',
    '快手': '4'
  }

  const type = platformTypeMap[platform] || '1'

  // 创建SSE连接
  let url = `${API_BASE_URL}/login?type=${type}&id=${encodeURIComponent(name)}`
  if (groupName) {
    url += `&group=${encodeURIComponent(groupName)}`
  }

  eventSource = new EventSource(url)

  // 监听消息
  eventSource.onmessage = (event) => {
    const data = event.data
    console.log('SSE消息:', data)

    // 如果还没有二维码数据，且数据长度较长，认为是二维码
    if (!qrCodeData.value && data.length > 100) {
      try {
        // 确保数据是有效的base64编码
        // 如果数据已经包含了data:image前缀，直接使用
        if (data.startsWith('data:image')) {
          qrCodeData.value = data
        } else {
          // 否则添加前缀
          qrCodeData.value = `data:image/png;base64,${data}`
        }
        console.log('设置二维码数据，长度:', data.length)
      } catch (error) {
        console.error('处理二维码数据出错:', error)
      }
    }
    // 如果收到状态码
    else if (data === '200' || data === '500') {
      loginStatus.value = data

      // 如果登录成功
      if (data === '200') {
        // 显示成功状态 1 秒后关闭对话框
        setTimeout(() => {
          // 关闭连接和对话框
          closeSSEConnection()
          dialogVisible.value = false
          sseConnecting.value = false

          // 显示新消息前关闭所有现有消息
          ElMessage.closeAll()

          // 根据是否是重新登录显示不同提示
          const successMsg = dialogType.value === 'edit' ? '重新登录成功' : '账号添加成功'
          ElMessage.success(`${successMsg}，正在同步账号信息...`)

          // 触发刷新操作（使用强制刷新，绕过缓存）
          forceRefreshAccounts().then((result) => {
            // 刷新完成后关闭提示并显示完成消息
            ElMessage.closeAll()
            if (result.success) {
              ElMessage.success('账号信息已更新')
            } else {
              ElMessage.error(`同步账号信息失败: ${result.error || '请稍后重试'}`)
            }
          })
        }, 1000) // 只等待 1 秒（原来是 2 秒）
      } else {
        // 登录失败，关闭连接
        closeSSEConnection()

        // 2秒后重置状态，允许重试
        setTimeout(() => {
          sseConnecting.value = false
          qrCodeData.value = ''
          loginStatus.value = ''
        }, 2000)
      }
    }
  }

  // 监听错误
  eventSource.onerror = (error) => {
    console.error('SSE连接错误:', error)
    ElMessage.error('连接服务器失败，请稍后再试')
    closeSSEConnection()
    sseConnecting.value = false
  }
}

// 提交账号表单
const submitAccountForm = () => {
  accountFormRef.value.validate(async (valid) => {
    if (valid) {
      if (dialogType.value === 'add') {
        // 建立SSE连接，使用 groupName 作为 accountName (id)
        connectSSE(accountForm.platform, accountForm.groupName, accountForm.groupName)
      } else {
        // 编辑账号逻辑
        try {
          // 将平台名称转换为类型数字
          // 注意：映射必须与 stores/account.js 中的 platformTypes 保持一致
          // 1=小红书, 2=视频号, 3=抖音, 4=快手
          const platformTypeMap = {
            '小红书': 1,
            '视频号': 2,
            '抖音': 3,
            '快手': 4
          };
          const type = platformTypeMap[accountForm.platform] || 1;

          const res = await accountApi.updateAccount({
            id: accountForm.id,
            type: type,
            userName: accountForm.name
          })
          if (res.code === 200) {
            // 更新状态管理中的账号
            const updatedAccount = {
              id: accountForm.id,
              name: accountForm.name,
              platform: accountForm.platform,
              status: accountForm.status // Keep the existing status
            };
            accountStore.updateAccount(accountForm.id, updatedAccount)
            ElMessage.success('更新成功')
            dialogVisible.value = false
            // 刷新账号列表
            fetchAccounts()
          } else {
            ElMessage.error(res.msg || '更新账号失败')
          }
        } catch (error) {
          console.error('更新账号失败:', error)
          ElMessage.error('更新账号失败')
        }
      }
    } else {
      return false
    }
  })
}

// 组件卸载前关闭SSE连接
onBeforeUnmount(() => {
  closeSSEConnection()
})
</script>

<style scoped>
.account-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

/* 状态告警样式 */
.el-alert {
  margin-bottom: 20px;
}

/* 状态统计卡片样式 */
.status-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 150px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-content {
  text-align: center;
  padding: 20px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.normal-card .stat-number {
  color: #67c23a;
}

.exception-card .stat-number {
  color: #f56c6c;
}

.verifying-card .stat-number {
  color: #409eff;
}

.total-card .stat-number {
  color: #909399;
}

/* 刷新进度样式 */
.refresh-progress {
  margin: 15px 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.progress-text {
  display: block;
  text-align: right;
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

/* 账号列表样式 */
.account-list-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.account-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.account-list {
  margin-top: 20px;
}

/* 状态标签样式增强 */
.clickable-status {
  cursor: pointer;
  transition: all 0.3s ease;
}

.clickable-status:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.refreshing-status {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 空数据样式 */
.empty-data {
  padding: 40px 0;
  text-align: center;
}

/* 标签页样式 */
.account-tabs-nav {
  background-color: #fff;
  border-radius: 8px 8px 0 0;
  padding: 0 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .account-search {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    justify-content: center;
  }

  .status-stats {
    flex-direction: column;
  }

  .stat-card {
    min-width: auto;
  }

  /* 在小屏幕下调整表格操作列的间距 */
  .cell {
    margin-top: 6px;
    margin-bottom: 6px;

    .el-button {
      margin-right: 6px;
      font-size: 12px;
      padding: 4px 8px;
    }
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .cell {
    margin-top: 4px;
    margin-bottom: 4px;

    .el-button {
      margin-right: 4px;
      font-size: 11px;
      padding: 3px 6px;
    }
  }
}
</style>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.account-management {
  .page-header {
    margin-bottom: 20px;

    h1 {
      font-size: 24px;
      color: $text-primary;
      margin: 0;
    }
  }

  .account-tabs {
    background-color: #fff;
    border-radius: 4px;
    box-shadow: $box-shadow-light;

    .account-tabs-nav {
      padding: 20px;
    }
  }

  .account-list-container {
    .account-search {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;

      .el-input {
        width: 300px;
      }

      .action-buttons {
        display: flex;
        gap: 10px;

        .el-icon.is-loading {
          animation: rotate 1s linear infinite;
        }
      }
    }
  }

  // 表格操作列样式
  .cell {
    margin-top: 8px;
    margin-bottom: 8px;

    .el-button {
      margin-right: 8px;

      &:last-child {
        margin-right: 0;
      }
    }
  }

  .account-list {
    margin-bottom: 20px;

    .el-table {
      .el-icon.is-loading {
        animation: rotate 1s linear infinite;
      }
    }

    .empty-data {
      padding: 40px 0;
    }
  }

  // 二维码容器样式
  .clickable-status {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
    }
  }

  .qrcode-container {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 250px;

    .qrcode-wrapper {
      text-align: center;

      .qrcode-tip {
        margin-bottom: 15px;
        color: #606266;
      }

      .qrcode-image {
        max-width: 200px;
        max-height: 200px;
        border: 1px solid #ebeef5;
        background-color: black;
      }
    }

    .loading-wrapper, .success-wrapper, .error-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;

      .el-icon {
        font-size: 48px;

        &.is-loading {
          animation: rotate 1s linear infinite;
        }
      }

      span {
        font-size: 16px;
      }
    }

    .success-wrapper .el-icon {
      color: #67c23a;
    }

    .error-wrapper .el-icon {
      color: #f56c6c;
    }
  }
}
</style>