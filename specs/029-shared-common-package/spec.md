# Feature Specification: Shared Common Package Refactoring

**Feature Branch**: `029-shared-common-package`
**Created**: 2026-03-21
**Status**: completed
**Input**: User description: "现在的node版本, 前后端存在相同的代码和一些逻辑, 为了更好服务前后端. 现在重构下代码, 提供一个公共成, 支持前后端公共使用的区域代码, 减少维护的成本."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Eliminate Enumeration/Type Duplication (Priority: P1)

As a developer, I need a single source of truth for platform mappings, database schemas, and shared utilities, to avoid sync issues when components are updated.

**Why this priority**: Resolving the currently fractured `PlatformType` representations across multiple frontend and backend files is the most urgent consistency risk.

**Independent Test**: Can be independently verified by performing a TypeScript typecheck in the backend and a Vite build in the frontend, importing the exact same shared definition.

**Acceptance Scenarios**:

1. **Given** the new `@omni-post/shared` package, **When** consumed by Vite (Frontend) and `tsc` (Backend Node), **Then** both compile successfully without module resolution errors.
2. **Given** a rule against environment-specific APIs, **When** running ESLint on `packages/shared/src`, **Then** any use of `window`, `document`, `fs`, `path`, or `crypto` is flagged as an error.
3. **Given** shared utility functions, **When** executing Vitest unit tests, **Then** all tests pass verifying enumeration consistency and function correctness.

---

### Scope Inventory & Out-of-Scope

**Inventory (In-Scope)**:

| # | Item | Source files to unify |
|---|------|-----------------------|
| 1 | `PlatformType` enum + `PLATFORM_NAMES` + `PLATFORM_NAME_TO_TYPE` + `PLATFORM_LOGIN_URLS` + helper functions (`getPlatformName`, `getPlatformType`, `isValidPlatform`) | `apps/backend-node/src/core/constants.ts`, `apps/backend-node/src/db/models.ts`, `apps/frontend/src/core/platformConstants.js` |
| 2 | `Task` + `UploadOptions` + `UserInfo` interfaces | `apps/backend-node/src/db/models.ts` |
| 3 | `BrowserProfile` interface | `apps/backend-node/src/models/browser_profile.ts` |

**Consumer files requiring import rewrite** (exhaustive list):

| Consumer | Current import source |
|----------|-----------------------|
| `apps/backend-node/src/services/cookie-service.ts` | `../core/constants.js` |
| `apps/backend-node/src/services/publish-executor.ts` | `../core/constants.js` |
| `apps/backend-node/src/routes/dashboard.ts` | `../core/constants.js` |
| `apps/backend-node/src/routes/account.ts` | `../core/constants.js` |
| `apps/backend-node/src/services/article_service.ts` | `../db/models.js` |
| `apps/backend-node/src/services/publish-service.ts` | `../db/models.js` |
| `apps/backend-node/src/uploader/base-uploader.ts` | `../db/models.js` |
| `apps/backend-node/src/uploader/bilibili/main.ts` | `../../db/models.js` |
| `apps/backend-node/src/uploader/zhihu/main.ts` | `../../../db/models.js` |
| `apps/backend-node/src/uploader/juejin/main.ts` | `../../../db/models.js` |
| `apps/backend-node/src/services/browser_service.ts` | `../models/browser_profile.js` |
| `apps/frontend/src/core/platformConstants.js` | (self, to be replaced) |
| `apps/frontend/src/views/Dashboard.vue` | `@/core/platformConstants` |
| `apps/frontend/src/views/AccountManagement.vue` | hardcoded `typeMap` |
| `apps/frontend/src/views/TaskManagement.vue` | `@/core/platformConstants` |
| `apps/frontend/src/views/PublishCenter.vue` | `@/core/platformConstants` |
| `apps/frontend/src/stores/account.js` | `@/core/platformConstants` |
| `apps/frontend/src/stores/task.js` | `@/core/platformConstants` |

**Out-of-Scope**:
1. Frontend-only UI constants (e.g., `PLATFORM_TAG_TYPES` — this maps to Element Plus tag-type styling, remains in frontend).
2. Frontend-only UI list (e.g., `PLATFORM_LIST` — display-order for dropdowns, remains in frontend).
3. Backend-only constants (e.g., `TencentZoneTypes`, `VideoZoneTypes` — platform-specific upload configs, remain in backend).
4. Backend HTTP Router definitions or Database ORM implementations.
5. `Article` interface — exclusively used in backend, no frontend counterpart, stays in `apps/backend-node/src/models/article.ts`.

### Edge Cases

- What happens if Vite and Node.js resolve `.ts` files differently? (Both use `moduleResolution: "bundler"` — we align the shared package to the same strategy).
- How do we prevent developers from accidentally importing Node Core modules into the shared library? (ESLint `no-restricted-imports` + tsconfig excluding `DOM` from `lib`).
- What if `article_service.ts` imports `PlatformType` from `db/models.ts`? (Task must redirect it to `@omni-post/shared` import).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a `packages/shared` npm workspace package with `"type": "module"`.
- **FR-002**: The shared package MUST export unified `PlatformType` enum, platform mapping constants, and helper functions.
- **FR-003**: The shared package MUST export pure Type definitions for `Task`, `UploadOptions`, `UserInfo`, and `BrowserProfile`.
- **FR-004**: Code inside `packages/shared` MUST NOT import environment-constrained APIs (`fs`, `path`, `crypto`, `window`, `document`), enforced via ESLint rules.
- **FR-005**: All consumer files listed in the Scope Inventory MUST be updated to import exclusively from `@omni-post/shared`.
- **FR-006**: The shared package MUST include Vitest unit tests covering enumeration consistency and utility function correctness.
- **FR-007**: The root `lint-staged` configuration MUST include `packages/shared/**/*.ts` to ensure pre-commit checks.

### Key Entities

- **Shared Package (`@omni-post/shared`)**: Central module for constants and pure business types.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of defined Inventory items are migrated and all listed consumer files exclusively import from `@omni-post/shared`.
- **SC-002**: Frontend build (`npm run build -w apps/frontend`) completes successfully.
- **SC-003**: Backend TypeScript check (`tsc --noEmit` in `apps/backend-node`) passes cleanly.
- **SC-004**: ESLint validates 0 environment-specific API imports inside `packages/shared`.
- **SC-005**: Vitest tests for the shared package pass (`npm run test -w packages/shared`).
- **SC-006**: Root `lint-staged` includes `packages/shared/**/*.ts` rules.
