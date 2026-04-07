<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>自媒体自动化运营系统</h1>
      <div class="header-actions">
        <el-button
          type="primary"
          icon="Refresh"
          :loading="loading"
          @click="handleRefresh"
          size="small"
        >
          刷新数据
        </el-button>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- 顶部：关键数据概览 -->
      <el-row :gutter="20" class="top-section">
        <!-- 账号统计卡片 -->
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ accountStats.total }}</div>
                <div class="stat-label">账号总数</div>
              </div>
            </div>
            <div class="stat-footer">
              <div class="stat-detail">
                <span>正常: {{ accountStats.normal }}</span>
                <span>异常: {{ accountStats.abnormal }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 平台统计卡片 -->
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon platform-icon">
                <el-icon><Platform /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ platformTotal }}</div>
                <div class="stat-label">平台总数</div>
              </div>
            </div>
            <div class="stat-footer">
              <div class="stat-detail">
                <el-tooltip content="快手账号" placement="top">
                  <el-tag size="small" type="success">{{ platformStats.kuaishou }}</el-tag>
                </el-tooltip>
                <el-tooltip content="抖音账号" placement="top">
                  <el-tag size="small" type="danger">{{ platformStats.douyin }}</el-tag>
                </el-tooltip>
                <el-tooltip content="微信视频号账号" placement="top">
                  <el-tag size="small" type="warning">{{ platformStats.wx_channels }}</el-tag>
                </el-tooltip>
                <el-tooltip content="小红书账号" placement="top">
                  <el-tag size="small" type="info">{{ platformStats.xiaohongshu }}</el-tag>
                </el-tooltip>
                <el-tooltip content="Bilibili账号" placement="top">
                  <el-tag size="small" type="primary">{{ platformStats.bilibili }}</el-tag>
                </el-tooltip>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 任务统计卡片 -->
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon task-icon">
                <el-icon><List /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ taskStats.total }}</div>
                <div class="stat-label">任务总数</div>
              </div>
            </div>
            <div class="stat-footer">
              <div class="stat-detail">
                <span>完成: {{ taskStats.completed }}</span>
                <span>进行中: {{ taskStats.inProgress }}</span>
                <span>失败: {{ taskStats.failed }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 内容统计卡片 -->
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon content-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ contentStats.total }}</div>
                <div class="stat-label">内容总数</div>
              </div>
            </div>
            <div class="stat-footer">
              <div class="stat-detail">
                <span>已发布: {{ contentStats.published }}</span>
                <span>草稿: {{ contentStats.draft }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 中部：核心功能区域 -->
      <el-row :gutter="20" class="middle-section">
        <!-- 左侧：数据统计图表 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <div class="stats-charts section">
            <div class="section-header">
              <h2>数据统计</h2>
            </div>
            <el-row :gutter="20">
              <!-- 任务趋势图表 -->
              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <el-card class="chart-card">
                  <template v-slot:header>
<div  class="chart-header">
                    <span>任务趋势（近7天）</span>
                  </div>
</template>
                  <v-chart
                    :option="taskTrendData"
                    autoresize
                    style="height: 300px;"
                  />
                </el-card>
              </el-col>

              <!-- 内容发布统计图表 -->
              <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <el-card class="chart-card">
                  <template v-slot:header>
<div  class="chart-header">
                    <span>内容发布统计</span>
                  </div>
</template>
                  <v-chart
                    :option="contentStatsData"
                    autoresize
                    style="height: 300px;"
                  />
                </el-card>
              </el-col>
            </el-row>
          </div>


        </el-col>

        <!-- 右侧：动态信息区域 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <!-- 系统通知区域 -->
          <div class="system-notifications section">
            <div class="section-header">
              <h2>系统通知</h2>
              <el-button text size="small">查看全部</el-button>
            </div>

            <el-scrollbar height="300px" class="notifications-scrollbar">
              <div class="notification-list">
                <el-skeleton :rows="3" animated v-if="loading" style="margin-bottom: 10px;"></el-skeleton>
                <el-alert
                  v-for="notification in systemNotifications"
                  :key="notification.id"
                  :title="notification.title"
                  :description="notification.content"
                  :type="notification.type"
                  :closable="true"
                  :close-text="'关闭'"
                  effect="light"
                  show-icon
                  @close="closeNotification(notification.id)"
                  @click="handleNotificationClick(notification)"
                  class="notification-item"
                >
                  <template #action>
                    <span class="notification-time">{{ notification.time }}</span>
                  </template>
                </el-alert>
                <div v-if="!loading && systemNotifications.length === 0" class="empty-notifications">
                  <el-empty description="暂无通知"></el-empty>
                </div>
              </div>
            </el-scrollbar>
          </div>

          <!-- 最近任务概览 -->
          <div class="recent-tasks section">
            <div class="section-header">
              <h2>最近任务</h2>
              <div class="task-actions">
                <el-button type="primary" text size="small" @click="navigateTo('/task-management')">查看全部任务</el-button>
              </div>
            </div>

            <!-- 任务概览统计 -->
            <div class="task-overview-stats">
              <el-row :gutter="10" style="margin-bottom: 15px;">
                <el-col :xs="6" :sm="6" :md="6" :lg="6" :xl="6">
                  <div class="overview-stat-item">
                    <div class="stat-value">{{ taskStats.total }}</div>
                    <div class="stat-label">总任务数</div>
                  </div>
                </el-col>
                <el-col :xs="6" :sm="6" :md="6" :lg="6" :xl="6">
                  <div class="overview-stat-item completed">
                    <div class="stat-value">{{ taskStats.completed }}</div>
                    <div class="stat-label">已完成</div>
                  </div>
                </el-col>
                <el-col :xs="6" :sm="6" :md="6" :lg="6" :xl="6">
                  <div class="overview-stat-item in-progress">
                    <div class="stat-value">{{ taskStats.inProgress }}</div>
                    <div class="stat-label">进行中</div>
                  </div>
                </el-col>
                <el-col :xs="6" :sm="6" :md="6" :lg="6" :xl="6">
                  <div class="overview-stat-item failed">
                    <div class="stat-value">{{ taskStats.failed }}</div>
                    <div class="stat-label">已失败</div>
                  </div>
                </el-col>
              </el-row>
            </div>

            <!-- 最近任务列表 -->
            <el-card class="task-list-card" shadow="hover">
              <el-table :data="recentTasks.slice(0, 5)" style="width: 100%" :show-header="false" :border="false" stripe>
                <el-table-column prop="title" label="任务名称" min-width="150" show-overflow-tooltip>
                  <template #default="scope">
                    <div class="task-title">
                      <el-tag
                        v-if="scope.row.platformNames && scope.row.platformNames.length > 0"
                        :type="getPlatformTagType(scope.row.platformNames[0])"
                        effect="plain"
                        size="small"
                        class="task-platform-tag"
                      >
                        {{ scope.row.platformNames[0] }}
                      </el-tag>
                      <span>{{ scope.row.title }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="statusText" label="状态" width="80">
                  <template #default="scope">
                    <el-tag
                      :type="getStatusTagType(scope.row.status)"
                      effect="plain"
                      size="small"
                    >
                      {{ scope.row.statusText }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="60">
                  <template #default="scope">
                    <el-button
                      size="small"
                      @click="viewTaskDetail(scope.row)"
                      text
                    >
                      <el-icon><InfoFilled /></el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loading && recentTasks.length === 0" class="empty-tasks">
                <el-empty description="暂无任务" size="small"></el-empty>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import {
    PLATFORM_NAMES,
    PlatformType,
    getPlatformTagType as getTagType
} from '@/core/platformConstants'
import {
    Document, InfoFilled,
    List,
    Platform,
    User
} from '@element-plus/icons-vue'
import { BarChart, LineChart } from 'echarts/charts'
import {
    GridComponent,
    LegendComponent,
    TitleComponent,
    TooltipComponent
} from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { useRouter } from 'vue-router'; // 导入图标

// 注册必要的组件
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()

// 导入账号状态管理
import { useAccountStore } from '@/stores/account'
// 导入任务状态管理
import { useTaskStore } from '@/stores/task'
// 导入dashboard API
import { dashboardApi } from '@/api/dashboard'
// 导入account API
import { accountApi } from '@/api/account'
// 导入全局数据缓存服务
import dataCache from '@/utils/dataCache'

// 获取账号状态管理
const accountStore = useAccountStore()
// 获取任务状态管理
const taskStore = useTaskStore()

// 账号统计数据 - 使用 ref 以支持从 API 更新和本地计算
const accountStats = ref({
  total: 0,
  normal: 0,
  abnormal: 0
})

// 平台统计数据 - 使用 ref 以支持从 API 更新和本地计算
const platformStats = ref({
  kuaishou: 0,
  douyin: 0,
  wx_channels: 0,
  xiaohongshu: 0,
  bilibili: 0
})

// 任务统计数据 - 使用 ref
const taskStats = ref({
  total: 0,
  completed: 0,
  inProgress: 0,
  failed: 0
})

// 同步 Store 数据到本地 Ref 的函数
const syncFromStores = () => {
  const accounts = accountStore.accounts
  accountStats.value = {
    total: accounts.length,
    normal: accounts.filter(acc => acc.status === '正常').length,
    abnormal: accounts.filter(acc => acc.status === '异常').length
  }

  platformStats.value = {
    kuaishou: accounts.filter(acc => acc.platform === PLATFORM_NAMES[PlatformType.KUAISHOU]).length,
    douyin: accounts.filter(acc => acc.platform === PLATFORM_NAMES[PlatformType.DOUYIN]).length,
    wx_channels: accounts.filter(acc => acc.platform === PLATFORM_NAMES[PlatformType.WX_CHANNELS]).length,
    xiaohongshu: accounts.filter(acc => acc.platform === PLATFORM_NAMES[PlatformType.XIAOHONGSHU]).length,
    bilibili: accounts.filter(acc => acc.platform === PLATFORM_NAMES[PlatformType.BILIBILI]).length
  }

  const storeStats = taskStore.taskStats
  taskStats.value = { ...storeStats }
}

// 监听 Store 变化以保持数据同步
watch(() => accountStore.accounts, syncFromStores, { deep: true })
watch(() => taskStore.taskStats, (newStats) => {
  taskStats.value = { ...newStats }
}, { deep: true })

// 计算平台总数
const platformTotal = computed(() => {
  return Object.values(platformStats.value).reduce((a, b) => a + b, 0)
})

// 内容统计数据 - TODO: 需要后端API支持
const contentStats = ref({
  total: 0,
  published: 0,
  draft: 0
})

// 最近任务数据 - 从taskStore获取
const recentTasks = computed(() => taskStore.recentTasks)

// 移除不再需要的函数：
// - handlePageChange
// - handleSizeChange
// - handleFilterChange
// - handleSearchChange
// - resetFilter

// 任务趋势图表数据
const taskTrendData = ref({
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '完成任务',
      data: [],
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#67C23A'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(103, 194, 58, 0.3)'
          }, {
            offset: 1, color: 'rgba(103, 194, 58, 0.1)'
          }]
        }
      }
    },
    {
      name: '失败任务',
      data: [],
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#F56C6C'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(245, 108, 108, 0.3)'
          }, {
            offset: 1, color: 'rgba(245, 108, 108, 0.1)'
          }]
        }
      }
    }
  ],
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['完成任务', '失败任务'],
    bottom: 0
  }
})

