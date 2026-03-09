# Implementation Plan: Node.js Backend Rewrite (024-node-backend-rewrite)

**Branch**: `024-node-backend-rewrite` | **Date**: 2026-03-09 | **Spec**: [spec.md](file:///Users/snow/Documents/GitHub/omni-post/specs/024-node-backend-rewrite/spec.md)
**Input**: Feature specification from `/specs/024-node-backend-rewrite/spec.md`

## Summary

The objective is to rewrite the Python Flask backend into a Node.js TypeScript Express backend, maintaining 1:1 functional and API parity. The Node.js version will replicate SQLite interactions, SSE login streams, scheduled publishing, and multi-platform Playwright uploading. A key architectural shift is adopting Node's asynchronous event loop (setImmediate) for publishing tasks instead of Python's threading model.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+ LTS
**Primary Dependencies**: Express.js, Playwright, better-sqlite3, uuid, winston
**Storage**: SQLite (Shared database with Python `apps/backend/data/db.sqlite3`)
**Testing**: Vitest (aligned with frontend testing ecosystem)
**Target Platform**: Node.js Server (macOS/Linux)
**Project Type**: web-service (Backend REST API)
**Performance Goals**: Support 10+ concurrent platform uploaders without blocking API response.
**Constraints**: 100% API parity; strict ESM module system; single-threaded async concurrency for IO-bound tasks.
**Scale/Scope**: 25+ API endpoints, 5 platforms (Bilibili, Douyin, Kuaishou, Tencent, XHS).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Architecture Parity)**: Yes. Drop-in replacement with 1:1 REST API parity using same DB.
- **Principle II (Pattern)**: Yes. Adhering to `Routes → Services → Uploaders` pattern.
- **Principle III (Isolation)**: Yes. Platform uploaders are isolated in `src/uploader/` with distinct contexts.
- **Principle IV (Testing)**: Yes. Porting 33 pytest files to Vitest.
- **Principle V (Concurrency)**: Yes. Redefined to use **Asynchronous Event Loop** (setImmediate) instead of worker threads for IO-bound Playwright tasks.
- **Principle VI (Monorepo)**: Yes. Located in `apps/backend-node/`.

## Project Structure

### Documentation (this feature)

```text
specs/024-node-backend-rewrite/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (OmniPost Monorepo)

```text
apps/
├── backend/             # Python Flask Backend
├── backend-node/        # Node.js TypeScript Backend
│   ├── src/
│   │   ├── core/        # Config, Logger, Browser utils
│   │   ├── db/          # SQLite manager
│   │   ├── routes/      # Express Routes (Blueprints)
│   │   ├── services/    # Business Logic (Task, Login, Publish)
│   │   └── uploader/    # Platform Automations (Playwright)
│   └── tests/           # Vitest suite
└── frontend/            # Vue 3 Frontend
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | Structure complies fully with Constitution | N/A |
