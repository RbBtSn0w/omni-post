# OmniPost Copilot Instructions

## Project Overview

OmniPost is a multi-platform content publishing automation tool using a monorepo architecture.

Current baseline:
- `apps/backend-node` is the **active, maintained backend** (Express + TypeScript).
- `apps/backend` (Python Flask) is **deprecated/legacy** and should not be used as the default implementation.
- `apps/frontend` is a unified Vue 3 frontend for both video and article publishing workflows.

**Key Stack:**
- **Frontend:** Vue 3 + Vite, Pinia, Element Plus, Axios
- **Backend (Primary):** Node.js 20+, Express, TypeScript, SQLite, Playwright
- **Backend (Legacy/Deprecated):** Python 3.10 + Flask (kept for compatibility/reference)
- **Dev Commands:** `npm run dev:node`, `npm run dev:frontend`, `npm run test:node`, `npm run test:frontend`

## Architecture Patterns

### Monorepo Structure
- `/apps/frontend/` - Vue 3 web application
- `/apps/backend-node/` - Primary REST API service (maintained)
- `/apps/backend/` - Deprecated Python backend (legacy only)
- `/packages/` - Shared config/CLI packages
- Workspace managed in root `package.json`

### Backend Service Layer Architecture (Node Primary)
The active backend follows a three-layer pattern:
1. **Routes** (`apps/backend-node/src/routes/*.ts`) - HTTP endpoints and request handling
2. **Services** (`apps/backend-node/src/services/*.ts`) - business orchestration
3. **Uploaders** (`apps/backend-node/src/uploader/*/main.ts`) - platform-specific Playwright automation

Core services:
- `task-service.ts` - task lifecycle management
- `publish-service.ts` + `publish-executor.ts` - publish orchestration and background execution
- `login-service.ts` + `cookie-service.ts` - auth/session management
- `browser_service.ts` - local browser profile management
- `article_service.ts` - article CRUD/publish pipeline

### Frontend State Management (Pinia)
Stores are in `apps/frontend/src/stores/` using Composition API stores.
Pattern: components -> store actions -> API layer (`src/api/*.js`) -> state updates.

## Data Flow & Integration

### Video Publishing Workflow
1. Frontend uploads media via endpoints like `/upload` or `/uploadSave`
2. User submits publish payload to `/postVideo` or `/postVideoBatch`
3. Backend creates a task in `tasks` table (status `waiting`)
4. `startPublishThread()` runs platform uploader in background
5. Frontend polls `/tasks` and updates task status/progress

### Login & Session Workflow
- SSE login endpoint: `/login?type=<platform>&id=<accountId>`
- Node backend uses `EventEmitter + AbortController` for message/cancel flow
- Session source supports managed cookies and local browser profile reuse

### Article Publishing Workflow
- Article CRUD: `/articles` and `/articles/:id`
- Publish endpoint: `/publish/article`
- Supported article platforms currently include Zhihu and Juejin via dedicated uploaders

## Database Schema (Current Active)

Primary schema is defined in `apps/backend-node/src/db/migrations.ts`:
- `account_groups`
- `browser_profiles`
- `user_info` (includes `session_source`, `browser_profile_id`, `last_validated_at`)
- `file_records`
- `articles`
- `tasks` (includes `content_type`, `content_id`, `browser_profile_id`, `publish_data`)

Platform type mapping is maintained in `apps/backend-node/src/core/constants.ts`:
- 1=Xiaohongshu, 2=WeChat Channels, 3=Douyin, 4=Kuaishou, 5=Bilibili, 6=Zhihu, 7=Juejin

## Platform Uploader Pattern

Each uploader in `apps/backend-node/src/uploader/<platform>/main.ts` exposes platform publish capabilities (`postVideo` / `postArticle` / `upload` depending on platform).

Implemented platforms include:
- Video: Douyin, WeChat Channels, Xiaohongshu, Kuaishou, Bilibili
- Article: Zhihu, Juejin

