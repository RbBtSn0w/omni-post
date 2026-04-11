---
description: "Task list template for feature implementation"
---

# Tasks: OpenTelemetry Structured Logging

**Input**: Design documents from `/specs/036-add-opentelemetry/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency management.

- [x] T001 Install OpenTelemetry SDK dependencies in `apps/backend-node/package.json` (`@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/api-logs`, `@opentelemetry/sdk-logs`)
- [x] T002 [P] Install necessary type definitions as devDependencies if required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core telemetry infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Create telemetry initialization module in `apps/backend-node/src/core/telemetry.ts` implementing `ConsoleSpanExporter` and `ConsoleLogRecordExporter`.
- [x] T004 Update application entry point `apps/backend-node/src/index.ts` to ensure `telemetry.ts` is imported and initialized before any other module.
- [x] T005 Create a new OpenTelemetry-native logging facade in `apps/backend-node/src/core/logger.ts` that replaces the Winston logger and exports an API compatible with the existing usage.

**Checkpoint**: Foundation ready - OpenTelemetry SDK is active and the new logger facade is ready for migration.

---

## Phase 3: User Story 1 - Developer Debugging Task Workflows (Priority: P1) 🎯 MVP

**Goal**: See the complete lifecycle of a publishing task in a structured, hierarchical format in the console output.

**Independent Test**: Trigger a sample publishing task locally and verify console output contains unified traces linking the request to the internal steps.

### Tests for User Story 1
- [x] T006 [P] [US1] Add unit/integration tests in `apps/backend-node/tests/routes/publish.test.ts` to verify root trace spans are generated upon publishing requests.

### Implementation for User Story 1

- [x] T007 [US1] Instrument the HTTP route handler in `apps/backend-node/src/routes/publish.ts` to start the root trace span for a publishing request.
- [x] T008 [US1] Instrument `apps/backend-node/src/services/publish-executor.ts` to create spans for the overall execution lifecycle, setting attributes like platform and task ID, and extracting user session context from the active OpenTelemetry context (do not use Express `req` object).
- [x] T009 [US1] Instrument `apps/backend-node/src/services/task-service.ts` to wrap state updates and long-running operations in child spans.
- [x] T010 [US1] Add error recording (`span.recordException`) and status updates (`ERROR`) within catch blocks across the above instrumented files.

**Checkpoint**: At this point, User Story 1 should be fully functional. A publishing task will generate a unified trace hierarchy visible in the local console.

---

## Phase 4: User Story 2 - Developer Analyzing Performance Bottlenecks (Priority: P2)

**Goal**: See the execution duration of specific operations (like uploading a file or waiting for browser rendering).

**Independent Test**: Execute platform uploads and verify the console output displays accurate duration metrics for specific Playwright steps.

### Tests for User Story 2
- [x] T011 [P] [US2] Add unit tests in `apps/backend-node/tests/uploader/base-uploader.test.ts` to verify performance spans are created during base uploader actions.

### Implementation for User Story 2

- [x] T012 [P] [US2] Instrument the base uploader class in `apps/backend-node/src/uploader/base-uploader.ts` to wrap core Playwright automation methods (e.g., page navigation, file upload actions) in performance-tracking spans.
- [x] T013 [P] [US2] Instrument `apps/backend-node/src/services/video-service.ts` (or relevant media processing logic) to track duration of file validation/preparation steps.
- [x] T014 [US2] Ensure all spans created in T012 and T013 are properly closed (`span.end()`) in `finally` blocks to guarantee accurate duration metrics even on failure.

**Checkpoint**: At this point, both User Stories are independently functional. The console output will now include fine-grained performance durations for critical automation steps.

---

## Phase 5: Legacy Logger Migration and Removal

**Purpose**: Migrate all existing legacy logs to the new OpenTelemetry structure and remove the old dependency.

- [x] T015 [P] Run workspace search for `import.*logger.*core/logger` and ensure all calls correctly use the new facade across `apps/backend-node/src/`.
- [x] T016 [P] Remove `winston`, `winston-daily-rotate-file`, and any Winston-related OpenTelemetry instrumentation from `apps/backend-node/package.json`.
- [x] T017 Delete old logging configuration file `apps/backend-node/tests/core/logger.test.ts` or rewrite it to test the new OpenTelemetry facade.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and system health.

- [x] T018 Add unit test in `apps/backend-node/tests/core/telemetry.test.ts` to verify OpenTelemetry SDK initialization does not crash.
- [x] T019 Run `npm run lint` and `npm run typecheck -w apps/backend-node` to ensure strict typing compliance per Constitution P-IV.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3 & 4)**: All depend on Foundational phase completion. Proceed sequentially (P1 → P2).
- **Migration (Phase 5)**: Depends on Foundational completion. Can run in parallel with User Stories.
- **Polish (Final Phase)**: Depends on all previous phases being complete.

### Parallel Opportunities
- Dependency installation (T001, T002) can be done in one command.
- Within US2, instrumenting the base uploader (T012) and video service (T013) can be done in parallel.

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently by observing console logs.
5. Proceed to User Story 2 (Performance metrics).
