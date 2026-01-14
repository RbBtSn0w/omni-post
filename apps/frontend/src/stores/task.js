import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { taskApi } from '@/api'

// 任务状态映射
const taskStatusMap = {
  'waiting': '等待中',
  'uploading': '上传中',
  'processing': '处理中',
  'completed': '已完成',
  'failed': '已失败',
  'cancelled': '已取消'
}

// 任务优先级映射
const priorityMap = {
  0: '低',
  1: '正常',
  2: '高'
}

// 平台映射
const platformMap = {
  1: '小红书',
  2: '视频号',
  3: '抖音',
  4: '快手'
}

export const useTaskStore = defineStore('task', () => {
  // 存储所有任务信息
  const tasks = ref([])

  // 最近任务列表（最多10条）
  const recentTasks = computed(() => {
    return [...tasks.value].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt)
    }).slice(0, 10)
  })

  // 数据有效期管理
  const dataExpiry = reactive({
    expiryTime: 30 * 60 * 1000, // 30分钟，单位毫秒
    lastFetchTime: null,         // 最后获取数据的时间
    isExpired: false             // 数据是否已过期
  })

  // 检查数据是否已过期
  const checkDataExpiry = () => {
    if (!dataExpiry.lastFetchTime) {
      dataExpiry.isExpired = true
      return true
    }

    const now = Date.now()
    const isExpired = (now - dataExpiry.lastFetchTime) > dataExpiry.expiryTime
    dataExpiry.isExpired = isExpired
    return isExpired
  }

  // 设置数据为已获取（更新最后获取时间）
  const setDataFetched = () => {
    dataExpiry.lastFetchTime = Date.now()
    dataExpiry.isExpired = false
  }

  // 从后端获取所有任务
  const fetchTasks = async () => {
    try {
      const response = await taskApi.getAllTasks()
      // 假设拦截器直接返回data或者 res.data
      const data = response.data || response
      if (Array.isArray(data)) {
        setTasks(data)
      } else if (data && Array.isArray(data.data)) {
        setTasks(data.data) // 如果后端包裹在 data 字段中
      }
    } catch (error) {
      console.error('Fetch tasks failed:', error)
    }
  }

  // 设置任务列表
  const setTasks = (tasksData) => {
    // 转换后端返回的数据格式为前端使用的格式
    const transformedTasks = tasksData.map(task => {
      // 兼容后端字段和前端字段
      const platforms = task.platforms || task.selectedPlatforms || []
      const fileList = task.file_list || task.fileList || []
      const accountList = task.account_list || task.selectedAccounts || []

      return {
        id: task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: task.title || '未命名任务',
        selectedPlatforms: platforms,
        status: task.status || 'waiting',
        statusText: taskStatusMap[task.status] || '未知',
        progress: task.progress || 0,
        priority: task.priority !== undefined ? task.priority : 1,
        priorityText: priorityMap[task.priority !== undefined ? task.priority : 1] || '正常',
        createdAt: task.created_at || task.createdAt || new Date().toISOString(),
        updatedAt: task.updated_at || task.updatedAt || new Date().toISOString(),
        // 扩展字段
        platformNames: platforms.map(key => platformMap[key] || '未知'),
        fileList: fileList,
        selectedAccounts: accountList,
        productLink: task.productLink || '',
        productTitle: task.productTitle || '',
        selectedTopics: task.selectedTopics || []
      }
    })

    tasks.value = transformedTasks
    setDataFetched()
  }

  // 添加单个任务
  const addTask = (task) => {
    if (!task) {
      console.error('无效的任务数据:', task)
      return
    }

    // 生成任务ID（如果没有）
    if (!task.id) {
      task.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // 转换任务数据格式
    const transformedTask = {
      id: task.id,
      title: task.title || '未命名任务',
      selectedPlatforms: task.selectedPlatforms || [],
      status: task.status || 'waiting',
      statusText: taskStatusMap[task.status] || '未知',
      progress: task.progress || 0,
      priority: task.priority || 1,
      priorityText: priorityMap[task.priority] || '正常',
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: task.updatedAt || new Date().toISOString(),
      platformNames: (task.selectedPlatforms || []).map(key => platformMap[key] || '未知'),
      fileList: task.fileList || [],
      selectedAccounts: task.selectedAccounts || [],
      productLink: task.productLink || '',
      productTitle: task.productTitle || '',
      selectedTopics: task.selectedTopics || []
    }

    tasks.value.push(transformedTask)
    setDataFetched()

    return transformedTask
  }

  // 更新单个任务
  const updateTask = (id, updatedTask) => {
    const index = tasks.value.findIndex(task => task.id === id)
    if (index !== -1) {
      // 转换更新的数据
      const transformedUpdate = { ...updatedTask }
      if (updatedTask.status) {
        transformedUpdate.statusText = taskStatusMap[updatedTask.status] || '未知'
      }
      if (updatedTask.priority !== undefined) {
        transformedUpdate.priorityText = priorityMap[updatedTask.priority] || '正常'
      }
      if (updatedTask.selectedPlatforms) {
        transformedUpdate.platformNames = updatedTask.selectedPlatforms.map(key => platformMap[key] || '未知')
      }

      // 更新任务
      tasks.value[index] = {
        ...tasks.value[index],
        ...transformedUpdate,
        updatedAt: new Date().toISOString()
      }

      setDataFetched()
      return tasks.value[index]
    }
    return null
  }

  // 更新任务进度
  const updateTaskProgress = (id, progress, status) => {
    return updateTask(id, { progress, status })
  }

  // 更新任务状态
  const updateTaskStatus = (id, status) => {
    return updateTask(id, { status })
  }

  // 删除任务（仅本地，用于内部）
  const deleteTaskLocal = (id) => {
    const index = tasks.value.findIndex(task => task.id === id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
      setDataFetched()
      return true
    }
    return false
  }

  // 删除任务（同步后端）
  const deleteTask = async (id) => {
    try {
      await taskApi.deleteTask(id)
      deleteTaskLocal(id)
      return true
    } catch (error) {
      console.error('删除任务失败:', error)
      return false
    }
  }

  // 取消任务（同步后端）
  const cancelTask = async (id) => {
    try {
      await taskApi.updateTaskStatus(id, 'cancelled')
      updateTask(id, { status: 'cancelled', progress: 0 })
      return true
    } catch (error) {
      console.error('取消任务失败:', error)
      return false
    }
  }

  // 批量删除任务（同步后端）
  const deleteTasks = async (ids) => {
    let deletedCount = 0
    for (const id of ids) {
      if (await deleteTask(id)) {
        deletedCount++
      }
    }
    return deletedCount
  }

  // 清空已结束任务（同步后端）
  const clearCompletedTasks = async () => {
    const completedTasks = tasks.value.filter(task =>
      ['completed', 'cancelled', 'failed'].includes(task.status)
    )
    let deletedCount = 0
    for (const task of completedTasks) {
      if (await deleteTask(task.id)) {
        deletedCount++
      }
    }
    return deletedCount
  }

  // 获取单个任务
  const getTaskById = (id) => {
    return tasks.value.find(task => task.id === id)
  }

  // 根据状态获取任务
  const getTasksByStatus = (status) => {
    return tasks.value.filter(task => task.status === status)
  }

  // 获取任务统计数据
  const taskStats = computed(() => {
    const total = tasks.value.length
    const completed = tasks.value.filter(task => task.status === 'completed').length
    const inProgress = tasks.value.filter(task => ['uploading', 'processing'].includes(task.status)).length
    const failed = tasks.value.filter(task => task.status === 'failed').length

    return {
      total,
      completed,
      inProgress,
      failed
    }
  })

  // 生成任务趋势数据（最近7天）
  const taskTrend = computed(() => {
    // 生成最近7天的日期
    const dates = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    // 初始化趋势数据
    const trendData = {
      xAxis: dates,
      series: [
        {
          name: '完成任务',
          data: dates.map(() => 0),
          type: 'line',
          smooth: true
        },
        {
          name: '失败任务',
          data: dates.map(() => 0),
          type: 'line',
          smooth: true
        }
      ]
    }

    // 统计每天的任务数
    tasks.value.forEach(task => {
      const taskDate = task.createdAt.split('T')[0]
      const dateIndex = dates.indexOf(taskDate)

      if (dateIndex !== -1) {
        if (task.status === 'completed') {
          trendData.series[0].data[dateIndex]++
        } else if (task.status === 'failed') {
          trendData.series[1].data[dateIndex]++
        }
      }
    })

    return trendData
  })

  return {
    tasks,
    recentTasks,
    taskStats,
    taskTrend,
    dataExpiry,
    checkDataExpiry,
    setDataFetched,
    setTasks,
    addTask,
    updateTask,
    updateTaskProgress,
    updateTaskStatus,
    deleteTask,
    cancelTask,
    deleteTasks,
    clearCompletedTasks,
    getTaskById,
    getTasksByStatus,
    fetchTasks
  }
})