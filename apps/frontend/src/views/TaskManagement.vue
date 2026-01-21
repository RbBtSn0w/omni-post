<template>
  <div class="task-management">
    <div class="page-header">
      <h1>任务管理中心</h1>
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
        <el-button
          type="danger"
          @click="handleClearCompleted"
          size="small"
        >
          清空已完成任务
        </el-button>
      </div>
    </div>

    <div class="task-management-content">
      <!-- 任务统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon">
                <el-icon><List /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ taskStats.total }}</div>
                <div class="stat-label">任务总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon completed">
                <el-icon><CircleCheckFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ taskStats.completed }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon in-progress">
                <el-icon><Loading /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ taskStats.inProgress }}</div>
                <div class="stat-label">进行中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon failed">
                <el-icon><CircleCloseFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ taskStats.failed }}</div>
                <div class="stat-label">已失败</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 任务筛选和搜索区域 -->
      <div class="task-filter-bar">
        <el-form :inline="true" :model="taskFilter" size="small">
          <el-form-item label="状态">
            <el-select v-model="taskFilter.status" placeholder="请选择状态" @change="handleFilterChange">
              <el-option label="全部" value="all"></el-option>
              <el-option label="等待中" value="waiting"></el-option>
              <el-option label="上传中" value="uploading"></el-option>
              <el-option label="处理中" value="processing"></el-option>
              <el-option label="已完成" value="completed"></el-option>
              <el-option label="已失败" value="failed"></el-option>
              <el-option label="已取消" value="cancelled"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="平台">
            <el-select v-model="taskFilter.platform" placeholder="请选择平台" @change="handleFilterChange">
              <el-option label="全部" value="all"></el-option>
              <el-option v-for="platform in platforms" :key="platform" :label="platform" :value="platform"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="优先级">
            <el-select v-model="taskFilter.priority" placeholder="请选择优先级" @change="handleFilterChange">
              <el-option label="全部" value="all"></el-option>
              <el-option label="低" value="0"></el-option>
              <el-option label="正常" value="1"></el-option>
              <el-option label="高" value="2"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="taskSearch"
              placeholder="搜索任务名称或ID"
              clearable
              @input="handleSearchChange"
              style="width: 300px;"
            >
              <template #append>
                <el-button @click="handleSearchChange"><el-icon><Search /></el-icon></el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="resetFilter">重置筛选</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 任务列表 -->
      <el-table
        :data="filteredTasks"
        style="width: 100%"
        stripe
        border
      >
        <el-table-column prop="id" label="任务ID" width="200" show-overflow-tooltip />
        <el-table-column prop="title" label="任务名称" width="300" show-overflow-tooltip />
        <el-table-column label="平台" width="200">
          <template #default="scope">
            <el-tag
              v-for="platform in (scope.row.platformNames || [])"
              :key="platform"
              size="small"
              :type="getPlatformTagType(platform)"
              effect="plain"
              class="platform-tag"
            >
              {{ platform }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="statusText" label="状态" width="120">
          <template #default="scope">
            <el-tag
              :type="getStatusTagType(scope.row.status)"
              size="small"
            >
              {{ scope.row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="150">
          <template #default="scope">
            <el-progress
              :percentage="scope.row.progress"
              :stroke-width="6"
            />
          </template>
        </el-table-column>
        <el-table-column prop="priorityText" label="优先级" width="120">
          <template #default="scope">
            <el-tag
              :type="scope.row.priority === 2 ? 'danger' : scope.row.priority === 1 ? 'primary' : 'info'"
              size="small"
            >
              {{ scope.row.priorityText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="viewTaskDetail(scope.row)">
              <el-icon><InfoFilled /></el-icon>
              详情
            </el-button>
            <el-button
              size="small"
              type="primary"
              v-if="['waiting', 'failed'].includes(scope.row.status)"
              @click="startTask(scope.row)"
            >
              <el-icon><VideoPlay /></el-icon>
              {{ scope.row.status === 'failed' ? '重试' : '开始' }}
            </el-button>
            <el-button
              size="small"
              v-if="['uploading', 'processing'].includes(scope.row.status)"
              @click="pauseTask(scope.row)"
            >
              <el-icon><VideoPause /></el-icon>
              暂停
            </el-button>
            <el-button
              size="small"
              type="danger"
              v-if="scope.row.status !== 'completed' && scope.row.status !== 'cancelled'"
              @click="cancelTask(scope.row)"
            >
              <el-icon><Delete /></el-icon>
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 任务列表分页 -->
      <div class="task-pagination">
        <el-pagination
          v-model:current-page="taskPagination.currentPage"
          v-model:page-size="taskPagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredTasksForCount.length"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 任务详情弹窗 -->
    <el-dialog
      v-model="taskDetailsVisible"
      title="任务详情"
      width="800px"
      class="task-details-dialog"
    >
      <div v-if="selectedTask" class="task-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务ID">{{ selectedTask.id }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ selectedTask.title }}</el-descriptions-item>
          <el-descriptions-item label="平台">
            <el-tag
              v-for="platform in selectedTask.platformNames"
              :key="platform"
              size="small"
              class="platform-tag"
            >
              {{ platform }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="getStatusTagType(selectedTask.status)"
              size="small"
            >
              {{ selectedTask.statusText }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进度">{{ selectedTask.progress }}%</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag
              :type="selectedTask.priority === 2 ? 'danger' : selectedTask.priority === 1 ? 'primary' : 'info'"
              size="small"
            >
              {{ selectedTask.priorityText }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedTask.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(selectedTask.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="文件列表">
            <div class="file-list">
              <el-tag
                v-for="(file, index) in selectedTask.fileList"
                :key="index"
                size="small"
                class="file-tag"
              >
                {{ file.name }}
              </el-tag>
              <div v-if="selectedTask.fileList.length === 0" class="empty-files">暂无文件</div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="选中账号">
            <div class="account-list">
              <el-tag
                v-for="(accountId, index) in selectedTask.selectedAccounts"
                :key="index"
                size="small"
                class="account-tag"
              >
                {{ accountId }}
              </el-tag>
              <div v-if="selectedTask.selectedAccounts.length === 0" class="empty-accounts">暂无账号</div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="话题">
            <div class="topic-list">
              <el-tag
                v-for="(topic, index) in selectedTask.selectedTopics"
                :key="index"
                size="small"
                class="topic-tag"
              >
                #{{ topic }}
              </el-tag>
              <div v-if="selectedTask.selectedTopics.length === 0" class="empty-topics">暂无话题</div>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="taskDetailsVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  CircleCheckFilled, CircleCloseFilled,
  Delete, InfoFilled,
  List,
  Loading,
  Search,
  VideoPause,
  VideoPlay
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, onUnmounted, ref } from 'vue'

// 导入任务状态管理
import { useTaskStore } from '@/stores/task'

// 获取任务状态管理
const taskStore = useTaskStore()

// 加载状态
const loading = ref(false)

// 平台列表
const platforms = ref(['快手', '抖音', '视频号', '小红书'])

// 任务筛选条件
const taskFilter = ref({
  status: 'all',
  platform: 'all',
  priority: 'all'
})

// 任务搜索关键词
const taskSearch = ref('')

// 任务列表分页数据
const taskPagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 任务详情弹窗
const taskDetailsVisible = ref(false)
const selectedTask = ref(null)

// 任务统计数据 - 从taskStore获取
const taskStats = computed(() => taskStore.taskStats)

// 过滤后的任务列表（用于总数统计）
const filteredTasksForCount = computed(() => {
  let result = [...taskStore.tasks]

  // 按状态过滤
  if (taskFilter.value.status !== 'all') {
    result = result.filter(task => task.status === taskFilter.value.status)
  }

  // 按平台过滤
  if (taskFilter.value.platform !== 'all') {
    result = result.filter(task => task.platformNames.includes(taskFilter.value.platform))
  }

  // 按优先级过滤
  if (taskFilter.value.priority !== 'all') {
    result = result.filter(task => task.priority === parseInt(taskFilter.value.priority))
  }

  // 按搜索关键词过滤
  if (taskSearch.value) {
    const keyword = taskSearch.value.toLowerCase()
    result = result.filter(task =>
      task.title?.toLowerCase().includes(keyword) ||
      task.id?.toLowerCase().includes(keyword) ||
      task.platformNames.some(p => p.toLowerCase().includes(keyword))
    )
  }

  return result
})

// 过滤后的任务列表
const filteredTasks = computed(() => {
  const result = filteredTasksForCount.value

  // 按优先级和创建时间排序
  return result.sort((a, b) => {
    // 先按优先级排序
    const priorityDiff = b.priority - a.priority
    if (priorityDiff !== 0) {
      return priorityDiff
    }
    // 再按创建时间排序
    return new Date(b.createdAt) - new Date(a.createdAt)
  }).slice(
    (taskPagination.value.currentPage - 1) * taskPagination.value.pageSize,
    taskPagination.value.currentPage * taskPagination.value.pageSize
  )
})

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 分页变化处理
const handlePageChange = (page) => {
  taskPagination.value.currentPage = page
}

// 页面大小变化处理
const handleSizeChange = (size) => {
  taskPagination.value.pageSize = size
  taskPagination.value.currentPage = 1
}

// 筛选条件变化处理
const handleFilterChange = () => {
  taskPagination.value.currentPage = 1
}

// 搜索关键词变化处理
const handleSearchChange = () => {
  taskPagination.value.currentPage = 1
}

// 重置筛选条件
const resetFilter = () => {
  taskFilter.value = {
    status: 'all',
    platform: 'all',
    priority: 'all'
  }
  taskSearch.value = ''
  taskPagination.value.currentPage = 1
}

// 根据平台获取标签类型
const getPlatformTagType = (platform) => {
  const typeMap = {
    '快手': 'success',
    '抖音': 'danger',
    '视频号': 'warning',
    '小红书': 'info'
  }
  return typeMap[platform] || 'info'
}

// 根据状态获取标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    'waiting': 'info',
    'uploading': 'primary',
    'processing': 'primary',
    'completed': 'success',
    'failed': 'danger',
    'cancelled': 'warning'
  }
  return typeMap[status] || 'info'
}

// 查看任务详情
const viewTaskDetail = (task) => {
  selectedTask.value = task
  taskDetailsVisible.value = true
}

// 开始任务
const startTask = (task) => {
  ElMessageBox.confirm(
    `确定要${task.status === 'failed' ? '重试' : '开始'}任务 ${task.title} 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  )
    .then(async () => {
      loading.value = true
      try {
        const success = await taskStore.startTask(task.id)
        if (success) {
          ElMessage({
            type: 'success',
            message: `任务已开始${task.status === 'failed' ? '重试' : ''}`,
          })
        } else {
          ElMessage.error('启动任务失败')
        }
      } catch (error) {
        console.error('启动任务出错:', error)
        ElMessage.error('启动任务出错')
      } finally {
        loading.value = false
      }
    })
    .catch(() => {
      // 取消操作
      ElMessage.info('已取消操作')
    })
}

// 暂停任务
const pauseTask = (task) => {
  ElMessageBox.confirm(
    `确定要暂停任务 ${task.title} 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  )
    .then(() => {
      // 使用taskStore更新任务状态
      taskStore.updateTaskStatus(task.id, 'waiting')

      ElMessage({
        type: 'success',
        message: '任务已暂停',
      })
    })
    .catch(() => {
      // 取消操作
      ElMessage.info('已取消操作')
    })
}

// 取消任务
const cancelTask = (task) => {
  ElMessageBox.confirm(
    `确定要取消任务 ${task.title} 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      // 使用taskStore更新任务状态
      taskStore.updateTaskProgress(task.id, 0, 'cancelled')

      ElMessage({
        type: 'success',
        message: '任务已取消',
      })
    })
    .catch(() => {
      // 取消操作
      ElMessage.info('已取消操作')
    })
}

// 刷新数据
const handleRefresh = async () => {
  loading.value = true
  try {
    // 强制刷新数据
    await taskStore.fetchTasks()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 清空已完成任务
const handleClearCompleted = () => {
  ElMessageBox.confirm(
    '确定要清空所有已完成任务吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      const clearedCount = await taskStore.clearCompletedTasks()
      ElMessage.success(`已清空 ${clearedCount} 个已完成任务`)
    })
    .catch(() => {
      // 取消操作
      ElMessage.info('已取消操作')
    })
}

// 初始化数据
const initData = async () => {
  loading.value = true
  try {
    await taskStore.fetchTasks()
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('初始化数据失败')
  } finally {
    loading.value = false
  }
}

// 组件挂载时初始化数据
onMounted(async () => {
  await initData()
  if (taskStore.hasActiveTasks()) {
    taskStore.startPolling()
  }
})

// 组件卸载时停止轮询
onUnmounted(() => {
  // 注意：全局轮询可以不在这里停止，或者根据业务决定是否保留
  // 如果希望离开任务管理页面也继续后台更新，可以不调 stopPolling
  // 但为了节省流量和性能，通常离开页面建议停止，除非有全局通知需求
  taskStore.stopPolling()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.task-management {
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

  .task-management-content {
    .stats-row {
      margin-bottom: 20px;
    }

    .stat-card {
      height: 120px;
      margin-bottom: 20px;

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

          &.completed {
            background-color: rgba($success-color, 0.1);

            .el-icon {
              color: $success-color;
            }
          }

          &.in-progress {
            background-color: rgba($warning-color, 0.1);

            .el-icon {
              color: $warning-color;
            }
          }

          &.failed {
            background-color: rgba($danger-color, 0.1);

            .el-icon {
              color: $danger-color;
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
    }

    .task-filter-bar {
      background-color: #f5f7fa;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 15px;

      .el-form-item {
        margin-right: 15px;
        margin-bottom: 10px;
      }
    }

    .platform-tag {
      margin-right: 5px;
      margin-bottom: 5px;
    }

    .task-pagination {
      margin-top: 15px;
      display: flex;
      justify-content: flex-end;
    }

    .task-details {
      .platform-tag {
        margin-right: 5px;
        margin-bottom: 5px;
      }

      .file-list, .account-list, .topic-list {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;

        .file-tag, .account-tag, .topic-tag {
          margin-bottom: 5px;
        }

        .empty-files, .empty-accounts, .empty-topics {
          color: $text-secondary;
          font-style: italic;
        }
      }
    }
  }
}
</style>
