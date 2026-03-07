# Feature Specification: Node.js TypeScript 后端重写

**Feature Branch**: `024-node-backend-rewrite`
**Created**: 2026-03-07
**Status**: Draft
**Input**: User description: "将后端 Python 代码全部用 Node.js TypeScript 重写，保留原 Python 后端，新增文件夹完成全部后端需求，使用 Python 测试用例逻辑编写新后端测试代码，保持功能一致性"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 核心 API 服务功能等价 (Priority: P1)

作为一名内容创作者，我需要新的 Node.js TypeScript 后端提供与 Python 后端完全相同的 REST API 接口（路径、请求/响应格式、状态码），使得现有 Vue 3 前端无需任何修改即可无缝切换到新后端。

**Why this priority**: 这是整个重写的核心价值——如果 API 不兼容，前端将无法正常工作，用户将无法使用任何功能。

**Independent Test**: 可以通过将前端 API 地址切换到新后端，验证所有页面和功能是否正常工作来独立测试。

**Acceptance Scenarios**:

1. **Given** 前端配置指向新 Node.js 后端, **When** 用户访问仪表盘页面, **Then** 能正确显示统计数据（账号数、任务数、平台统计、趋势图等）
2. **Given** 前端配置指向新 Node.js 后端, **When** 用户上传视频文件, **Then** 文件成功上传并返回文件信息
3. **Given** 前端配置指向新 Node.js 后端, **When** 用户创建发布任务, **Then** 任务成功创建并进入执行队列
4. **Given** 前端配置指向新 Node.js 后端, **When** 用户管理账号（查询/添加/删除/验证）, **Then** 操作结果与 Python 后端一致

---

### User Story 2 - 平台自动化登录与 Cookie 管理 (Priority: P1)

作为一名内容创作者，我需要新后端支持通过 Playwright 浏览器自动化完成各平台（抖音、微信视频号、小红书、快手、Bilibili）的登录流程，并正确管理 Cookie 文件的存储和验证。

**Why this priority**: 登录是发布的前提条件，没有登录功能整个系统无法工作。

**Independent Test**: 可以通过前端发起 SSE 登录请求，观察二维码是否正确展示，Cookie 是否成功保存来独立测试。

**Acceptance Scenarios**:

1. **Given** 用户选择某个平台账号进行登录, **When** 发起 SSE 登录请求, **Then** 新后端返回与 Python 后端相同格式的 SSE 事件流
2. **Given** 用户已登录某平台账号, **When** 验证 Cookie 有效性, **Then** 返回正确的验证结果
3. **Given** 用户上传 Cookie 文件, **When** 提交上传请求, **Then** Cookie 文件保存到正确路径

---

### User Story 3 - 多平台视频发布 (Priority: P1)

作为一名内容创作者，我需要新后端能够通过 Playwright 浏览器自动化向各平台（抖音、微信视频号、小红书、快手、Bilibili）发布视频内容，支持定时发布和批量发布。

**Why this priority**: 视频发布是系统的核心业务功能，也是唯一面向终端用户的输出。

**Independent Test**: 可以通过创建发布任务并监控任务状态来独立测试发布流程。

**Acceptance Scenarios**:

1. **Given** 用户已上传视频并选择目标平台, **When** 提交发布请求, **Then** 系统创建任务并异步执行上传流程
2. **Given** 用户配置了定时发布, **When** 提交发布请求, **Then** 系统按照指定时间安排发布
3. **Given** 用户提交批量发布请求, **When** 包含多个视频和多个平台, **Then** 系统为每个平台创建独立任务并行执行

---

### User Story 4 - 账号组管理 (Priority: P2)

作为一名内容创作者，我需要新后端支持账号分组管理功能，包括创建组、更新组、删除组、查看组内账号。

**Why this priority**: 账号组管理是组织大量账号的辅助功能，非核心发布流程。

**Independent Test**: 可以通过 API 创建组、添加账号到组、查询组内账号来独立测试。

**Acceptance Scenarios**:

1. **Given** 用户创建新的账号组, **When** 提交创建请求, **Then** 组成功创建并返回组信息
2. **Given** 用户删除一个包含账号的组, **When** 提交删除请求, **Then** 系统拒绝删除并提示原因

---

### User Story 5 - 测试覆盖与功能对比验证 (Priority: P2)

作为一名开发者，我需要基于 Python 版本的 33 个测试文件的逻辑，为新的 TypeScript 后端编写等价的测试代码，以验证两个后端的行为一致性。

**Why this priority**: 测试覆盖是质量保障的关键，确保重写后功能无遗漏。

**Independent Test**: 可以通过运行完整测试套件并对比测试覆盖率来独立测试。

**Acceptance Scenarios**:

1. **Given** Python 后端有某个测试用例, **When** 我在新后端查找对应测试, **Then** 存在逻辑等价的 TypeScript 测试用例
2. **Given** 运行新后端的完整测试套件, **When** 所有测试执行完成, **Then** 测试通过率应与 Python 后端一致

---

### Edge Cases

