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

## OmniPost Constitution (Core Principles)

The following principles from the project constitution MUST govern all code generation and architectural decisions:

1. **Node.js First, Python by Exception**: `apps/backend-node` is the primary target for all new features and fixes. `apps/backend` (Python) is strictly legacy.
2. **Route-Service-Uploader Boundaries**: Strict separation of concerns. Routes handle HTTP; Services handle orchestration; Uploaders handle platform automation. Do not mix layer responsibilities.
3. **Platform Isolation & Automation Discipline**: Uploaders must be cohesive and isolated per platform. UI automation fixes must be empirically verified before patching selectors.
4. **Shared Package SSOT & Monorepo Discipline**: `@omni-post/shared` is the Single Source of Truth for types, IDs, and constants. Do not duplicate these definitions locally.
5. **Asynchronous Execution & Real-Time State**: Long-running tasks (publish, login) must run asynchronously in the background. Use SSE or polling for real-time status.
6. **Test Coverage & Regression Gates (NON-NEGOTIABLE)**: Node.js changes must include tests. Cross-layer or automation changes require regression verification.

## Architecture Patterns

### Monorepo Structure
- `/apps/frontend/` - Vue 3 web application
- `/apps/backend-node/` - Primary REST API service (maintained)
- `/apps/backend/` - Deprecated Python backend (legacy only)
- `/packages/shared/` - **Single Source of Truth (SSOT)** for constants and types
- `/packages/shared-config/` - Shared ESLint/TS configurations
- `/packages/cli/` - Command-line interface tool
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

### Shared Code & SSOT (@omni-post/shared)
This package contains code shared between frontend and backend to ensure consistency:
1. **Constants**: `PlatformType` enum, `PLATFORM_NAMES`, `PLATFORM_LOGIN_URLS`.
2. **Interfaces**: `Task`, `UploadOptions`, `UserInfo`, `BrowserProfile`.
3. **Helpers**: `getPlatformName`, `getPlatformType`, `isValidPlatform`.

**Rule**: Always import these from `@omni-post/shared` instead of defining local duplicates.

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

Platform type mapping is maintained in `@omni-post/shared` (exported via `apps/backend-node/src/core/constants.ts` for secondary support):
- 1=Xiaohongshu, 2=WeChat Channels, 3=Douyin, 4=Kuaishou, 5=Bilibili, 6=Zhihu, 7=Juejin

## Platform Uploader Pattern

Each uploader in `apps/backend-node/src/uploader/<platform>/main.ts` exposes platform publish capabilities (`postVideo` / `postArticle` / `upload` depending on platform).

Implemented platforms include:
- Video (Playwright): Douyin, Xiaohongshu, Kuaishou, Bilibili
- Article (Playwright): Zhihu, Juejin
- **Dynamic (OpenCLI Bridge)**: Uses `uploader/opencli/main.ts` to shell out to CLI binaries defined by OCS manifests (e.g., WeChat Official Account `wx_official_account`).

`publish-service.ts` dispatches by platform type and runs with one of two strategies:
1. Playwright automation using local browser profile (`browser_profile_id`) or managed cookie fallback (`accountList`)
2. OpenCLI dynamic execution using `OpenCLIRunner` and external binaries.

## Development Workflows

### Spec-Kit Development Workflow & Quality Gates
All non-trivial modifications MUST follow a `Research -> Strategy -> Execution` flow. Specs, plans, and task documents MUST explicitly declare:
1. Target area (`apps/backend-node`, `apps/frontend`, `packages/shared`, or legacy scope).
2. Changes to shared types, platform mappings, DB structure, background tasks, or automation diagnostics.
3. A "Constitution Check" verifying adherence to Node.js primary, SSOT, layer boundaries, async state, and test coverage.
4. Documentation updates needed (README, ARCHITECTURE.md).

Commits MUST follow Conventional Commits and pass relevant linting/tests before submission.

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
npm run test -w packages/shared
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

## Quality & Security Guards

### 1. Strict 'No New Any' Policy
The project uses `tools/scripts/check-no-new-any.mjs` to block NEW `explicit any` usages.
- **Rule**: Never introduce `any` in new or modified code.
- **Alternatives**: Use specific interfaces, `unknown` with type guards, or `Record<string, unknown>` for dynamic objects.

### 2. Type-Safe Error Handling
- **Rule**: Catch blocks must use `(error: unknown)`.
- **Pattern**: `catch (error: unknown) { const msg = error instanceof Error ? error.message : String(error); ... }`

### 3. SSRF Protection & DNS Validation
All features fetching external URLs must provide SSRF protection.
- **Rule**: Validate hostnames through DNS resolution and block private/local ranges (IPv4/IPv6).
- **Implementation**: Refer to `ExplorerService.validateUrl`.

### 4. Workspace & Build Integrity
- **Command**: `npm run check:workspace` (via `tools/scripts/check-workspace.mjs`) ensures dependency version alignment.
- **ESM Compatibility**: Use extensionless imports (`../src/index`) in TypeScript tests to ensure Vitest handles module resolution correctly.

### 5. Security & Data Integrity (Constitution)
- **Data Protection**: Cookies, browser profiles, credentials, and local data files MUST be stored in controlled directories and excluded via `.gitignore`.
- **No Secrets**: NEVER hardcode keys, tokens, or personal credentials.
- **File Access**: File system operations MUST prioritize safe path helpers (e.g., `utils/path.ts`).
- **Persistence**: Task persistence fields (`platforms`, `file_list`, `account_list`, `schedule_data`, `publish_data`) MUST maintain structural stability and strictly align with shared types during read/write operations.

## Critical Files by Purpose

**System Overview:**
- [Constitution (.specify)](./.specify/memory/constitution.md) - Deep project background, architectural mandates, and spec-kit governance rules.
- [ARCHITECTURE.md](./ARCHITECTURE.md) - architecture and data flow
- [README.md](./README.md) - latest project-level setup
- [packages/shared/src/index.ts](./packages/shared/src/index.ts) - SSOT for shared types and constants

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
8. **SSOT Compliance**: All platform IDs and shared entity interfaces MUST be imported from `@omni-post/shared`. Do not define local interfaces for `Task`, `UploadOptions`, or `PlatformType`.
9. **Strict Linting Compliance**: Always resolve `any` violations and use type-safe error handling. CI will block any push that adds new `any` keywords.
10. **Security First**: Default to blocking private network access for any outbound crawler/fetcher logic.