// 内容发布统计图表数据
const contentStatsData = ref({
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '已发布',
      data: [],
      type: 'bar',
      itemStyle: {
        color: '#67C23A'
      }
    },
    {
      name: '草稿',
      data: [],
      type: 'bar',
      itemStyle: {
        color: '#909399'
      }
    }
  ],
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['已发布', '草稿'],
    bottom: 0
  },
  grid: {
    containLabel: true
  }
})

// 系统通知数据 - 初始化为空，等待真实事件触发
const systemNotifications = ref([])

// 事件驱动的通知触发机制
const triggerNotification = (title, content, type = 'info') => {
  // 确保type是Element Plus支持的值
  const validTypes = ['primary', 'success', 'warning', 'error', 'info']
  const finalType = validTypes.includes(type) ? type : 'info'

  const newNotification = {
    id: Date.now(),
    title,
    content,
    time: new Date().toLocaleString('zh-CN'),
    type: finalType
  }

  // 添加到通知列表开头
  systemNotifications.value.unshift(newNotification)

  // 只保留最近10条通知
  if (systemNotifications.value.length > 10) {
    systemNotifications.value = systemNotifications.value.slice(0, 10)
  }

  // 设置自动关闭
  autoCloseNotification(newNotification.id)
}

// 加载状态
const loading = ref(false)

