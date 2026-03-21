# Implementation Plan: Shared Common Package Refactoring

**Branch**: `029-shared-common-package` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/029-shared-common-package/spec.md`

## Summary

Extract fragmented and duplicated `PlatformType`, `Task`, `UploadOptions`, `UserInfo`, and `BrowserProfile` definitions currently scattered across frontend and backend into a single source of truth at `packages/shared`. Using `moduleResolution: "bundler"` aligned with both consumers, we guarantee seamless cross-environment consumption without precompiled dist overhead during development.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ LTS
**Primary Dependencies**: TypeScript (inherited from root), npm workspaces
**Storage**: N/A
**Testing**: Vitest (shared package unit tests) + `tsc --noEmit` (backend validation) + `npm run build` (frontend validation)
**Target Platform**: Node.js (backend), Browser (frontend/Vue 3)
**Project Type**: Monorepo shared library package
**Module Resolution**: `"bundler"` — matches both consumer tsconfigs
**Constraints**: `lib: ["ES2022"]` only (no DOM), ESLint bans `fs`/`path`/`crypto`/`window`/`document`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **§I. Primary Node.js Architecture**: Refactoring unifies Backend and Frontend types.
- [x] **§II. Unified Three-Layer Pattern**: Not affected — shared package is below service layer.
- [x] **§III. Platform Uploader Isolation**: Uploaders keep independent implementations, only import source changes.
- [x] **§IV. Comprehensive Testing (Vitest)**: Vitest tests included for shared package (Phase 5 in tasks).
- [x] **§VI. Monorepo Consistency & Dependency Discipline**: `packages/shared` uses npm workspaces, lint-staged updated.
- [x] **§Development Workflow**: Spec → Plan → Tasks lifecycle followed, lint-staged + husky covered.

## Project Structure

### Documentation

```text
specs/029-shared-common-package/
├── plan.md              # This file
├── research.md          # Module resolution & dependency strategy
├── data-model.md        # All shared entities with field-level alignment
├── quickstart.md        # Integration guide
└── tasks.md             # Sequenced implementation tasks
```

### Source Code

```text
packages/
└── shared/
    ├── src/
    │   ├── constants/
    │   │   └── platform.ts       # PlatformType enum + maps + helpers
    │   ├── types/
    │   │   ├── task.ts            # Task, UploadOptions, UserInfo
    │   │   └── browserProfile.ts  # BrowserProfile
    │   └── index.ts               # Re-exports all
    ├── tests/
    │   └── platform.test.ts       # Vitest tests
    ├── package.json               # "type": "module", single "exports" entry
    └── tsconfig.json              # moduleResolution: "bundler", lib: ["ES2022"]
```

### Consumer files to update (18 files total)

**Backend (10 files)**:
- `services/cookie-service.ts` — PlatformType
- `services/publish-executor.ts` — PlatformType, getPlatformName
- `routes/dashboard.ts` — PlatformType
- `routes/account.ts` — getPlatformName
- `services/article_service.ts` — PlatformType (currently from db/models)
- `services/publish-service.ts` — UploadOptions
- `uploader/base-uploader.ts` — UploadOptions
- `uploader/bilibili/main.ts` — UploadOptions
- `uploader/zhihu/main.ts` — UploadOptions
- `uploader/juejin/main.ts` — UploadOptions
- `services/browser_service.ts` — BrowserProfile

**Frontend (7 files)**:
- `core/platformConstants.js` — full replacement (becomes re-export shim)
- `views/Dashboard.vue` — PlatformType, PLATFORM_NAMES
- `views/AccountManagement.vue` — hardcoded typeMap
- `views/TaskManagement.vue` — platform imports
- `views/PublishCenter.vue` — PLATFORM_LIST, getPlatformName
- `stores/account.js` — PLATFORM_NAMES
- `stores/task.js` — PLATFORM_NAMES

## Rollback & Safety Strategy

To quickly reverse integration if module resolution issues arise:
1. Revert `apps/backend-node/package.json` and `apps/frontend/package.json`.
2. Remove `packages/shared` folder.
3. Restore modified files: `git restore apps/backend-node apps/frontend`.
No destructive DB changes involved — recovery is instant.
