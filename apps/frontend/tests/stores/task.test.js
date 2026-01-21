import { useTaskStore } from '@/stores/task'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Task Store', () => {
  let taskStore

  // 在每个测试前初始化Pinia和任务存储
  beforeEach(() => {
    // 创建Pinia实例
    const pinia = createPinia()
    // 设置为活跃的Pinia实例
    setActivePinia(pinia)
    // 创建任务存储实例
    taskStore = useTaskStore()
  })

  // 测试初始状态
  describe('Initial State', () => {
    it('should initialize with empty tasks array', () => {
      expect(taskStore.tasks).toEqual([])
    })

    it('should initialize with empty recentTasks computed property', () => {
      expect(taskStore.recentTasks).toEqual([])
    })

    it('should initialize with correct taskStats', () => {
      expect(taskStore.taskStats).toEqual({
        total: 0,
        completed: 0,
        inProgress: 0,
        failed: 0
      })
    })

    it('should initialize with correct dataExpiry settings', () => {
      expect(taskStore.dataExpiry.expiryTime).toBe(30 * 60 * 1000) // 30分钟
      expect(taskStore.dataExpiry.lastFetchTime).toBeNull()
      expect(taskStore.dataExpiry.isExpired).toBe(false)
    })
  })

  // 测试任务添加功能
  describe('Task Addition', () => {
    it('should add a new task correctly', () => {
      const task = {
        title: '测试任务',
        selectedPlatforms: [1, 2],
        status: 'waiting',
        priority: 1
      }

      const addedTask = taskStore.addTask(task)

      expect(taskStore.tasks.length).toBe(1)
      expect(taskStore.tasks[0].id).toBeDefined()
      expect(taskStore.tasks[0].title).toBe('测试任务')
      expect(taskStore.tasks[0].platformNames).toEqual(['小红书', '视频号'])
      expect(taskStore.tasks[0].statusText).toBe('等待中')
      expect(taskStore.tasks[0].priorityText).toBe('正常')
      expect(addedTask).toEqual(taskStore.tasks[0])
    })

    it('should handle empty task data', () => {
      const addedTask = taskStore.addTask({})

      expect(taskStore.tasks.length).toBe(1)
      expect(addedTask.title).toBe('未命名任务')
      expect(addedTask.status).toBe('waiting')
      expect(addedTask.priority).toBe(1)
    })

    it('should not add invalid task', () => {
      // 使用vi.spyOn模拟console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      taskStore.addTask(null)

      expect(taskStore.tasks.length).toBe(0)
      expect(consoleSpy).toHaveBeenCalledWith('无效的任务数据:', null)

      // 恢复原始console.error
      consoleSpy.mockRestore()
    })
  })

  // 测试任务更新功能
  describe('Task Update', () => {
    beforeEach(() => {
      // 添加测试任务
      taskStore.addTask({
        id: 'test-task-1',
        title: '原始任务',
        selectedPlatforms: [1],
        status: 'waiting',
        priority: 1
      })
    })

    it('should update task correctly', () => {
      const updatedTask = taskStore.updateTask('test-task-1', {
        title: '更新后的任务',
        status: 'completed',
        priority: 2
      })

      expect(updatedTask).not.toBeNull()
      expect(updatedTask.title).toBe('更新后的任务')
      expect(updatedTask.status).toBe('completed')
      expect(updatedTask.statusText).toBe('已完成')
      expect(updatedTask.priority).toBe(2)
      expect(updatedTask.priorityText).toBe('高')
      expect(updatedTask.updatedAt).toBeDefined()
    })

    it('should update task platforms correctly', () => {
      const updatedTask = taskStore.updateTask('test-task-1', {
        selectedPlatforms: [2, 3]
      })

      expect(updatedTask.platformNames).toEqual(['视频号', '抖音'])
    })

    it('should return null when updating non-existent task', () => {
      const result = taskStore.updateTask('non-existent-task', {
        title: '测试更新'
      })

      expect(result).toBeNull()
    })

    it('should update task progress correctly', async () => {
      // Mock the API call that updateTaskProgress makes internally
      const { taskApi } = await import('@/api/task')
      vi.spyOn(taskApi, 'updateTaskStatus').mockResolvedValue({})

      const updatedTask = await taskStore.updateTaskProgress('test-task-1', 50)

      expect(updatedTask.progress).toBe(50)
    })

    it('should update task status correctly', () => {
      const updatedTask = taskStore.updateTaskStatus('test-task-1', 'processing')

      expect(updatedTask.status).toBe('processing')
      expect(updatedTask.statusText).toBe('处理中')
    })
  })

  // 测试任务删除功能
  describe('Task Deletion', () => {
    // Mock taskApi before each test
    beforeEach(() => {
      vi.mock('@/api', () => ({
        taskApi: {
          deleteTask: vi.fn().mockResolvedValue({ code: 200 }),
          updateTaskStatus: vi.fn().mockResolvedValue({ code: 200 }),
          getAllTasks: vi.fn().mockResolvedValue({ data: [] })
        }
      }))
    })

    describe('Single Task Deletion', () => {
      beforeEach(() => {
        // 添加测试任务
        taskStore.addTask({ id: 'test-task-1', title: '任务1', status: 'completed' })
        taskStore.addTask({ id: 'test-task-2', title: '任务2', status: 'processing' })
        taskStore.addTask({ id: 'test-task-3', title: '任务3', status: 'failed' })
        taskStore.addTask({ id: 'test-task-4', title: '任务4', status: 'cancelled' })
        taskStore.addTask({ id: 'test-task-5', title: '任务5', status: 'cancelled' })
      })

      it('should delete a single completed task correctly', async () => {
        const result = await taskStore.deleteTask('test-task-1')

        expect(result).toBe(true)
        expect(taskStore.tasks.length).toBe(4)
        expect(taskStore.tasks.find(t => t.id === 'test-task-1')).toBeUndefined()
        expect(taskStore.getTasksByStatus('completed').length).toBe(0)
      })

      it('should delete a single cancelled task correctly', async () => {
        const result = await taskStore.deleteTask('test-task-4')

        expect(result).toBe(true)
        expect(taskStore.tasks.length).toBe(4)
        expect(taskStore.tasks.find(t => t.id === 'test-task-4')).toBeUndefined()
        expect(taskStore.getTasksByStatus('cancelled').length).toBe(1)
      })

      it('should return true when API succeeds even for non-existent local task', async () => {
        const result = await taskStore.deleteTask('non-existent-task')

        // API call succeeds (mocked), so returns true even if task doesn't exist locally
        expect(result).toBe(true)
        expect(taskStore.tasks.length).toBe(5) // No local task was removed
      })

      it('should delete multiple tasks with different statuses correctly', async () => {
        const result = await taskStore.deleteTasks(['test-task-1', 'test-task-4', 'test-task-2'])

        expect(result).toBe(3)
        expect(taskStore.tasks.length).toBe(2)
        expect(taskStore.tasks.find(t => t.id === 'test-task-1')).toBeUndefined()
        expect(taskStore.tasks.find(t => t.id === 'test-task-4')).toBeUndefined()
        expect(taskStore.tasks.find(t => t.id === 'test-task-2')).toBeUndefined()
      })
    })

    describe('Clear Completed Tasks', () => {
      it('should clear completed tasks correctly with only completed tasks', async () => {
        // 前置条件：只有已完成任务
        taskStore.addTask({ id: 'test-task-1', title: '任务1', status: 'completed' })
        taskStore.addTask({ id: 'test-task-2', title: '任务2', status: 'completed' })

        const result = await taskStore.clearCompletedTasks()

        expect(result).toBe(2)
        expect(taskStore.tasks.length).toBe(0)
        expect(taskStore.getTasksByStatus('completed').length).toBe(0)
      })

      it('should clear cancelled tasks correctly with only cancelled tasks', async () => {
        // 前置条件：只有已取消任务
        taskStore.addTask({ id: 'test-task-1', title: '任务1', status: 'cancelled' })
        taskStore.addTask({ id: 'test-task-2', title: '任务2', status: 'cancelled' })

        const result = await taskStore.clearCompletedTasks()

        expect(result).toBe(2)
        expect(taskStore.tasks.length).toBe(0)
        expect(taskStore.getTasksByStatus('cancelled').length).toBe(0)
      })

      it('should clear both completed and cancelled tasks correctly', async () => {
        // 前置条件：混合状态任务
        taskStore.addTask({ id: 'test-task-1', title: '任务1', status: 'completed' })
        taskStore.addTask({ id: 'test-task-2', title: '任务2', status: 'cancelled' })
        taskStore.addTask({ id: 'test-task-3', title: '任务3', status: 'processing' })
        taskStore.addTask({ id: 'test-task-4', title: '任务4', status: 'failed' })

        const result = await taskStore.clearCompletedTasks()

        expect(result).toBe(3) // completed + cancelled + failed
        expect(taskStore.tasks.length).toBe(1)
      })

      it('should return 0 when no completed or cancelled tasks to clear', async () => {
        // 前置条件：没有已完成或已取消任务
        taskStore.addTask({ id: 'test-task-1', title: '任务1', status: 'processing' })
        taskStore.addTask({ id: 'test-task-2', title: '任务2', status: 'waiting' })

        const result = await taskStore.clearCompletedTasks()

        expect(result).toBe(0)
        expect(taskStore.tasks.length).toBe(2)
      })

      it('should return 0 when no tasks at all', async () => {
        // 前置条件：空任务列表
        const result = await taskStore.clearCompletedTasks()

        expect(result).toBe(0)
        expect(taskStore.tasks.length).toBe(0)
      })

      it('should clear mixed status tasks correctly with various combinations', async () => {
        // 前置条件：多种状态组合
        taskStore.addTask({ id: 'test-task-1', title: '任务1', status: 'completed' })
        taskStore.addTask({ id: 'test-task-2', title: '任务2', status: 'cancelled' })
        taskStore.addTask({ id: 'test-task-3', title: '任务3', status: 'completed' })
        taskStore.addTask({ id: 'test-task-4', title: '任务4', status: 'cancelled' })
        taskStore.addTask({ id: 'test-task-5', title: '任务5', status: 'waiting' })
        taskStore.addTask({ id: 'test-task-6', title: '任务6', status: 'uploading' })
        taskStore.addTask({ id: 'test-task-7', title: '任务7', status: 'failed' })

        const result = await taskStore.clearCompletedTasks()

        expect(result).toBe(5) // completed x2 + cancelled x2 + failed x1
        expect(taskStore.tasks.length).toBe(2)
        expect(taskStore.getTasksByStatus('completed').length).toBe(0)
        expect(taskStore.getTasksByStatus('cancelled').length).toBe(0)
        expect(taskStore.getTasksByStatus('waiting').length).toBe(1)
        expect(taskStore.getTasksByStatus('uploading').length).toBe(1)
        expect(taskStore.getTasksByStatus('failed').length).toBe(0)
      })
    })

    describe('Delete Tasks by Status', () => {
      beforeEach(() => {
        taskStore.addTask({ id: 'test-task-1', title: '任务1', status: 'completed' })
        taskStore.addTask({ id: 'test-task-2', title: '任务2', status: 'cancelled' })
        taskStore.addTask({ id: 'test-task-3', title: '任务3', status: 'completed' })
        taskStore.addTask({ id: 'test-task-4', title: '任务4', status: 'cancelled' })
        taskStore.addTask({ id: 'test-task-5', title: '任务5', status: 'processing' })
      })

      it('should get all completed tasks correctly', () => {
        const completedTasks = taskStore.getTasksByStatus('completed')
        expect(completedTasks.length).toBe(2)
        expect(completedTasks.every(t => t.status === 'completed')).toBe(true)
      })

      it('should get all cancelled tasks correctly', () => {
        const cancelledTasks = taskStore.getTasksByStatus('cancelled')
        expect(cancelledTasks.length).toBe(2)
        expect(cancelledTasks.every(t => t.status === 'cancelled')).toBe(true)
      })

      it('should delete all completed tasks using deleteTasks', async () => {
        const completedTaskIds = taskStore.getTasksByStatus('completed').map(t => t.id)
        const result = await taskStore.deleteTasks(completedTaskIds)

        expect(result).toBe(2)
        expect(taskStore.getTasksByStatus('completed').length).toBe(0)
      })

      it('should delete all cancelled tasks using deleteTasks', async () => {
        const cancelledTaskIds = taskStore.getTasksByStatus('cancelled').map(t => t.id)
        const result = await taskStore.deleteTasks(cancelledTaskIds)

        expect(result).toBe(2)
        expect(taskStore.getTasksByStatus('cancelled').length).toBe(0)
      })
    })
  })

  // 测试任务查询功能
  describe('Task Query', () => {
    beforeEach(() => {
      // 添加测试任务
      taskStore.addTask({ id: 'test-task-1', title: '任务1', status: 'completed', createdAt: '2023-10-01T10:00:00Z' })
      taskStore.addTask({ id: 'test-task-2', title: '任务2', status: 'processing', createdAt: '2023-10-02T10:00:00Z' })
      taskStore.addTask({ id: 'test-task-3', title: '任务3', status: 'failed', createdAt: '2023-10-03T10:00:00Z' })
    })

    it('should get task by id correctly', () => {
      const task = taskStore.getTaskById('test-task-2')

      expect(task).not.toBeUndefined()
      expect(task.id).toBe('test-task-2')
      expect(task.title).toBe('任务2')
    })

    it('should return undefined for non-existent task', () => {
      const task = taskStore.getTaskById('non-existent-task')

      expect(task).toBeUndefined()
    })

    it('should get tasks by status correctly', () => {
      const completedTasks = taskStore.getTasksByStatus('completed')
      const processingTasks = taskStore.getTasksByStatus('processing')
      const failedTasks = taskStore.getTasksByStatus('failed')
      const nonExistentStatusTasks = taskStore.getTasksByStatus('unknown')

      expect(completedTasks.length).toBe(1)
      expect(processingTasks.length).toBe(1)
      expect(failedTasks.length).toBe(1)
      expect(nonExistentStatusTasks.length).toBe(0)
    })

    it('should get recent tasks correctly', () => {
      expect(taskStore.recentTasks.length).toBe(3)
      expect(taskStore.recentTasks[0].id).toBe('test-task-3') // 最新的任务
      expect(taskStore.recentTasks[2].id).toBe('test-task-1') // 最旧的任务
    })
  })

  // 测试任务统计功能
  describe('Task Statistics', () => {
    beforeEach(() => {
      // 添加测试任务
      taskStore.addTask({ id: 'test-task-1', title: '任务1', status: 'completed' })
      taskStore.addTask({ id: 'test-task-2', title: '任务2', status: 'processing' })
      taskStore.addTask({ id: 'test-task-3', title: '任务3', status: 'uploading' })
      taskStore.addTask({ id: 'test-task-4', title: '任务4', status: 'failed' })
      taskStore.addTask({ id: 'test-task-5', title: '任务5', status: 'waiting' })
    })

    it('should calculate task stats correctly', () => {
      expect(taskStore.taskStats).toEqual({
        total: 5,
        completed: 1,
        inProgress: 2, // processing + uploading
        failed: 1
      })
    })
  })

  // 测试数据有效期管理
  describe('Data Expiry', () => {
    it('should check data expiry correctly', () => {
      // 初始状态下数据应该过期
      expect(taskStore.checkDataExpiry()).toBe(true)
      expect(taskStore.dataExpiry.isExpired).toBe(true)

      // 设置数据为已获取
      taskStore.setDataFetched()

      // 刚获取的数据不应过期
      expect(taskStore.checkDataExpiry()).toBe(false)
      expect(taskStore.dataExpiry.isExpired).toBe(false)
    })

    it('should expire data after specified time', () => {
      // 设置数据为已获取
      taskStore.setDataFetched()

      // 模拟时间流逝超过30分钟
      const pastTime = Date.now() - (30 * 60 * 1000 + 1000)
      taskStore.dataExpiry.lastFetchTime = pastTime

      // 数据应该过期
      expect(taskStore.checkDataExpiry()).toBe(true)
      expect(taskStore.dataExpiry.isExpired).toBe(true)
    })
  })

  // 测试任务趋势数据
  describe('Task Trend', () => {
    it('should return correct trend data with no tasks', () => {
      // 生成最近7天的日期用于验证
      const dates = []
      const now = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        dates.push(date.toISOString().split('T')[0])
      }

      const trendData = taskStore.taskTrend

      // 验证xAxis是否为最近7天的日期
      expect(trendData.xAxis).toEqual(dates)

      // 验证series数据结构
      expect(trendData.series).toHaveLength(2)
      expect(trendData.series[0].name).toBe('完成任务')
      expect(trendData.series[0].data).toEqual(Array(7).fill(0))
      expect(trendData.series[1].name).toBe('失败任务')
      expect(trendData.series[1].data).toEqual(Array(7).fill(0))
    })

    it('should return correct trend data with tasks', () => {
      // 生成最近7天的日期
      const dates = []
      const now = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        dates.push(date.toISOString().split('T')[0])
      }

      // 添加测试任务
      taskStore.setTasks([
        // 今天的完成任务
        {
          id: 'test-task-1',
          title: '任务1',
          status: 'completed',
          createdAt: `${dates[6]}T10:00:00Z`
        },
        // 今天的失败任务
        {
          id: 'test-task-2',
          title: '任务2',
          status: 'failed',
          createdAt: `${dates[6]}T11:00:00Z`
        },
        // 3天前的完成任务
        {
          id: 'test-task-3',
          title: '任务3',
          status: 'completed',
          createdAt: `${dates[3]}T09:00:00Z`
        },
        // 3天前的失败任务
        {
          id: 'test-task-4',
          title: '任务4',
          status: 'failed',
          createdAt: `${dates[3]}T14:00:00Z`
        },
        // 3天前的另一个完成任务
        {
          id: 'test-task-5',
          title: '任务5',
          status: 'completed',
          createdAt: `${dates[3]}T16:00:00Z`
        },
        // 8天前的任务（不在最近7天内）
        {
          id: 'test-task-6',
          title: '任务6',
          status: 'completed',
          createdAt: `${new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()}`
        }
      ])

      const trendData = taskStore.taskTrend

      // 验证xAxis是否为最近7天的日期
      expect(trendData.xAxis).toEqual(dates)

      // 验证完成任务数据
      expect(trendData.series[0].data).toEqual([0, 0, 0, 2, 0, 0, 1])

      // 验证失败任务数据
      expect(trendData.series[1].data).toEqual([0, 0, 0, 1, 0, 0, 1])
    })

    it('should handle tasks with different statuses correctly', () => {
      // 生成最近7天的日期
      const dates = []
      const now = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        dates.push(date.toISOString().split('T')[0])
      }

      // 添加测试任务，包括各种状态
      taskStore.setTasks([
        {
          id: 'test-task-1',
          title: '任务1',
          status: 'completed',
          createdAt: `${dates[6]}T10:00:00Z`
        },
        {
          id: 'test-task-2',
          title: '任务2',
          status: 'failed',
          createdAt: `${dates[6]}T11:00:00Z`
        },
        {
          id: 'test-task-3',
          title: '任务3',
          status: 'processing',
          createdAt: `${dates[6]}T12:00:00Z`
        },
        {
          id: 'test-task-4',
          title: '任务4',
          status: 'waiting',
          createdAt: `${dates[6]}T13:00:00Z`
        },
        {
          id: 'test-task-5',
          title: '任务5',
          status: 'uploading',
          createdAt: `${dates[6]}T14:00:00Z`
        },
        {
          id: 'test-task-6',
          title: '任务6',
          status: 'cancelled',
          createdAt: `${dates[6]}T15:00:00Z`
        }
      ])

      const trendData = taskStore.taskTrend

      // 只有completed和failed状态的任务应该被统计
      expect(trendData.series[0].data[6]).toBe(1) // 完成任务
      expect(trendData.series[1].data[6]).toBe(1) // 失败任务

      // 其他状态的任务不应被统计
      for (let i = 0; i < 6; i++) {
        expect(trendData.series[0].data[i]).toBe(0)
        expect(trendData.series[1].data[i]).toBe(0)
      }
    })
  })

  // 测试批量任务操作
  describe('Batch Operations', () => {
    beforeEach(() => {
      // 添加测试任务
      for (let i = 1; i <= 5; i++) {
        taskStore.addTask({
          id: `test-task-${i}`,
          title: `任务${i}`,
          status: i % 2 === 0 ? 'completed' : 'processing'
        })
      }
    })

    it('should set tasks correctly', () => {
      const newTasks = [
        {
          id: 'new-task-1',
          title: '新任务1',
          selectedPlatforms: [1],
          status: 'completed'
        },
        {
          id: 'new-task-2',
          title: '新任务2',
          selectedPlatforms: [2],
          status: 'failed'
        }
      ]

      taskStore.setTasks(newTasks)

      expect(taskStore.tasks.length).toBe(2)
      expect(taskStore.tasks[0].id).toBe('new-task-1')
      expect(taskStore.tasks[1].id).toBe('new-task-2')
      expect(taskStore.dataExpiry.lastFetchTime).not.toBeNull()
    })

    it('should handle empty tasks array when setting tasks', () => {
      taskStore.setTasks([])

      expect(taskStore.tasks.length).toBe(0)
      expect(taskStore.taskStats.total).toBe(0)
    })
  })
})