// 数据有效性验证
const validateStatsData = () => {
  // 验证账号统计数据
  accountStats.value = {
    total: Math.max(0, accountStats.value.total),
    normal: Math.max(0, Math.min(accountStats.value.normal, accountStats.value.total)),
    abnormal: Math.max(0, accountStats.value.total - accountStats.value.normal)
  }

  // 验证平台统计数据
  platformStats.value = {
    kuaishou: Math.max(0, platformStats.value.kuaishou),
    douyin: Math.max(0, platformStats.value.douyin),
    wx_channels: Math.max(0, platformStats.value.wx_channels),
    xiaohongshu: Math.max(0, platformStats.value.xiaohongshu),
    bilibili: Math.max(0, platformStats.value.bilibili)
  }

  // 验证任务统计数据
  const completed = Math.max(0, taskStats.value.completed)
  const inProgress = Math.max(0, taskStats.value.inProgress)
  const failed = Math.max(0, taskStats.value.total - completed - inProgress)
  const total = completed + inProgress + failed

  taskStats.value = {
    total,
    completed,
    inProgress,
    failed
  }

  // 验证内容统计数据
  const cTotal = Math.max(0, contentStats.value.total)
  const cPublished = Math.max(0, Math.min(contentStats.value.published, cTotal))
  const cDraft = Math.max(0, cTotal - cPublished)
  
  contentStats.value = {
    total: cPublished + cDraft,
    published: cPublished,
    draft: cDraft
  }
}

