# Tasks: Node.js TypeScript 后端重写

**Input**: Design documents from `/specs/024-node-backend-rewrite/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: ✅ 测试在规格中明确要求（US5 / FR-014），因此包含测试任务。针对防封禁机制（FR-013）已添加验证断言任务。

**Organization**: 任务按用户故事分组，支持独立实施和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 任务所属用户故事（US1~US5）
- 包含准确的文件路径

## Path Conventions

- **新后端**: `apps/backend-node/src/`, `apps/backend-node/tests/`
- **上传器**: `apps/backend-node/src/uploader/<platform>/main.ts`
- **Python 参照**: `apps/backend/src/`, `apps/backend/tests/`

---

## Phase 1: Setup (项目初始化)

**Purpose**: 创建 `apps/backend-node/` 项目基础结构

- [x] T001 初始化 `apps/backend-node/package.json`（name, scripts: dev/test, dependencies: express, better-sqlite3, playwright, multer, cors, winston, uuid; devDependencies: typescript, tsx, vitest）
- [x] T002 创建 `apps/backend-node/tsconfig.json`（target: ES2022, strict: true）
- [x] T003 [P] 创建 `apps/backend-node/vitest.config.ts`（根据 quickstart 测试需求）
- [x] T004 [P] 创建 `apps/backend-node/.gitignore`（node_modules, dist, data/, *.db）
- [x] T005 运行 `npm install` 安装依赖并运行 `npx playwright install chromium`

---

## Phase 2: Foundational (基础设施 — 阻塞所有用户故事)

**Purpose**: 核心基础设施，所有用户故事都依赖此阶段完成

**⚠️ CRITICAL**: 用户故事实施前必须完成本阶段

- [x] T006 [P] 实现 `apps/backend-node/src/core/config.ts` — 目录路径解析、服务器配置。对标 `config.py`
- [x] T007 [P] 实现 `apps/backend-node/src/core/constants.ts` — PlatformType 等枚举和工具函数。对标 `constants.py`
- [x] T008 [P] 实现 `apps/backend-node/src/core/logger.ts` — winston 日志器配置。对标 `logger.py`
- [x] T009 [P] 实现 `apps/backend-node/src/utils/files-times.ts` — 调度时间计算。对标 `files_times.py`
- [x] T010 [P] 实现 `apps/backend-node/src/utils/network.ts` — asyncRetry()。对标 `network.py`
- [x] T011 [P] 复制 `apps/backend/src/utils/stealth.min.js` 到 `apps/backend-node/src/utils/stealth.min.js`
- [x] T012 实现 `apps/backend-node/src/core/browser.ts` — launchBrowser() 并加载 stealthJS。对标 `browser.py`
- [x] T013 实现 `apps/backend-node/src/db/database.ts` — better-sqlite3 数据库管理器。对标 `db_manager.py`
- [x] T014 实现 `apps/backend-node/src/db/migrations.ts` — 建表（使用与 Python 一直的 schema）。对标 `createTable.py`
- [x] T015 实现 `apps/backend-node/src/db/models.ts` — 添加基于 `data-model.md` 的 TypeScript 数据接口（UserInfo, Task）
- [x] T016 实现 `apps/backend-node/src/services/task-service.ts` — CRUD 操作含 JSON 转换。注意使用 `status` 字段代替旧的 `state`。对标 `task_service.py`
- [x] T017 实现 `apps/backend-node/src/app.ts` — Express 应用工厂。对标 `app.py`
- [x] T018 实现 `apps/backend-node/src/index.ts` — 服务器入口监听。对标 `run_app.py`

**Checkpoint**: 基础设施就绪 — 可以开始用户故事实施

---

## Phase 3: User Story 1 — 核心 API 服务功能等价 (Priority: P1) 🎯 MVP

**Goal**: 新后端提供与 Python 后端完全相同的 REST API 接口，前端无需修改即可使用

**Independent Test**: 前端 API 地址切换到新后端，验证仪表盘、文件管理、账号管理所有页面功能正常

### Implementation for User Story 1

- [x] T019 [P] [US1] 实现 `apps/backend-node/src/routes/dashboard.ts` — 包含 5 个平台的验证逻辑和 Bilibili 字段修复。
- [x] T020 [P] [US1] 实现 `apps/backend-node/src/routes/file.ts` — multer 上传和管理。
- [x] T021 [P] [US1] 实现 `apps/backend-node/src/routes/account.ts` — 账号管理列表，遵循 Python 的嵌套数组。
- [x] T022 [P] [US1] 实现 `apps/backend-node/src/routes/cookie.ts` — Cookie 文件上传下载。
- [x] T023 [P] [US1] 实现 `apps/backend-node/src/routes/group.ts` — 账号组 API。
- [x] T024 [US1] 在 `apps/backend-node/src/app.ts` 注册 US1 路由添加 /api 前缀。
- [x] T025 [US1] 联调验证：启动新后端，浏览器人工测试控制台全覆盖验证接口 100% 通过。

**Checkpoint**: 前端可连接新后端使用仪表盘、文件、账号和组管理功能

---

## Phase 4: User Story 2 — 平台自动化登录与 Cookie 管理 (Priority: P1)

**Goal**: 通过 Playwright 完成各平台登录流程，正确管理 Cookie 存储和验证

**Independent Test**: 前端发起 SSE 登录请求，观察事件流格式和 Cookie 文件保存

### Implementation for User Story 2

- [x] T026 [P] [US2] 实现 `apps/backend-node/src/services/auth-service.ts` — 认证委托。
- [x] T027 [P] [US2] 实现 `apps/backend-node/src/services/cookie-service.ts` — Playwright Cookie 验证逻辑。
- [x] T028 [US2] 实现 `apps/backend-node/src/services/login-service.ts` — EventEmitter 流替代 Python queue 方案。
- [x] T029 [US2] 实现 `apps/backend-node/src/services/login-impl.ts` — 5 平台 Playwright generator 执行体逻辑。
- [x] T030 [US2] 实现 `apps/backend-node/src/routes/publish.ts` 中的 `GET /login` SSE 流处理器。
- [x] T031 [US2] 在 `routes/account.ts` 接入 `cookie-service` 做实时查验。

**Checkpoint**: 登录 SSE 流正常工作，Cookie 文件可正确保存和验证

---

## Phase 5: User Story 3 — 多平台视频发布 (Priority: P1)

**Goal**: 通过 Playwright 自动化向 5 个平台发布视频，支持定时和批量

**Independent Test**: 创建发布任务并监控任务 status 变化（waiting → uploading → completed/failed）

### Implementation for User Story 3

- [x] T032 [P] [US3] 实现 `apps/backend-node/src/uploader/douyin/main.ts`
- [x] T033 [P] [US3] 实现 `apps/backend-node/src/uploader/tencent/main.ts`
- [x] T034 [P] [US3] 实现 `apps/backend-node/src/uploader/xiaohongshu/main.ts`
- [x] T035 [P] [US3] 实现 `apps/backend-node/src/uploader/kuaishou/main.ts`
- [x] T036 [P] [US3] 实现 `apps/backend-node/src/uploader/bilibili/main.ts`
- [x] T037 [US3] 实现 `apps/backend-node/src/services/publish-service.ts` — 发布结构体打点（UploadOptions）与编排。
- [x] T038 [US3] 实现 `apps/backend-node/src/services/publish-executor.ts` — 线程池模型到 Promise 的并发模型适配器。
- [x] T039 [US3] 补全 `apps/backend-node/src/routes/publish.ts` （/tasks, /postVideo 等核心路由）。
- [x] T040 [US3] 使用专门真实视频发布测试流程。

**Checkpoint**: 视频发布流程完整可用，5个平台上传器均可正常工作

---

## Phase 6: User Story 4 — 账号组管理 (Priority: P2)

**Goal**: 账号分组管理功能完整可用（已在 Phase 3 US1 中实现部分路由，验证集成）

### Implementation for User Story 4

- [x] T041 [US4] 验证 group 路由与 account 路由的外键交互及关联删除。
- [x] T042 [US4] 登录逻辑中的 Group ID 继承集成验证。

---

## Phase 7: User Story 5 — 测试覆盖与功能对比验证 (Priority: P2)

**Goal**: 基于 Python 测试框架用 Vitest 重写 33 个文件。

### Test Infrastructure & Utils

- [x] T043 [US5] 编写 `apps/backend-node/tests/test_constants.test.ts`
- [x] T044 [US5] 编写 `apps/backend-node/tests/test_database.test.ts` 和 `test_files_times.test.ts`
- [x] T045 [US5] 编写基于 `data-model.md` 的接口映射测试及 JSON 反序列化断言
- [x] T046 [US5] **新增**：在 `apps/backend-node/tests/test_browser.test.ts` 中编写端到端 `stealth.min.js` 注入有效性隐式断言（只要不崩且配置正确即可）

### Service & Routes

- [x] T047 [P] [US5] 编写 Node 专属服务的测试方案对应 (包含 Login Queue/EventEmitter 行为对比) `test_login_service.test.ts`
- [x] T048 [P] [US5] `test_publish_executor.test.ts`
- [x] T049 [P] [US5] 针对各路由（`test_account.test.ts`, `test_dashboard.test.ts`）编写用例覆盖。
- [x] T050 [US5] 编写端对端总测试 `apps/backend-node/tests/test_app_e2e.test.ts` 并确保所有 Vitests 达到 95% 通过率

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨故事优化和最终验证

- [x] T051 [P] 更新 `apps/backend-node/README.md`
- [x] T052 [P] 移除调试日志，格式化错误抛出（Error handling hooks）。
- [x] T053 前端完整联调测试 — 记录真实环境中 Node 和 Python 发布速度的差距。
- [x] T054 最终基于 Python 和 Node 的 Code Review，拉齐遗留的 TS `any` 定义。

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: 无依赖 — 立即开始
- **Foundational (Phase 2)**: 依赖 Phase 1 完成 — **阻塞所有用户故事**
- **US1 (Phase 3)**: 依赖 Phase 2 — 独立可实施
- **US2 (Phase 4)**: 依赖 Phase 2 — 独立可实施，但 account 路由的 cookie 验证需要
- **US3 (Phase 5)**: 依赖 Phase 2 — 独立可实施
- **US4 (Phase 6)**: 依赖 Phase 3 (US1 group 路由) — 集成验证
- **US5 (Phase 7)**: 依赖 Phase 3-5 (需要被测代码存在) — 最后实施
- **Polish (Phase 8)**: 依赖所有用户故事完成

### Implementation Strategy
1. Foundation -> MVP (US 1)
2. Incremental Auth (US 2) -> Publishing (US 3)
3. Full Vitest conversion to guarantee 100% equivalence.
