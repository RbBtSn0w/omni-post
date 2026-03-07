# Research: Node.js TypeScript 后端重写

**Branch**: `024-node-backend-rewrite` | **Date**: 2026-03-07

## 技术决策

### 1. HTTP 框架选型

- **Decision**: Express.js v4 + TypeScript
- **Rationale**: Express 是 Node.js 最成熟的 HTTP 框架，生态丰富（中间件、SSE 支持、文件上传），且 Flask 的 Blueprint 模式可直接映射为 Express Router。TypeScript 类型系统可替代 Python 的 ABC 抽象类模式。
- **Alternatives considered**:
  - Fastify: 性能更好但社区生态较小，SSE 中间件支持弱
  - Koa: 更轻量但需要更多手动配置，增加开发成本
  - NestJS: 功能强大但框架约束过重，对1:1移植增加复杂度

### 2. SQLite 驱动选型

- **Decision**: `better-sqlite3`（同步 API）
- **Rationale**: Python 后端使用 `sqlite3` 标准库（同步操作），`better-sqlite3` 提供等价的同步 API，确保数据操作行为一致。性能优于异步驱动（无上下文切换开销），且 API 高度简洁。
- **Alternatives considered**:
  - `sqlite3`（npm 包）: 异步 API，行为与 Python 版本不一致
  - `sql.js`: WASM 实现，内存中运行，不适合文件持久化场景
  - `knex` / `sequelize`: ORM 层过重，偏离1:1移植目标

### 3. 测试框架选型

- **Decision**: Vitest
- **Rationale**: 项目前端已使用 Vitest，统一技术栈降低学习成本。Vitest 原生支持 TypeScript、ESM，Mock 功能完善，可替代 pytest 的 fixture + monkeypatch 模式。
- **Alternatives considered**:
  - Jest: 成熟但 ESM 支持不完善，TypeScript 配置复杂
  - Mocha + Chai: 灵活但缺乏内置 Mock，需组合多个库

### 4. 日志框架选型

- **Decision**: `winston`（控制台 + 文件日志）
- **Rationale**: Python 后端使用 `loguru` 提供业务日志（按平台分文件），`winston` 提供等价功能（Transport 机制 = loguru 的文件 handler + filter），支持自定义格式化和日志轮转。
- **Alternatives considered**:
  - `pino`: 高性能 JSON 日志，但自定义格式化支持弱
  - `bunyan`: 已停止维护
  - 内置 `console`: 无日志文件和轮转功能

### 5. 文件上传中间件选型

- **Decision**: `multer`
- **Rationale**: Express 生态标准的文件上传中间件，提供与 Flask `request.files` 等价的多文件上传功能，支持存储路径、文件大小限制配置。
- **Alternatives considered**:
  - `busboy`: 更底层，需要手动处理文件存储
  - `formidable`: 功能完善但与 Express 集成不如 multer 自然

### 6. SSE 实现方案

- **Decision**: 原生 Express `res.write()` + `text/event-stream`
- **Rationale**: Python 后端使用 Flask Response generator 实现 SSE，Express 中使用 `res.write()` 可实现完全等价的行为。无需额外库。
- **Alternatives considered**:
  - `express-sse`: 过度封装，难以精确控制事件格式

### 7. 异步任务执行方案

- **Decision**: Node.js Worker Threads
- **Rationale**: Python 后端使用 `threading.Thread(daemon=True)` 执行后台发布任务。Node.js Worker Threads 提供等价的隔离执行能力。对于 Playwright 浏览器自动化，Worker Threads 可避免主线程阻塞。
- **Alternatives considered**:
  - `child_process.fork()`: 进程隔离过重，资源开销大
  - 直接 `async/await`: Playwright 操作为长时间阻塞，可能影响 API 响应

### 8. TypeScript 项目配置

- **Decision**: ESM 模块 + `tsx` 开发运行 + `tsc` 编译
- **Rationale**: 规格要求使用 ESM。`tsx` 提供零配置的 TypeScript 开发体验（无需编译即可运行），与 `tsc` 编译结合满足开发和生产双需求。
- **Alternatives considered**:
  - `ts-node`: ESM 支持配置复杂
  - `swc`: 编译速度快但生态较新

### 9. CORS 中间件

- **Decision**: `cors` npm 包
- **Rationale**: 与 Flask-CORS 功能等价，配置方式一致（允许所有来源）。

### 10. Playwright 版本

- **Decision**: `playwright` >= 1.50.0（与 Python 后端版本对齐）
- **Rationale**: Node.js 版本的 Playwright 是原始版本，Python 版本是其绑定。两者 API 高度对称，方法名几乎一致（Python `snake_case` → JS `camelCase`）。