// 从API获取统计数据
const fetchStatsData = async () => {
  // 检查账号数据是否已过期，如果过期则需要更新账号数据
  if (accountStore.checkDataExpiry() || accountStore.accounts.length === 0) {
    try {
      // Dashboard 只需要显示数据，使用快速获取（不验证 Cookie）
      // 避免触发多个 Chrome 实例进行 Cookie 验证
      const res = await accountApi.getAccounts()
      if (res.code === 200 && res.data) {
        accountStore.setAccounts(res.data)
      }
    } catch (error) {
      console.error('获取账号数据失败:', error)
    }
  }

  // 检查任务数据是否已过期，如果过期则需要更新任务数据
  if (taskStore.checkDataExpiry() || taskStore.tasks.length === 0) {
    try {
      // 从API获取任务数据
      await taskStore.fetchTasks()
    } catch (error) {
      console.error('获取任务数据失败:', error)
    }
  }

  // 尝试从缓存获取数据
  const cachedData = dataCache.get('/')
  if (cachedData) {
    // 使用缓存数据，不显示加载状态
    updateDashboardData(cachedData)
    validateStatsData()
    return
  }

  // 缓存不存在或已过期，从API获取
  loading.value = true
  try {
    // 从真实API获取数据
    const res = await dashboardApi.getDashboardStats()

    // 更新缓存
    dataCache.set('/', res.data)

    // 更新仪表盘数据
    updateDashboardData(res.data)

    // 验证数据有效性
    validateStatsData()
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error({
      message: '获取统计数据失败，请稍后重试',
      duration: 3000
    })
    // 触发系统通知
    triggerNotification(
      '数据获取失败',
      '获取统计数据失败，请检查网络连接或稍后重试',
      'error'
    )
  } finally {
    loading.value = false
  }
}

