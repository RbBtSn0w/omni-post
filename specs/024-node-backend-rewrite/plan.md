# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

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

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Architecture Parity)**: ✅ The design ensures 1:1 functional parity across both backends, providing a drop-in replacement API.
- **Principle II (Pattern)**: ✅ Implementation follows the exact Routes → Services → Uploaders pattern mapping Python blueprints/classes to Express/TS concepts.
- **Principle III (Isolation)**: ✅ 5 platform uploaders are isolated in `src/uploader/<platform>/main.ts`, using shared utility logic but not depending on each other.
- **Principle IV (Testing)**: ✅ 98 Vitest cases mapped from the 33 Python pytest files, ensuring automated verification of both backends.
- **Principle V (Concurrency)**: ✅ Async execution using `setImmediate` (Node async event loop) replicating Python daemon threads, with SSE for real-time status.
- **Principle VI (Monorepo)**: ✅ `apps/backend-node` is managed with its own package.json & npm workspace, sharing root commands.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
├── backend/             # Python Flask Backend
│   ├── src/
│   │   ├── routes/      # HTTP Endpoints
│   │   ├── services/    # Business Logic
│   │   └── uploader/    # Platform Automations
│   └── tests/           # Pytest suite
├── backend-node/        # Node.js TypeScript Backend
│   ├── src/
│   │   ├── routes/      # Express Routes
│   │   ├── services/    # Business Logic
│   │   └── uploader/    # Platform Automations
│   └── tests/           # Vitest suite
└── frontend/            # Vue 3 Frontend
    ├── src/
    │   ├── views/       # Vue Pages
    │   ├── stores/      # Pinia State
    │   └── api/         # API Clients
    └── tests/           # Vitest suite
```

**Structure Decision**: Standard OmniPost Monorepo layout with dual-backend support.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
