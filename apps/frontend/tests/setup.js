import { vi } from 'vitest'
import { createPinia } from 'pinia'
import { config } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 配置Vue测试工具
config.global.plugins = [ElementPlus]
config.global.stubs = {
  Transition: false,
  TransitionGroup: false
}

// 模拟 localStorage
global.localStorage = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// 模拟 sessionStorage
global.sessionStorage = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// 模拟 window 对象
global.window = {
  ...global.window,
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
  location: {
    href: 'http://localhost:5174/',
    origin: 'http://localhost:5174',
    protocol: 'http:',
    host: 'localhost:5174',
    hostname: 'localhost',
    port: '5174',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  },
  open: vi.fn(),
  confirm: vi.fn().mockReturnValue(true),
  alert: vi.fn(),
  // 添加hasFocus方法模拟，解决Element Plus组件依赖问题
  hasFocus: vi.fn().mockReturnValue(true)
}

// 模拟document方法，保留原始方法
global.document = {
  ...global.document,
  hasFocus: vi.fn().mockReturnValue(true),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  createElement: vi.fn(),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    contains: vi.fn()
  },
  head: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  getElementById: vi.fn(),
  createTextNode: vi.fn(),
  createComment: vi.fn(),
  createDocumentFragment: vi.fn(),
  importNode: vi.fn(),
  createEvent: vi.fn(),
  dispatchEvent: vi.fn(),
  activeElement: {
    hasAttribute: vi.fn()
  },
  documentElement: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    style: {}
  },
  defaultView: global.window
}

// 模拟 MutationObserver
global.MutationObserver = vi.fn().mockImplementation(function() {
  return {
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn().mockReturnValue([])
  };
});

// 模拟 ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(function() {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  };
});

// 保存原始的定时器函数
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;

// 模拟 setTimeout
global.setTimeout = vi.fn((fn, delay) => {
  return originalSetTimeout(fn, delay || 0);
});

global.setInterval = vi.fn((fn, interval) => {
  return originalSetInterval(fn, interval || 0);
});

global.clearTimeout = vi.fn((id) => {
  return originalClearTimeout(id);
});

global.clearInterval = vi.fn((id) => {
  return originalClearInterval(id);
});

// 模拟 fetch
global.fetch = vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue({ code: 200, data: {}, message: 'success' }),
  text: vi.fn().mockResolvedValue('{}'),
  status: 200,
  ok: true
})

// 模拟 console
global.console = {
  ...global.console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}

// 初始化 Pinia
const pinia = createPinia()
global.pinia = pinia



// 模拟 element-plus/icons-vue - 显式模拟所有需要的图标
vi.mock('@element-plus/icons-vue', () => {
  const mockIcon = {
    name: 'MockIcon',
    template: '<i class="el-icon"></i>'
  };
  
  // 显式列出所有需要的图标，确保它们作为命名导出可用
  return {
    // 基础图标
    Search: mockIcon,
    Refresh: mockIcon,
    ArrowDown: mockIcon,
    Loading: mockIcon,
    Download: mockIcon,
    Upload: mockIcon,
    Delete: mockIcon,
    Edit: mockIcon,
    Plus: mockIcon,
    Check: mockIcon,
    Close: mockIcon,
    InfoFilled: mockIcon,
    WarningFilled: mockIcon,
    ErrorFilled: mockIcon,
    SuccessFilled: mockIcon,
    
    // 额外需要的图标
    Grid: mockIcon,
    Management: mockIcon,
    RefreshRight: mockIcon,
    UploadFilled: mockIcon,
    DownloadFilled: mockIcon,
    Filter: mockIcon,
    Time: mockIcon,
    Calendar: mockIcon,
    More: mockIcon,
    Setting: mockIcon,
    Bell: mockIcon,
    User: mockIcon,
    Menu: mockIcon,
    HomeFilled: mockIcon,
    Document: mockIcon,
    Picture: mockIcon,
    VideoCamera: mockIcon,
    Share: mockIcon,
    Star: mockIcon,
    StarFilled: mockIcon,
    StarHalf: mockIcon,
    Like: mockIcon,
    LikeFilled: mockIcon,
    Dislike: mockIcon,
    DislikeFilled: mockIcon,
    Message: mockIcon,
    MessageFilled: mockIcon,
    ChatDotRound: mockIcon,
    Notification: mockIcon,
    NotificationFilled: mockIcon,
    Avatar: mockIcon,
    Crown: mockIcon,
    Medal: mockIcon,
    Trophy: mockIcon,
    Rank: mockIcon,
    Fire: mockIcon,
    Thumb: mockIcon,
    ThumbFilled: mockIcon,
    Good: mockIcon,
    GoodFilled: mockIcon,
    CirclePlus: mockIcon,
    CirclePlusFilled: mockIcon,
    CircleEdit: mockIcon,
    CircleDelete: mockIcon,
    CircleCheck: mockIcon,
    CircleClose: mockIcon,
    CircleInfoFilled: mockIcon,
    CircleWarningFilled: mockIcon,
    CircleErrorFilled: mockIcon,
    CircleSuccessFilled: mockIcon,
    Folder: mockIcon,
    
    // 默认导出
    default: {
      Search: mockIcon,
      Refresh: mockIcon,
      ArrowDown: mockIcon,
      Loading: mockIcon,
      Download: mockIcon,
      Upload: mockIcon,
      Delete: mockIcon,
      Edit: mockIcon,
      Plus: mockIcon,
      Check: mockIcon,
      Close: mockIcon,
      InfoFilled: mockIcon,
      WarningFilled: mockIcon,
      ErrorFilled: mockIcon,
      SuccessFilled: mockIcon,
      Grid: mockIcon,
      Management: mockIcon,
      Folder: mockIcon
    }
  };
});

// 修复 table 组件的 scoped slots 问题 - 简化版本，确保 scope.row 可用
vi.mock('element-plus', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    // 保留之前的模拟
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    },
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue(true),
      alert: vi.fn().mockResolvedValue(true),
      prompt: vi.fn().mockResolvedValue({ value: 'test' })
    },
    ElNotification: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    },
    ElLoading: {
      service: vi.fn().mockReturnValue({
        close: vi.fn()
      })
    },
    // 简化的表格组件模拟，确保 scope.row 始终有值
    ElTable: {
      name: 'ElTable',
      props: ['data'],
      template: '<div><slot></slot></div>'
    },
    ElTableColumn: {
      name: 'ElTableColumn',
      props: ['prop', 'label'],
      // 直接渲染插槽，传递带有默认值的 scope
      template: '<div><slot name="default" :row="defaultRow" :column="{}" :$index="0" :store="{}"></slot></div>',
      setup() {
        return {
          // 提供默认的 row 对象，确保 scope.row 始终可用
          defaultRow: {
            id: 1,
            name: 'test',
            platform: 'test',
            status: 'normal',
            isRefreshing: false,
            filesize: 100,
            platformNames: ['test1', 'test2']
          }
        };
      }
    }
  };
});

// 简化的组件模拟，专注于修复核心问题
// 移除了可能导致循环依赖的自定义 mount 函数

// 为 Vue Test Utils 提供更友好的错误处理
vi.stubGlobal('console.error', (msg) => {
  // 过滤掉 Element Plus 组件的一些警告，这些是测试环境的正常现象
  if (!msg.includes('Element Plus') && !msg.includes('el-') && !msg.includes('slot')) {
    console.error(msg);
  }
});