# Implementation Plan: Node.js TypeScript 后端重写

**Branch**: `024-node-backend-rewrite` | **Date**: 2026-03-07 | **Spec**: [spec.md](file:///Users/snow/Documents/GitHub/omni-post/specs/024-node-backend-rewrite/spec.md)
**Input**: Feature specification from `/specs/024-node-backend-rewrite/spec.md`

## Summary

将 OmniPost 的 Python Flask 后端（`apps/backend/`）全部功能用 Node.js TypeScript 重写到新目录 `apps/backend-node/`。保留原 Python 后端不变。新后端提供 100% 兼容的 REST API（28个端点），使用 Express.js + better-sqlite3 + Playwright + Vitest 技术栈，遵循相同的三层架构（Routes → Services → Uploaders）。完成后基于 Python 的 33 个测试文件逻辑编写等价的 TypeScript 测试代码。

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >= 18 LTS
**Primary Dependencies**: Express.js 4.x, better-sqlite3, Playwright >= 1.50.0, multer, cors, winston, uuid
**Storage**: SQLite (与 Python 后端相同 schema)
**Testing**: Vitest (与前端测试生态统一)
**Target Platform**: macOS / Linux 服务器
**Project Type**: Web Service (REST API + SSE + Playwright 自动化)
**Performance Goals**: 与 Python 后端相同（单用户单任务模式）
**Constraints**: API 端点 100% 兼容，前端零修改
**Scale/Scope**: 28 个 API 端点, 7 个服务模块, 5 个平台上传器, 33+ 个测试文件

## Constitution Check

*GATE: ✅ 通过*

- **Principle I (三层架构)**: ✅ 新后端严格遵循 Routes → Services → Uploaders 模式。每层职责明确。
- **Principle II (上传器隔离)**: ✅ 5 个平台上传器各自独立目录 (`src/uploader/<platform>/main.ts`)，无交叉依赖。
- **Principle III (自动化测试)**: ✅ 基于 Python 33 个测试文件编写等价 TypeScript 测试，使用 Vitest。
- **Principle IV (异步线程安全)**: ✅ 使用 Worker Threads 执行后台发布任务，SSE 推送登录状态。
- **Principle V (Monorepo 纪律)**: ✅ 新后端独立于 `apps/backend-node/`，有自己的 `package.json`，不影响前端或 Python 后端依赖。

## Project Structure

### Documentation (this feature)

```text
specs/024-node-backend-rewrite/
├── spec.md              # 需求规格
├── plan.md              # 本文件 - 实施计划
├── research.md          # Phase 0 - 技术研究
├── data-model.md        # Phase 1 - 数据模型
├── quickstart.md        # Phase 1 - 快速启动
├── contracts/
│   └── api-endpoints.md # Phase 1 - API 契约
└── tasks.md             # Phase 2 - 任务列表 (待生成)
```

### Source Code (新增)

```text
apps/backend-node/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── app.ts                    # Express 应用工厂
│   ├── index.ts                  # 入口文件
│   ├── core/
│   │   ├── config.ts             # 配置 (对标 Python core/config.py)
│   │   ├── constants.ts          # 平台常量 (对标 Python core/constants.py)
│   │   ├── browser.ts            # Playwright 工具 (对标 Python core/browser.py)
│   │   └── logger.ts             # Winston 日志 (对标 Python core/logger.py)
│   ├── db/
│   │   ├── database.ts           # DB 管理 (对标 Python db/db_manager.py)
│   │   └── migrations.ts         # 建表 (对标 Python db/createTable.py)
│   ├── routes/
│   │   ├── account.ts            # 对标 Python routes/account.py (5 端点)
│   │   ├── cookie.ts             # 对标 Python routes/cookie.py (2 端点)
│   │   ├── dashboard.ts          # 对标 Python routes/dashboard.py (1 端点)
│   │   ├── file.ts               # 对标 Python routes/file.py (5 端点)
│   │   ├── group.ts              # 对标 Python routes/group.py (5 端点)
│   │   └── publish.ts            # 对标 Python routes/publish.py (7 端点)
│   ├── services/
│   │   ├── auth-service.ts       # 对标 Python services/auth_service.py
│   │   ├── cookie-service.ts     # 对标 Python services/cookie_service.py
│   │   ├── login-impl.ts         # 对标 Python services/login_impl.py
│   │   ├── login-service.ts      # 对标 Python services/login_service.py
│   │   ├── publish-executor.ts   # 对标 Python services/publish_executor.py
│   │   ├── publish-service.ts    # 对标 Python services/publish_service.py
│   │   └── task-service.ts       # 对标 Python services/task_service.py
│   ├── uploader/
│   │   ├── bilibili/main.ts      # 对标 Python uploader/bilibili_uploader/main.py
│   │   ├── douyin/main.ts        # 对标 Python uploader/douyin_uploader/main.py
│   │   ├── kuaishou/main.ts      # 对标 Python uploader/ks_uploader/main.py
│   │   ├── tencent/main.ts       # 对标 Python uploader/tencent_uploader/main.py
│   │   └── xiaohongshu/main.ts   # 对标 Python uploader/xiaohongshu_uploader/main.py
│   └── utils/
│       ├── files-times.ts        # 对标 Python utils/files_times.py
│       ├── network.ts            # 对标 Python utils/network.py
│       └── stealth.min.js        # 从 Python 后端复制（共享）
└── tests/
    ├── setup.ts                  # 测试配置 (对标 conftest.py)
    ├── mock-services.ts          # Mock 服务 (对标 mock_services.py)
    └── *.test.ts                 # 33+ 等价测试文件
```

## 文件对照表

### Python → TypeScript 映射

| Python 文件 | TypeScript 文件 | 说明 |
|-------------|----------------|------|
| `src/app.py` | `src/app.ts` | Flask → Express 应用工厂 |
| `src/core/config.py` | `src/core/config.ts` | 配置常量 |
| `src/core/constants.py` | `src/core/constants.ts` | 平台枚举 + 辅助函数 |
| `src/core/browser.py` | `src/core/browser.ts` | Playwright 启动/stealth/截图 |
| `src/core/logger.py` | `src/core/logger.ts` | loguru → winston |
| `src/db/db_manager.py` | `src/db/database.ts` | 数据库路径管理 |
| `src/db/createTable.py` | `src/db/migrations.ts` | 建表脚本 |
| `src/routes/account.py` | `src/routes/account.ts` | Blueprint → Router |
| `src/routes/cookie.py` | `src/routes/cookie.ts` | Blueprint → Router |
| `src/routes/dashboard.py` | `src/routes/dashboard.ts` | Blueprint → Router |
| `src/routes/file.py` | `src/routes/file.ts` | Blueprint → Router |
| `src/routes/group.py` | `src/routes/group.ts` | Blueprint → Router |
| `src/routes/publish.py` | `src/routes/publish.ts` | Blueprint → Router |
| `src/services/auth_service.py` | `src/services/auth-service.ts` | ABC → interface |
| `src/services/cookie_service.py` | `src/services/cookie-service.ts` | ABC → interface |
| `src/services/login_impl.py` | `src/services/login-impl.ts` | 平台登录具体逻辑 |
| `src/services/login_service.py` | `src/services/login-service.ts` | ABC → interface + Mock + Default |
| `src/services/publish_executor.py` | `src/services/publish-executor.ts` | threading → Worker Threads |
| `src/services/publish_service.py` | `src/services/publish-service.ts` | ABC → interface |
| `src/services/task_service.py` | `src/services/task-service.ts` | 任务 CRUD |
| `src/utils/files_times.py` | `src/utils/files-times.ts` | 定时发布时间计算 |
| `src/utils/network.py` | `src/utils/network.ts` | 异步重试装饰器 → 高阶函数 |
| `src/utils/stealth.min.js` | `src/utils/stealth.min.js` | 直接复制 |
| 5× `src/uploader/*/main.py` | 5× `src/uploader/*/main.ts` | Playwright 自动化上传 |

### 测试文件映射

| Python 测试 | TypeScript 测试 |
|------------|----------------|
| `tests/conftest.py` | `tests/setup.ts` |
| `tests/mock_services.py` | `tests/mock-services.ts` |
| `tests/test_account.py` | `tests/test_account.test.ts` |
| `tests/test_app_async_function.py` | `tests/test_app_async.test.ts` |
| `tests/test_app_e2e.py` | `tests/test_app_e2e.test.ts` |
| `tests/test_auth.py` | `tests/test_auth.test.ts` |
| `tests/test_auth_service.py` | `tests/test_auth_service.test.ts` |
| `tests/test_constants.py` | `tests/test_constants.test.ts` |
| `tests/test_cookie.py` | `tests/test_cookie.test.ts` |
| `tests/test_cookie_service_dispatch.py` | `tests/test_cookie_service_dispatch.test.ts` |
| `tests/test_dashboard.py` | `tests/test_dashboard.test.ts` |
| `tests/test_database.py` | `tests/test_database.test.ts` |
| `tests/test_file.py` | `tests/test_file.test.ts` |
| `tests/test_files_times.py` | `tests/test_files_times.test.ts` |
| `tests/test_get_tencent_cookie.py` | `tests/test_tencent_cookie.test.ts` |
| `tests/test_group_routes.py` | `tests/test_group_routes.test.ts` |
| `tests/test_login.py` | `tests/test_login.test.ts` |
| `tests/test_login_core.py` | `tests/test_login_core.test.ts` |
| `tests/test_login_mock.py` | `tests/test_login_mock.test.ts` |
| `tests/test_login_service.py` | `tests/test_login_service.test.ts` |
| `tests/test_login_service_dispatch.py` | `tests/test_login_service_dispatch.test.ts` |
| `tests/test_login_utils.py` | `tests/test_login_utils.test.ts` |
| `tests/test_network.py` | `tests/test_network.test.ts` |
| `tests/test_polling_timeout.py` | `tests/test_polling_timeout.test.ts` |
| `tests/test_postVideo.py` | `tests/test_post_video.test.ts` |
| `tests/test_publish_executor_integration.py` | `tests/test_publish_executor.test.ts` |
| `tests/test_qrcode_fetch.py` | `tests/test_qrcode_fetch.test.ts` |
| `tests/test_routes_account.py` | `tests/test_routes_account.test.ts` |
| `tests/test_routes_publish.py` | `tests/test_routes_publish.test.ts` |
| `tests/test_service_task.py` | `tests/test_service_task.test.ts` |
| `tests/test_uploaders_coverage.py` | `tests/test_uploaders_coverage.test.ts` |
| `tests/test_uploaders_mock.py` | `tests/test_uploaders_mock.test.ts` |
| `tests/test_utils_publish_executor.py` | `tests/test_utils_publish_executor.test.ts` |

## 实施阶段

### Phase 1: 项目基础设施 (预计 2 天)

1. 初始化 `apps/backend-node/` 项目（package.json, tsconfig.json, vitest.config.ts）
2. 实现 `src/core/config.ts` — 目录路径、服务器配置、浏览器配置
3. 实现 `src/core/constants.ts` — PlatformType 枚举、辅助函数
4. 实现 `src/core/logger.ts` — Winston 日志系统（按平台分文件）
5. 实现 `src/db/database.ts` — DatabaseManager 类
6. 实现 `src/db/migrations.ts` — 4 张表创建
7. 实现 `src/core/browser.ts` — Playwright 启动/stealth/截图工具
8. 实现 `src/utils/files-times.ts` — 定时发布时间计算
9. 实现 `src/utils/network.ts` — 异步重试高阶函数
10. 复制 `stealth.min.js` 到 `src/utils/`

### Phase 2: 服务层 (预计 3 天)

1. 实现 `src/services/task-service.ts` — TaskService 类（CRUD）
2. 实现 `src/services/auth-service.ts` — AuthService 接口 + DefaultAuthService
3. 实现 `src/services/cookie-service.ts` — CookieService 接口 + DefaultCookieService（5个平台验证）
4. 实现 `src/services/login-service.ts` — LoginService 接口 + MockLoginService + DefaultLoginService
5. 实现 `src/services/login-impl.ts` — 5个平台的具体登录逻辑
6. 实现 `src/services/publish-service.ts` — PublishService 接口 + DefaultPublishService（5个平台发布）
7. 实现 `src/services/publish-executor.ts` — 任务执行器（Worker Threads）

### Phase 3: 路由层 + 应用入口 (预计 2 天)

1. 实现 `src/app.ts` — Express 应用工厂（CORS、路由注册、静态文件）
2. 实现 `src/index.ts` — 服务器入口
3. 实现 `src/routes/dashboard.ts` — 1 个端点
4. 实现 `src/routes/account.ts` — 5 个端点
5. 实现 `src/routes/file.ts` — 5 个端点
6. 实现 `src/routes/cookie.ts` — 2 个端点
7. 实现 `src/routes/group.ts` — 5 个端点
8. 实现 `src/routes/publish.ts` — 7 个端点（含 SSE 登录）

### Phase 4: 上传器 (预计 3 天)

1. 实现 `src/uploader/douyin/main.ts`
2. 实现 `src/uploader/tencent/main.ts`
3. 实现 `src/uploader/xiaohongshu/main.ts`
4. 实现 `src/uploader/kuaishou/main.ts`
5. 实现 `src/uploader/bilibili/main.ts`

### Phase 5: 测试代码 (预计 4 天)

1. 实现 `tests/setup.ts` + `tests/mock-services.ts`
2. 编写 Core 层测试（constants, database, files_times, network）
3. 编写 Service 层测试（task, auth, cookie, login, publish）
4. 编写 Route 层测试（dashboard, account, file, cookie, group, publish）
5. 编写集成测试和 E2E 测试
6. 编写上传器 Mock 测试

### Phase 6: 功能对比验证 (预计 2 天)

1. 逐个运行 Python 和 TypeScript 测试套件，对比结果
2. 前端联调测试（切换到新后端验证所有页面）
3. 修复发现的差异问题

## Complexity Tracking

> 无宪法违规。