// 更新仪表盘数据
const updateDashboardData = (data) => {
  // 更新账号统计
  if (data.accountStats) {
    accountStats.value = {
      total: data.accountStats.total,
      normal: data.accountStats.normal,
      abnormal: data.accountStats.abnormal
    }
  }

  // 更新平台统计
  if (data.platformStats) {
    platformStats.value = {
      kuaishou: data.platformStats.kuaishou,
      douyin: data.platformStats.douyin,
      wx_channels: data.platformStats.wx_channels,
      xiaohongshu: data.platformStats.xiaohongshu,
      bilibili: data.platformStats.bilibili || 0
    }
  }

  // 更新任务统计
  if (data.taskStats) {
    taskStats.value = {
      total: data.taskStats.total,
      completed: data.taskStats.completed,
      inProgress: data.taskStats.inProgress,
      failed: data.taskStats.failed
    }
  }

  // 更新内容统计
  if (data.contentStats) {
    contentStats.value = {
      total: data.contentStats.total,
      published: data.contentStats.published,
      draft: data.contentStats.draft
    }
  }

  // 更新任务趋势图表数据
  if (data.taskTrend) {
    taskTrendData.value.xAxis.data = data.taskTrend.xAxis
    taskTrendData.value.series[0].data = data.taskTrend.series[0].data
    taskTrendData.value.series[1].data = data.taskTrend.series[1].data
  }

  // 更新内容发布统计图表数据
  if (data.contentStatsData) {
    contentStatsData.value.xAxis.data = data.contentStatsData.xAxis
    contentStatsData.value.series[0].data = data.contentStatsData.series[0].data
    contentStatsData.value.series[1].data = data.contentStatsData.series[1].data
  }

  // 更新最近任务列表 - 使用taskStore
  if (data.recentTasks) {
    taskStore.setTasks(data.recentTasks)
  }
}

// 初始化数据
const initData = async () => {
  syncFromStores() // 先从本地 Store 同步初始数据
  await fetchStatsData()
}

// 定期更新数据
const startAutoUpdate = () => {
  // 每10分钟更新一次统计数据（基于数据有效期调整）
  const statsInterval = setInterval(() => {
    fetchStatsData()
  }, 10 * 60 * 1000)

  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(statsInterval)
  })
}

// 关闭通知
const closeNotification = (id) => {
  const index = systemNotifications.value.findIndex(notification => notification.id === id)
  if (index !== -1) {
    systemNotifications.value.splice(index, 1)
  }
}

// 自动关闭通知
const autoCloseNotification = (id) => {
  setTimeout(() => {
    closeNotification(id)
  }, 5000) // 5秒后自动关闭
}

// 通知点击处理
const handleNotificationClick = (notification) => {
  ElMessage.info(`点击了通知: ${notification.title}`)

  // 根据通知类型进行不同的跳转或操作
  if (notification.title.includes('发布成功')) {
    router.push('/content-management')
  } else if (notification.title.includes('发布失败')) {
    router.push('/task-management')
  } else if (notification.title.includes('系统更新')) {
    // 可以跳转到系统公告页面或显示详细信息
    ElMessageBox.alert(
      notification.content,
      notification.title,
      {
        confirmButtonText: '确定',
        type: notification.type
      }
    )
  }
}

// 手动刷新数据
const handleRefresh = async () => {
  loading.value = true
  // 清除缓存，强制从API获取最新数据
  dataCache.delete('/')
  await initData()
  ElMessage.success('数据刷新成功')
}

// 组件挂载时初始化数据并开始自动更新
onMounted(() => {
  initData()
  startAutoUpdate()

  // 为初始通知设置自动关闭
  systemNotifications.value.forEach(notification => {
    autoCloseNotification(notification.id)
  })
})

// 根据平台获取标签类型
const getPlatformTagType = (platform) => {
  return getTagType(platform)
}

// 根据状态获取标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    '已完成': 'success',
    '进行中': 'warning',
    '待执行': 'info',
    '已失败': 'danger'
  }
  return typeMap[status] || 'info'
}

// 导航到指定路由
const navigateTo = (path) => {
  router.push(path)
}