- 若某平台 API 发生变更导致 Python 和 TypeScript 上传器行为不一致，如何判定哪个行为正确？
  - **假设**: 以实际平台最新行为为准，两个后端都应适配最新变更
- 若 SQLite 同时被 Python 和 Node.js 后端访问，是否会产生锁冲突？
  - **假设**: 两个后端不会同时运行于同一数据库文件，切换后端时使用同一数据目录
- 若 Playwright 在 Node.js 环境下的行为与 Python 环境不完全一致，如何处理？
  - **假设**: Playwright 的 Node.js 和 Python 版本 API 高度一致，差异可通过适配层解决
- 文件上传的大小限制和路径格式在跨平台（Windows/macOS/Linux）环境下的差异处理
  - **假设**: 使用 Node.js 内置的 `path` 模块和跨平台文件操作保持一致

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 在 `apps/backend-node/` 目录下创建完整的 Node.js TypeScript 后端项目
- **FR-002**: 系统 MUST 保留原 `apps/backend/` 目录下的 Python 后端代码不做任何修改
- **FR-003**: 系统 MUST 提供与 Python 后端完全一致的 REST API 接口（相同的路由路径、HTTP 方法、请求/响应格式）
- **FR-004**: 系统 MUST 使用 Express.js (或等效框架) 作为 HTTP 框架，支持中间件、蓝图/路由器分层
- **FR-005**: 系统 MUST 使用 SQLite 作为持久化存储，与 Python 后端使用相同的数据库 schema
- **FR-006**: 系统 MUST 实现 6 个路由模块：account、cookie、dashboard、file、group、publish
- **FR-007**: 系统 MUST 实现 7 个服务模块：auth_service、cookie_service、login_impl、login_service、publish_executor、publish_service、task_service
- **FR-008**: 系统 MUST 实现 5 个平台上传器：bilibili、douyin、kuaishou、tencent、xiaohongshu
- **FR-009**: 系统 MUST 使用 Playwright for Node.js 实现浏览器自动化（登录、Cookie 验证、视频上传）
- **FR-010**: 系统 MUST 支持 SSE (Server-Sent Events) 用于登录流程的实时状态推送
- **FR-011**: 系统 MUST 支持文件上传（视频文件）和静态文件服务
- **FR-012**: 系统 MUST 实现定时发布功能，使用与 Python 后端相同的时间计算逻辑
- **FR-013**: 系统 MUST 复用 Python 后端中的 `stealth.min.js` 脚本用于浏览器反检测
- **FR-014**: 系统 MUST 编写与 Python 后端 33 个测试文件逻辑等价的 TypeScript 测试代码
- **FR-015**: 系统 MUST 使用三层架构模式（Routes → Services → Uploaders），与 Python 后端架构保持一致
- **FR-016**: 系统 MUST 使用抽象接口 + 默认实现的服务设计模式（如 `CookieService` → `DefaultCookieService`）
- **FR-017**: 系统 MUST 支持 CORS 跨域配置，允许前端开发服务器访问
- **FR-018**: 系统 MUST 保持与 Python 后端相同的平台类型常量定义（1=小红书, 2=视频号, 3=抖音, 4=快手, 5=Bilibili）

### Key Entities

- **Task (任务)**: 代表一次发布任务，包含标题、状态（waiting/uploading/processing/completed/failed）、进度、平台列表、文件列表、账号列表、调度数据、发布数据
- **Account/UserInfo (账号)**: 代表一个平台账号，包含平台类型、文件路径（Cookie 存储路径）、用户名、状态、所属组
- **AccountGroup (账号组)**: 账号的逻辑分组，包含组名、描述、创建时间
- **FileRecord (文件记录)**: 代表已上传的视频文件，包含文件名、文件大小、上传时间、文件路径
- **Platform (平台)**: 枚举类型，定义支持的 5 个社交平台及其常量

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 新后端提供的所有 API 端点（25+ 个）与 Python 后端的请求/响应格式 100% 兼容
- **SC-002**: 前端切换到新后端后，所有页面功能正常工作，无需修改前端代码
- **SC-003**: 新后端的测试套件覆盖 Python 后端 33 个测试文件中的所有核心测试场景
- **SC-004**: 新后端测试通过率达到 95% 以上
- **SC-005**: 新后端的数据库操作与 Python 后端产生完全相同的数据结构
- **SC-006**: 5 个平台的登录、Cookie 验证、视频上传流程行为与 Python 后端一致
- **SC-007**: 原 Python 后端代码保持不变，新后端代码完全独立于 `apps/backend-node/` 目录

## Assumptions

- Node.js 版本使用 18 或更高版本（LTS），以支持最新的 TypeScript 和 ESM 特性
- Playwright for Node.js 版本与 Python 版本的 API 行为高度一致
- 前端的 API 基础路径可通过环境变量或配置文件切换到新后端
- 两个后端不会同时运行于生产环境，切换是单向的
- 测试框架使用 Vitest（与项目前端测试生态统一）
- 新后端项目使用 ESM 模块系统
- SQLite 操作使用 `better-sqlite3` 或同等库实现同步操作以保持与 Python 行为一致
