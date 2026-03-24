# Implementation Plan: Enhance Automation and Stability using OpenCLI Patterns

**Branch**: `027-opencli-automation-upgrade` | **Date**: 2024-05-22 | **Spec**: [/specs/027-opencli-automation-upgrade/spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-opencli-automation-upgrade/spec.md`

## Summary

本特性的核心是通过引入 OpenCLI 的先进模式来增强 OmniPost 的自动化能力和稳定性。主要包括：
1. **本地 Chrome 会话复用**：允许系统直接使用用户本地已登录的浏览器配置文件，显著提升登录成功率并降低风控。
2. **多平台文章发布**：扩展内容类型至 Markdown 文章，支持知乎、掘金等平台。
3. **专用 CLI 工具**：为开发者和高级用户提供强大的命令行交互界面。
4. **AI 辅助平台探索**：利用 Playwright 开发探索工具，辅助快速接入新平台。

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ LTS  
**Primary Dependencies**: Playwright, Express.js, better-sqlite3, commander, unified/remark (Markdown processing)  
**Storage**: SQLite (`database.db`), 本地文件系统 (浏览器配置文件)  
**Testing**: Vitest  
**Target Platform**: Desktop (Windows/macOS/Linux)
**Project Type**: Web Service + CLI + Browser Automation  
**Performance Goals**: 支持多个并发发布任务，实时 SSE 状态反馈  
**Constraints**: 仅限 Node.js 后端实现 (Python 已过时)，需处理本地浏览器文件锁定机制  
**Scale/Scope**: 支持 5+ 平台，多内容类型 (视频、文章)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Primary Node.js Architecture)**: YES. 本设计完全专注于 Node.js 后端实现，符合 Python 过时的项目方针。
- **Principle II (Pattern)**: YES. 遵循 Routes → Services → Uploaders 模式，新增 ArticleService 和对应文章上传器。
- **Principle III (Isolation)**: YES. 每个文章平台上传器独立实现，互不干扰。
- **Principle IV (Node.js Testing)**: YES. 使用 Vitest 进行单元测试和集成测试。
- **Principle V (Concurrency)**: YES. 利用 Node.js 异步事件循环处理 IO 密集型自动化任务，并通过 SSE 交付实时状态。
- **Principle VI (Monorepo)**: YES. 依赖项将在 `apps/backend-node` 和 `packages/cli` 中分别管理。

## Project Structure

### Documentation (this feature)

```text
specs/027-opencli-automation-upgrade/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (OmniPost Monorepo)

```text
apps/
├── backend/             # Python Flask Backend (Legacy/Deprecated)
├── backend-node/        # Node.js TypeScript Backend (Primary)
│   ├── src/
│   │   ├── routes/      # 新增文章及浏览器配置相关路由
│   │   ├── services/    # 新增 ArticleService, BrowserService
│   │   └── uploader/    # 新增文章平台上传器 (zhihu, juejin)
│   └── tests/           # Vitest suite
└── frontend/            # Vue 3 Frontend
    ├── src/
    │   ├── views/       # 文章发布及配置文件管理页面
    │   ├── stores/      # Pinia state 更新
    │   └── api/         # API 客户端更新
├── packages/
    └── cli/             # 新增：统一 CLI 工具
```

**Structure Decision**: Standard OmniPost Monorepo layout focusing on Node.js as primary backend, with a new CLI package.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(无违规事项)*