`publish-service.ts` dispatches by platform type and runs with one of two strategies:
1. local browser profile (`browser_profile_id`)
2. managed cookie fallback (`accountList`)

## Development Workflows

### Recommended (Node Primary)
```bash
npm run install:node
npm run dev:node
npm run test:node
npm run lint:node
npm run db:init -w apps/backend-node
```

### Frontend
```bash
npm run install:frontend
npm run dev:frontend
npm run test:frontend
npm run lint:frontend
```

### Monorepo Utility Commands
```bash
npm run lint
npm run test
npm run clean
npm run check:workspace
```

### Legacy Python Backend (Deprecated)
- Exists in `apps/backend`, but not the default development or feature target.
- Only touch Python backend when explicitly requested for migration/compatibility fixes.

## Project-Specific Patterns

### Async + Background Execution
- HTTP layer remains request/response oriented
- Long-running publish/login tasks run in background execution paths
- SSE is used for login status streaming

### API Response Convention
Node primary APIs generally return `{ code, msg, data }` for core routes (via `utils/response.ts`).
Some newer routes (e.g., browser/article/explorer) may return plain JSON objects.

### Testing Strategy
- Node backend: Vitest tests in `apps/backend-node/tests`
- Frontend: Vitest tests in `apps/frontend/tests`
- Legacy Python tests remain for historical parity but are not the primary quality gate

### Configuration & Constants
- `apps/backend-node/src/core/config.ts` - paths, host/port, runtime config
- `apps/backend-node/src/core/constants.ts` - platform enums and mappings
- `apps/backend-node/src/core/browser.ts` - Playwright/browser bootstrap helpers
- `apps/backend-node/src/core/logger.ts` - logger setup

## Critical Files by Purpose

**System Overview:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - architecture and data flow
- [README.md](./README.md) - latest project-level setup

**Node Backend Core:**
- [app.ts](./apps/backend-node/src/app.ts) - Express app factory
- [publish-service.ts](./apps/backend-node/src/services/publish-service.ts) - publish dispatch orchestration
- [publish-executor.ts](./apps/backend-node/src/services/publish-executor.ts) - task execution pipeline
- [task-service.ts](./apps/backend-node/src/services/task-service.ts) - task CRUD/status logic
- [login-service.ts](./apps/backend-node/src/services/login-service.ts) - login orchestration/SSE integration

**Node Route Layer:**
- [publish.ts](./apps/backend-node/src/routes/publish.ts)
- [file.ts](./apps/backend-node/src/routes/file.ts)
- [account.ts](./apps/backend-node/src/routes/account.ts)
- [article.ts](./apps/backend-node/src/routes/article.ts)
- [browser.ts](./apps/backend-node/src/routes/browser.ts)

**Frontend Integration:**
- [task.js](./apps/frontend/src/stores/task.js)
- [request.js](./apps/frontend/src/utils/request.js)
- [config.js](./apps/frontend/src/core/config.js)

**Testing Reference:**
- [test_routes_publish.test.ts](./apps/backend-node/tests/test_routes_publish.test.ts)
- [test_publish_executor.test.ts](./apps/backend-node/tests/test_publish_executor.test.ts)
- [TaskManagement.test.js](./apps/frontend/tests/views/TaskManagement.test.js)

## Key Conventions to Follow

1. **Default implementation target is Node backend** (`apps/backend-node`).
2. **Treat Python backend as deprecated** unless the task explicitly requires it.
3. **Platform types use integer IDs** from `core/constants.ts`; avoid ad-hoc mappings.
4. **Task payload fields** (`platforms`, `file_list`, `account_list`, `schedule_data`, `publish_data`) are JSON-serialized in DB.
5. **Prefer safe path helpers** (`utils/path.ts`) for filesystem operations.
6. **Route-service-uploader boundaries** should remain clear; avoid mixing automation logic into route handlers.
7. **When diagnosing automation regressions**, use `opencli-diagnostics` workflow to capture real network/UI behavior before patching selectors.
