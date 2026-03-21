# Tasks: Shared Common Package Refactoring

**Input**: Design documents from `/specs/029-shared-common-package/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks grouped by phase. All tasks follow `- [ ] [ID] [P?] [US?] Description with file path`.

---

## Phase 1: Setup Workspace & Tooling

**Purpose**: Create the `packages/shared` package with correct module strategy and ESLint safety boundaries.

- [x] T001 Create directory structure: `packages/shared/src/constants/`, `packages/shared/src/types/`, `packages/shared/tests/`
- [x] T002 Generate `packages/shared/package.json` with `"name": "@omni-post/shared"`, `"type": "module"`, `"exports": { ".": "./src/index.ts" }`, `"types": "./src/index.ts"`, and `"scripts": { "build": "tsc", "test": "vitest run" }`
- [x] T003 [P] Generate `packages/shared/tsconfig.json` extending `../../packages/shared-config/tsconfig.base.json` with `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"lib": ["ES2022"]`, `"declaration": true`, `"outDir": "./dist"`, `"rootDir": "./src"`
- [x] T004 [P] Generate `packages/shared/eslint.config.js` configuring `no-restricted-globals` (ban `window`, `document`, `navigator`, `localStorage`) and `no-restricted-imports` (ban `fs`, `path`, `crypto`, `http`, `https`, `child_process`)

---

## Phase 2: Foundational Entity Extraction

**Purpose**: Construct the unified Single Source of Truth (SSOT) aligned with `data-model.md`.

- [x] T005 [P] Extract `PlatformType` enum, `PLATFORM_NAMES`, `PLATFORM_NAME_TO_TYPE`, `PLATFORM_LOGIN_URLS`, `getPlatformName()`, `getPlatformType()`, `isValidPlatform()` into `packages/shared/src/constants/platform.ts`
- [x] T006 [P] Extract `Task`, `UploadOptions`, and `UserInfo` interfaces into `packages/shared/src/types/task.ts`
- [x] T007 [P] Extract `BrowserProfile` interface into `packages/shared/src/types/browserProfile.ts`
- [x] T008 Generate `packages/shared/src/index.ts` to re-export all from `./constants/platform`, `./types/task`, `./types/browserProfile`

---

## Phase 3: Testing & Validation Boilerplate

**Purpose**: Satisfy Constitution §IV (Vitest tests mandatory for all new features).

- [x] T009 [P] Create `packages/shared/tests/platform.test.ts` with Vitest tests covering: PlatformType enum values match expected IDs, PLATFORM_NAMES length matches enum count, getPlatformName returns correct names, getPlatformType round-trips correctly, isValidPlatform returns true/false correctly
- [x] T010 [P] Create `packages/shared/tests/types.test.ts` verifying type exports are importable and structurally correct (compile-time validation)
- [x] T011 Add `vitest` as devDependency in `packages/shared/package.json` and verify `npm run test -w packages/shared` passes

---

## Phase 4: Monorepo Linkage & Tooling Integration

**Purpose**: Wire the package into workspace consumers and pre-commit infrastructure.

- [x] T012 Run `npm install @omni-post/shared -w apps/backend-node` to add workspace dependency
- [x] T013 [P] Run `npm install @omni-post/shared -w apps/frontend` to add workspace dependency
- [x] T014 Update root `package.json` `lint-staged` field to add `"packages/shared/**/*.ts": ["eslint --fix --config packages/shared/eslint.config.js"]`

---

## Phase 5: User Story 1 — Backend Consumer Migration (Priority: P1) 🎯 MVP

**Goal**: Replace all fragmented backend imports with `@omni-post/shared`.

### 5a: Platform Constants Consumers

- [x] T015 [P] [US1] Update `apps/backend-node/src/core/constants.ts`: remove `PlatformType` enum + maps + helpers, replace with `export { PlatformType, PLATFORM_NAMES, ... } from '@omni-post/shared'`. Keep backend-only `TencentZoneTypes` and `VideoZoneTypes` in place.
- [x] T016 [P] [US1] Update `apps/backend-node/src/services/cookie-service.ts`: resolved via re-export in constants.ts
- [x] T017 [P] [US1] Update `apps/backend-node/src/services/publish-executor.ts`: resolved via re-export in constants.ts
- [x] T018 [P] [US1] Update `apps/backend-node/src/routes/dashboard.ts`: resolved via re-export in constants.ts
- [x] T019 [P] [US1] Update `apps/backend-node/src/routes/account.ts`: resolved via re-export in constants.ts

### 5b: Type/Interface Consumers

- [x] T020 [US1] Update `apps/backend-node/src/db/models.ts`: remove `PlatformType` enum, `Task`, `UploadOptions`, `UserInfo` interface definitions; replace with re-exports from `'@omni-post/shared'`
- [x] T021 [P] [US1] Update `apps/backend-node/src/services/article_service.ts`: split `Article` import to `models/article.ts`, `PlatformType` resolves via `db/models.ts` re-export
- [x] T022 [P] [US1] Update `apps/backend-node/src/services/publish-service.ts`: resolved via re-export in db/models.ts
- [x] T023 [P] [US1] Update `apps/backend-node/src/uploader/base-uploader.ts`: resolved via re-export in db/models.ts
- [x] T024 [P] [US1] Update `apps/backend-node/src/uploader/bilibili/main.ts`: resolved via re-export in db/models.ts
- [x] T025 [P] [US1] Update `apps/backend-node/src/uploader/zhihu/main.ts`: fixed relative path + resolved via re-export
- [x] T026 [P] [US1] Update `apps/backend-node/src/uploader/juejin/main.ts`: fixed relative path + resolved via re-export

### 5c: BrowserProfile Consumer

- [x] T027 [US1] Update `apps/backend-node/src/models/browser_profile.ts`: remove local `BrowserProfile` interface, re-export from `'@omni-post/shared'`
- [x] T028 [P] [US1] Verify `apps/backend-node/src/services/browser_service.ts` import chain resolves correctly through the re-export

---

## Phase 6: User Story 1 — Frontend Consumer Migration (Priority: P1)

**Goal**: Redirect all frontend platform imports from local `platformConstants.js` to `@omni-post/shared`.

- [x] T029 [US1] Rewrite `apps/frontend/src/core/platformConstants.js` as a thin re-export shim: import from `'@omni-post/shared'` and re-export `{ PlatformType, PLATFORM_NAMES, PLATFORM_NAME_TO_TYPE, getPlatformName, getPlatformType, isValidPlatform }`. Keep frontend-only `PLATFORM_TAG_TYPES`, `PLATFORM_LIST`, `ALL_PLATFORM_NAMES`, `getPlatformTagType` defined locally.
- [x] T030 [P] [US1] Verify `apps/frontend/src/views/Dashboard.vue` resolves `PlatformType`, `PLATFORM_NAMES` through updated `platformConstants.js` shim
- [x] T031 [P] [US1] Verify `apps/frontend/src/views/AccountManagement.vue` correctly uses shim — no additional changes needed since it imports via `getPlatformTagType` which stays local
- [x] T032 [P] [US1] Verify `apps/frontend/src/views/TaskManagement.vue` resolves imports through shim
- [x] T033 [P] [US1] Verify `apps/frontend/src/views/PublishCenter.vue` resolves `PLATFORM_LIST`, `getPlatformName` through shim
- [x] T034 [P] [US1] Verify `apps/frontend/src/stores/account.js` resolves `PLATFORM_NAMES` through shim
- [x] T035 [P] [US1] Verify `apps/frontend/src/stores/task.js` resolves `PLATFORM_NAMES` through shim

---

## Phase 7: Build-Level Validation

**Purpose**: End-to-end compilation and test verification across the entire stack.

- [x] T036 Run `npm run test -w packages/shared` directly to verify unit tests logic and coverage.
- [x] T037 Run `npm run typecheck -w apps/backend-node` (`tsc --noEmit`) to verify no TS compilation errors.
- [x] T038 Run `npm run build -w apps/frontend` to verify Vue SFCs compile correctly and external imports resolve.
- [x] T039 Run `npm run lint -w packages/shared` to enforce pure environment rules (no `fs`, `window`).
- [x] T040 Run `npm run test:node` to verify no regressions in backend test suite.

---

## Rollback Plan

If build validation fails:
1. `git restore apps/backend-node/package.json apps/frontend/package.json`
2. `rm -rf packages/shared/`
3. `git restore apps/backend-node/ apps/frontend/`
4. `npm install`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Extraction) → Phase 3 (Tests)
                                        → Phase 4 (Linkage)
                                            ↓
                   Phase 5 (Backend Migration) ─┐
                   Phase 6 (Frontend Migration) ─┤→ Phase 7 (Validation)
```

