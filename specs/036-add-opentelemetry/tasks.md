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

- [ ] T001 Install OpenTelemetry SDK dependencies in `apps/backend-node/package.json` (`@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/instrumentation-winston`)
- [ ] T002 [P] Install necessary type definitions as devDependencies if required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core telemetry infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Create telemetry initialization module in `apps/backend-node/src/core/telemetry.ts` implementing `ConsoleSpanExporter`, `ConsoleLogRecordExporter`, and Winston instrumentation.
- [ ] T004 Update application entry point `apps/backend-node/src/index.ts` to ensure `telemetry.ts` is imported and initialized before any other module.
- [ ] T005 Refactor existing Winston logger configuration in `apps/backend-node/src/core/logger.ts` to ensure compatibility with OpenTelemetry injection (e.g., format adjustments to output trace_id and span_id).

**Checkpoint**: Foundation ready - OpenTelemetry SDK is active and Winston logs are being automatically enriched with trace context.

---

## Phase 3: User Story 1 - Developer Debugging Task Workflows (Priority: P1) 🎯 MVP

**Goal**: See the complete lifecycle of a publishing task in a structured, hierarchical format in the console output.

**Independent Test**: Trigger a sample publishing task locally and verify console output contains unified traces linking the request to the internal steps.

### Tests for User Story 1
- [ ] T006 [P] [US1] Add unit/integration tests in `apps/backend-node/tests/routes/publish.test.ts` to verify root trace spans are generated upon publishing requests.

### Implementation for User Story 1

- [ ] T007 [US1] Instrument the HTTP route handler in `apps/backend-node/src/routes/publish.ts` to start the root trace span for a publishing request.
- [ ] T008 [US1] Instrument `apps/backend-node/src/services/publish-executor.ts` to create spans for the overall execution lifecycle, setting attributes like platform, task ID, and explicitly capturing user session context from the request.
- [ ] T009 [US1] Instrument `apps/backend-node/src/services/task-service.ts` to wrap state updates and long-running operations in child spans.
- [ ] T010 [US1] Add error recording (`span.recordException`) and status updates (`ERROR`) within catch blocks across the above instrumented files.

**Checkpoint**: At this point, User Story 1 should be fully functional. A publishing task will generate a unified trace hierarchy visible in the local console.

---

## Phase 4: User Story 2 - Developer Analyzing Performance Bottlenecks (Priority: P2)

**Goal**: See the execution duration of specific operations (like uploading a file or waiting for browser rendering).

**Independent Test**: Execute platform uploads and verify the console output displays accurate duration metrics for specific Playwright steps.

### Tests for User Story 2
- [ ] T011 [P] [US2] Add unit tests in `apps/backend-node/tests/uploader/base-uploader.test.ts` to verify performance spans are created during base uploader actions.

### Implementation for User Story 2

- [ ] T012 [P] [US2] Instrument the base uploader class in `apps/backend-node/src/uploader/base-uploader.ts` to wrap core Playwright automation methods (e.g., page navigation, file upload actions) in performance-tracking spans.
- [ ] T013 [P] [US2] Instrument `apps/backend-node/src/services/video-service.ts` (or relevant media processing logic) to track duration of file validation/preparation steps.
- [ ] T014 [US2] Ensure all spans created in T012 and T013 are properly closed (`span.end()`) in `finally` blocks to guarantee accurate duration metrics even on failure.

**Checkpoint**: At this point, both User Stories are independently functional. The console output will now include fine-grained performance durations for critical automation steps.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and system health.

- [ ] T015 Add unit test in `apps/backend-node/tests/core/telemetry.test.ts` to verify OpenTelemetry SDK initialization does not crash.
- [ ] T016 Run `npm run lint` and `npm run typecheck -w apps/backend-node` to ensure strict typing compliance per Constitution P-IV.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion. Proceed sequentially (P1 → P2).
- **Polish (Final Phase)**: Depends on all user stories being complete.

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