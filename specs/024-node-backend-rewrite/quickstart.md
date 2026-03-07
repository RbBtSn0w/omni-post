# Quickstart: Node.js TypeScript 后端

**Branch**: `024-node-backend-rewrite` | **Date**: 2026-03-07

## 前提条件

- Node.js >= 18 (LTS)
- npm >= 9
- Playwright browsers 已安装

## 快速启动

```bash
# 1. 进入新后端目录
cd apps/backend-node

# 2. 安装依赖
npm install

# 3. 安装 Playwright browsers
npx playwright install chromium

# 4. 初始化数据库
npm run db:init

# 5. 启动开发服务器
npm run dev
# 服务运行在 http://localhost:5409
```

## 运行测试

```bash
# 运行所有测试
npm test

# 运行测试（带覆盖率）
npm run test:coverage

# 运行单个测试文件
npx vitest run tests/test_account.test.ts
```

## 与前端联调

前端的 API 基础路径默认指向 `http://localhost:5409/api`。新后端使用相同端口和路径前缀，切换时只需：

1. 停止 Python 后端
2. 启动 Node.js 后端
3. 刷新前端页面

## 项目结构

```text
apps/backend-node/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── app.ts                    # Express 应用工厂
│   ├── index.ts                  # 入口文件
│   ├── core/
│   │   ├── config.ts             # 配置管理
│   │   ├── constants.ts          # 平台常量
│   │   ├── browser.ts            # Playwright 工具
│   │   └── logger.ts             # 日志配置
│   ├── db/
│   │   ├── database.ts           # 数据库管理
│   │   └── migrations.ts         # 表创建
│   ├── routes/
│   │   ├── account.ts
│   │   ├── cookie.ts
│   │   ├── dashboard.ts
│   │   ├── file.ts
│   │   ├── group.ts
│   │   └── publish.ts
│   ├── services/
│   │   ├── auth-service.ts
│   │   ├── cookie-service.ts
│   │   ├── login-impl.ts
│   │   ├── login-service.ts
│   │   ├── publish-executor.ts
│   │   ├── publish-service.ts
│   │   └── task-service.ts
│   ├── uploader/
│   │   ├── bilibili/main.ts
│   │   ├── douyin/main.ts
│   │   ├── kuaishou/main.ts
│   │   ├── tencent/main.ts
│   │   └── xiaohongshu/main.ts
│   └── utils/
│       ├── files-times.ts
│       ├── network.ts
│       └── stealth.min.js        # 复用 Python 后端的 stealth 脚本
└── tests/
    ├── conftest.ts               # 测试配置
    ├── mock-services.ts          # Mock 服务
    ├── test_account.test.ts
    ├── test_auth.test.ts
    ├── ... (对应 Python 33 个测试文件)
    └── test_uploaders_mock.test.ts
```