- **Phase 1**: No dependencies
- **Phase 2**: Depends on Phase 1
- **Phase 3**: Depends on Phase 2 (needs source to test)
- **Phase 4**: Depends on Phase 2 (needs package to link)
- **Phase 5 & 6**: Depend on Phase 4 (need workspace link). Can run in parallel.
- **Phase 7**: Depends on Phase 5 + 6 completion

### Parallel Opportunities

- T003/T004: Independent config files
- T005/T006/T007: Independent source files
- T009/T010: Independent test files
- T012/T013: Independent workspace links
- T015-T019: Independent backend constants consumers
- T021-T026: Independent backend type consumers
- T030-T035: Independent frontend verification tasks

---

## Implementation Strategy

### MVP First

1. Complete Phase 1-4: Package created, tested, linked
2. Complete Phase 5: Backend fully migrated
3. Complete Phase 6: Frontend fully migrated
4. **STOP and VALIDATE**: Run Phase 7 end-to-end
5. If green → PR ready

### Metrics

- **Total tasks**: 40
- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Extraction)**: 4 tasks
- **Phase 3 (Testing)**: 3 tasks
- **Phase 4 (Linkage)**: 3 tasks
- **Phase 5 (Backend)**: 14 tasks
- **Phase 6 (Frontend)**: 7 tasks
- **Phase 7 (Validation)**: 5 tasks
