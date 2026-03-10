# Tasks: Node Backend Refine & Security Hardening

**Feature**: Node Backend Refine & Security Hardening
**Plan**: [plan.md](plan.md)
**Branch**: `025-node-backend-refine`

## Implementation Strategy

We will follow a phased approach, starting with ESM stability and shared security utilities, followed by implementing the core user stories in priority order. Each phase is designed to be independently testable and maintain functional parity with the Python backend.

1.  **Foundational**: Fix ESM module resolution and establish the security baseline.
2.  **US1 (Security)**: Harden file and cookie endpoints against path traversal.
3.  **US2 (Reliability)**: Implement account locking and optimize Playwright resource usage.
4.  **US3 (Parity)**: Implement real-time status validation and SSE resource cleanup.
5.  **US4 (Automation)**: Set up the automated CI pipeline with quality gates.

## Phase 1: Setup & ESM Stability

Goal: Ensure the application boots correctly in ESM mode and enforces module resolution rules.

- [x] T001 [P] Update all internal imports in `apps/backend-node/src/` to include `.js` extensions
- [x] T002 [P] Update all internal imports in `apps/backend-node/tests/` to include `.js` extensions
- [x] T003 [P] Install `eslint-plugin-import` and configure rule `import/extensions` in `apps/backend-node/eslint.config.js` to enforce `.js` suffixes
- [x] T004 Verify application boots without `ERR_MODULE_NOT_FOUND` via `npm run dev` [SC-002]

## Phase 2: Foundational Security & Database

Goal: Implement shared security utilities and update the database schema for parity.

- [x] T005 [P] Create `safeJoin` path utility in `apps/backend-node/src/utils/path.ts` using `path.resolve` and `startsWith` check
- [x] T006 [P] Add `last_validated_at` column to `user_info` table in `apps/backend-node/src/db/models.ts`
- [x] T007 Update database migration/initialization logic in `apps/backend-node/src/db/` to include the new column
- [x] T008 [P] Update `apps/backend-node/tests/setup.ts` to use recursive `fs.rmSync` for SQLite cleanup

## Phase 3: Secure File & Cookie Management [US1]

Goal: Protect file-serving and cookie-handling endpoints from path traversal.

**Independent Test**: Call `/downloadCookie?filePath=../../package.json` and verify 400 Bad Request.

- [x] T009 [P] [US1] Refactor `apps/backend-node/src/routes/cookie.ts` to use `safeJoin` for downloads and uploads [SC-001]
- [x] T010 [P] [US1] Refactor `apps/backend-node/src/routes/file.ts` to use `safeJoin` for video file serving and deletion [SC-001]
- [x] T011 [US1] Create security integration test in `apps/backend-node/tests/security.test.ts` verifying traversal rejection [SC-001, SC-005]

## Phase 4: Reliable Multi-Platform Publishing [US2]

Goal: Prevent account conflicts and optimize browser instance lifecycle.

**Independent Test**: Start two publishing tasks for the same account and verify the second task returns 423 Locked.

- [x] T012 [P] [US2] Refine `LockManager` in `apps/backend-node/src/services/lock-manager.ts` to support account-level locking
- [x] T013 [US2] Integrate `LockManager` into `apps/backend-node/src/services/publish-executor.ts` with `try-finally` release logic
- [x] T014 [P] [US2] Refactor `BaseUploader` in `apps/backend-node/src/uploader/base-uploader.ts` to strictly enforce `BrowserContext` usage
- [x] T015 [US2] Update platform-specific uploaders (Bilibili, etc.) in `apps/backend-node/src/uploader/` to remove redundant browser creation
- [x] T016 [US2] Create concurrency test in `apps/backend-node/tests/concurrency.test.ts` verifying account lock behavior

## Phase 5: Consistent Account Status [US3]

Goal: Implement real-time status validation parity and ensure clean resource disposal.

**Independent Test**: Call `/getAccountStatus` for an account with a stale validation date and verify Playwright check triggers.

- [x] T017 [US3] Implement 3-hour cooldown and `force=true` logic in `apps/backend-node/src/routes/account.ts`
- [x] T018 [US3] Refactor `SSE` stream in `apps/backend-node/src/routes/publish.ts` to explicitly call `res.end()` and remove listeners
- [x] T019 [P] [US3] Standardize all API response envelopes to `{ code, msg, data }` in all `apps/backend-node/src/routes/` files
- [x] T020 [US3] Create parity test in `apps/backend-node/tests/parity.test.ts` verifying 3-hour validation cooldown [SC-003]

## Phase 6: Automated Quality Assurance [US4]

Goal: Establish the CI pipeline with enforced quality and security gates.

**Independent Test**: Push code with a Lint error and verify the GitHub Actions workflow fails.

- [x] T021 [P] [US4] Update `.github/workflows/ci.yml` to include Node-specific caching and `npm audit` gate
- [x] T022 [P] [US4] Configure Vitest `json` and `lcov` reporters in `apps/backend-node/vitest.config.ts`
- [x] T023 [US4] Integrate CodeQL scan results verification in CI for the Node backend
- [x] T024 [US4] Verify CI workflow passes successfully for all jobs (Lint, TSC, Test, Security) [SC-004]

## Phase 7: Polish & Validation

Goal: Final verification of parity and security standards.

- [x] T025 [P] Verify 100% test pass rate in `apps/backend-node/`
- [x] T026 Perform manual path traversal audit on all remaining endpoints in `apps/backend-node` [SC-001, SC-005]

## Dependencies

- Phase 1 & 2 must be completed before any User Story implementation.
- T013 depends on T012.
- T015 depends on T014.
- All User Stories (US1, US2, US3, US4) are independent of each other and can be implemented in parallel once Foundational phases are done.

## Parallel Execution Examples

### Foundation (Phase 1 & 2)
- ESM suffix updates (T001, T002) and ESLint config (T003) can be done in parallel.
- `safeJoin` implementation (T005) and DB column addition (T006) can be done in parallel.

### User Stories
- Route refactoring for Cookies (T009) and Video Files (T010) can be done in parallel.
- CI pipeline setup (T021) can start as soon as Phase 1 is complete.
