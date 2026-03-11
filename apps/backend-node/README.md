# OmniPost Backend (Node.js)

> TypeScript 重写版本 — 100% 功能对等的 Node.js 后端服务

## 技术栈

| 技术 | 用途 |
|------|------|
| **Express** | HTTP 服务框架 |
| **TypeScript** | 类型安全 |
| **better-sqlite3** | SQLite 数据库 |
| **Playwright** | 浏览器自动化（登录/上传） |
| **Vitest** | 测试框架 |
| **Winston** | 日志管理 |

## 快速启动

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产构建
npm run build
npm start

# 运行测试
npm test

# 类型检查
npm run typecheck
```

## 项目结构

```
src/
├── core/           # 核心配置、常量、浏览器工具、日志
├── db/             # 数据库管理与迁移
├── routes/         # Express 路由（account, cookie, dashboard, file, group, publish）
├── services/       # 业务逻辑层（auth, cookie, login, publish, task）
├── uploader/       # 平台上传器（douyin, tencent, xiaohongshu, kuaishou, bilibili）
├── utils/          # 工具函数（网络重试、调度时间计算）
├── app.ts          # Express 应用工厂
└── index.ts        # 服务器入口
tests/
├── setup.ts        # 测试基础设施
├── mock-services.ts # Mock 服务
└── *.test.ts       # 19 个测试文件（98 个测试）
```

## API 端点

所有路由挂载在 `/api` 前缀下：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/getDashboardStats` | GET | 仪表盘统计 |
| `/api/getAccounts` | GET | 获取所有账号 |
| `/api/getValidAccounts` | GET | 获取有效账号（含 Cookie 验证） |
| `/api/updateUserinfo` | POST | 更新账号信息 |
| `/api/deleteAccount` | GET | 删除账号 |
| `/api/getGroups` | GET | 获取所有组 |
| `/api/createGroup` | POST | 创建组 |
| `/api/updateGroup/:id` | PUT | 更新组 |
| `/api/deleteGroup/:id` | DELETE | 删除组 |
| `/api/upload` | POST | 上传文件 |
| `/api/getFiles` | GET | 获取文件列表 |
| `/api/deleteFile` | GET | 删除文件 |
| `/api/uploadCookie` | POST | 上传 Cookie |
| `/api/downloadCookie` | GET | 下载 Cookie |
| `/api/login` | GET (SSE) | 平台登录 |
| `/api/tasks` | GET | 获取任务列表 |
| `/api/tasks/:id` | DELETE/PATCH | 管理任务 |
| `/api/postVideo` | POST | 发布视频 |
| `/api/postVideoBatch` | POST | 批量发布 |

## 测试

```bash
npm test           # 运行全部 98 个测试
npm run test:watch # 监听模式
```

测试覆盖：常量、数据库、工具函数、TaskService、AuthService、CookieService、LoginService、所有路由端点、上传器结构、E2E 集成。