// 查看任务详情
const viewTaskDetail = (task) => {
  // 跳转到任务详情页面
  router.push(`/task-management/${task.id}`)
}

// 移除不再需要的任务操作函数：
// - executeTask
// - cancelTask
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.dashboard {
  .page-header {
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h1 {
        font-size: 24px;
        color: $text-primary;
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }

  .dashboard-content {
    /* 统一section样式 */
    .section {
      margin-bottom: 30px;
      background-color: #ffffff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 0 0 10px 0;
        border-bottom: 1px solid $border-lighter;

        h2 {
          font-size: 18px;
          font-weight: bold;
          color: $text-primary;
          margin: 0;
        }
      }
    }

    /* 顶部关键数据概览区域 */
    .top-section {
      margin-bottom: 30px;
    }

    /* 中部核心功能区域 */
    .middle-section {
      margin-bottom: 30px;
    }

    /* 统计卡片样式 */
    .stat-card {
      height: 140px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stat-card-content {
        display: flex;
        align-items: center;
        margin-bottom: 15px;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: rgba($primary-color, 0.1);
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 15px;

          .el-icon {
            font-size: 30px;
            color: $primary-color;
          }

          &.platform-icon {
            background-color: rgba($success-color, 0.1);

            .el-icon {
              color: $success-color;
            }
          }

          &.task-icon {
            background-color: rgba($warning-color, 0.1);

            .el-icon {
              color: $warning-color;
            }
          }

          &.content-icon {
            background-color: rgba($info-color, 0.1);

            .el-icon {
              color: $info-color;
            }
          }
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: $text-primary;
            line-height: 1.2;
          }

          .stat-label {
            font-size: 14px;
            color: $text-secondary;
          }
        }
      }

      .stat-footer {
        border-top: 1px solid $border-lighter;
        padding-top: 10px;

        .stat-detail {
          display: flex;
          justify-content: space-between;
          color: $text-secondary;
          font-size: 13px;

          .el-tag {
            margin-right: 5px;
          }
        }
      }
    }



    /* 数据统计图表 */
    .stats-charts {
      padding: 20px;

      .chart-card {
        margin-bottom: 20px;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .chart-header {
          font-weight: bold;
          color: $text-primary;
          padding: 12px 20px;
        }
      }
    }

    /* 系统通知区域 */
    .system-notifications {

      .notifications-scrollbar {
        border: 1px solid $border-base;
        border-radius: 6px;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
      }

      .notification-list {
        padding: 10px;

        .notification-item {
          margin-bottom: 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        }

        .notification-time {
          font-size: 12px;
          color: $text-secondary;
        }
      }
    }

    /* 最近任务区域 */
    .recent-tasks {

      .task-overview-stats {
        margin-bottom: 20px;

        .overview-stat-item {
          background-color: #f5f7fa;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
          transition: all 0.3s;
          cursor: pointer;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: $text-primary;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 13px;
            color: $text-secondary;
          }

          &.completed {
            .stat-value {
              color: $success-color;
            }
          }

          &.in-progress {
            .stat-value {
              color: $warning-color;
            }
          }

          &.failed {
            .stat-value {
              color: $danger-color;
            }
          }
        }
      }

      .task-list-card {
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .el-table {
          border: none;

          .el-table__header-wrapper {
            display: none;
          }

          .el-table__body-wrapper {
            padding: 10px 0;
          }

          .el-table__row {
            transition: all 0.3s;

            &:hover {
              background-color: rgba($primary-color, 0.05);
            }
          }

          .el-table__cell {
            border-bottom: 1px solid $border-lighter;
            padding: 12px 10px;
          }

          .el-table__cell:last-child {
            text-align: center;
          }
        }

        .task-title {
          display: flex;
          align-items: center;
          gap: 8px;

          .task-platform-tag {
            margin: 0;
          }

          span {
            font-size: 14px;
            color: $text-primary;
          }
        }

        .empty-tasks {
          padding: 20px 0;
          text-align: center;
        }
      }
    }
  }
}
</style>
