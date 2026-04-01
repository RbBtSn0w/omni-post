# Tasks: Refresh and Upload Flow Hardening

**Input**: Design documents from `/specs/030-harden-refresh-flow/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. This feature explicitly enforces fail-fast-loud behavior and must follow red-green-refactor for all critical branches.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish execution baseline and verify current failing risk paths can be tested.

- [X] T001 Confirm target scope and file ownership in `/Users/snow/Documents/GitHub/omni-post/specs/030-harden-refresh-flow/plan.md`
- [X] T002 [P] Run baseline backend test `apps/backend-node/tests/bilibili-uploader-submit.test.ts`
- [X] T003 [P] Run baseline frontend composable test `apps/frontend/tests/composables/useAccountActions.test.js`
- [X] T004 [P] Run baseline frontend view test `apps/frontend/tests/views/AccountManagement.test.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define common fail-fast primitives and shared decision points before story work.

- [X] T005 Implement centralized blocked transitional-text matcher scaffold in `apps/backend-node/src/uploader/bilibili/main.ts`
- [X] T006 Implement upload probe outcome typing/classification scaffold in `apps/backend-node/src/uploader/bilibili/main.ts`
- [X] T007 Implement structured runtime diagnostic helper (`phase/errorType/message/accountOrTaskId`) in `apps/backend-node/src/uploader/bilibili/main.ts`
- [X] T008 Implement batch scope validation guard helper in `apps/frontend/src/composables/useAccountActions.js`
- [X] T009 Implement validated-refresh completion helper for post-operation flows in `apps/frontend/src/composables/useAccountActions.js`

**Checkpoint**: Foundation complete. User story implementation can proceed.

---

## Phase 3: User Story 1 - Prevent Premature Publish During Transitional States (Priority: P1) 🎯 MVP

**Goal**: Block submit while publish control is in transitional refresh/loading states.

**Independent Test**: Transitional text and non-disabled control must still be judged not-ready.

### Tests for User Story 1 (Red First)

- [X] T010 [P] [US1] Add failing test for `刷新中` text blocked readiness in `apps/backend-node/tests/bilibili-uploader-submit.test.ts`
- [X] T011 [P] [US1] Add failing test for `加载中`/transitional semantics blocked readiness in `apps/backend-node/tests/bilibili-uploader-submit.test.ts`
- [X] T012 [P] [US1] Add failing boundary test for unknown ready-like class but blocked text in `apps/backend-node/tests/bilibili-uploader-submit.test.ts`

### Implementation for User Story 1 (Green)

- [X] T013 [US1] Wire centralized blocked-text set into `isPublishButtonReadyState` in `apps/backend-node/src/uploader/bilibili/main.ts`
- [X] T014 [US1] Ensure disabled-only false positives are prevented by text-first transitional blocking in `apps/backend-node/src/uploader/bilibili/main.ts`
- [X] T015 [US1] Add/keep readiness decision logs for transitional-state rejection in `apps/backend-node/src/uploader/bilibili/main.ts`

**Checkpoint**: US1 independently passes with transitional-state submit blocked.

---

## Phase 4: User Story 2 - Expose Real Upload Probe Failures Immediately (Priority: P1)

**Goal**: Runtime probe failures must terminate immediately with explicit structured diagnostics.

**Independent Test**: Runtime exception path yields `runtime_failure` terminal behavior without retry/fallback continuation.

### Tests for User Story 2 (Red First)

- [X] T016 [P] [US2] Add failing test: probe runtime exception maps to `runtime_failure` (not timeout) in `apps/backend-node/tests/bilibili-uploader-submit.test.ts`
- [X] T017 [P] [US2] Add failing test: runtime failure path does not auto-retry in `apps/backend-node/tests/bilibili-uploader-submit.test.ts`
- [X] T018 [P] [US2] Add failing test: runtime failure path blocks fallback continuation in `apps/backend-node/tests/bilibili-uploader-submit.test.ts`
- [X] T019 [P] [US2] Add failing test: structured diagnostic fields exist (`phase/errorType/message/accountOrTaskId`) in `apps/backend-node/tests/bilibili-uploader-submit.test.ts`

### Implementation for User Story 2 (Green)

- [X] T020 [US2] Refactor `waitForUploadStartSignal` to emit explicit `started|timeout|runtime_failure` outcomes in `apps/backend-node/src/uploader/bilibili/main.ts`
- [X] T021 [US2] Enforce terminal fail-fast branch for `runtime_failure` with no retry in `apps/backend-node/src/uploader/bilibili/main.ts`
- [X] T022 [US2] Enforce structured runtime diagnostics emission at failure boundary in `apps/backend-node/src/uploader/bilibili/main.ts`
- [X] T023 [US2] Remove/replace silent exception swallowing in probe flow in `apps/backend-node/src/uploader/bilibili/main.ts`

**Checkpoint**: US2 independently passes with loud terminal runtime-failure behavior.

---

## Phase 5: User Story 3 - Keep Account Refresh Trigger Paths Consistent (Priority: P2)

**Goal**: Batch refresh entry points always receive valid explicit scope; invalid scope fails early.

**Independent Test**: Empty/undefined batch scope is rejected with explicit feedback and zero refresh request.

### Tests for User Story 3 (Red First)

- [X] T024 [P] [US3] Add failing composable test: `handleBatchRefresh(undefined)` hard-rejects and sends no request in `apps/frontend/tests/composables/useAccountActions.test.js`
- [X] T025 [P] [US3] Add failing composable test: `handleBatchRefresh([])` hard-rejects and sends no request in `apps/frontend/tests/composables/useAccountActions.test.js`
- [X] T026 [P] [US3] Add failing view test: batch relogin path passes explicit selected scope in `apps/frontend/tests/views/AccountManagement.test.js`

### Implementation for User Story 3 (Green)

- [X] T027 [US3] Add explicit invalid-scope rejection branch with user-facing error in `apps/frontend/src/composables/useAccountActions.js`
- [X] T028 [US3] Ensure batch refresh path cannot proceed without non-empty selected scope in `apps/frontend/src/composables/useAccountActions.js`
- [X] T029 [US3] Fix batch relogin invocation to pass selected accounts explicitly in `apps/frontend/src/views/AccountManagement.vue`
- [X] T030 [US3] Fix batch refresh dropdown invocation to pass selected accounts explicitly in `apps/frontend/src/views/AccountManagement.vue`

**Checkpoint**: US3 independently passes with deterministic batch trigger behavior.

---

## Phase 6: User Story 4 - Ensure Post-Operation Account State Freshness (Priority: P2)

**Goal**: Post-operation completion is declared only after validated (`force=true`) refresh writeback.

**Independent Test**: Cookie upload/edit success path must not show final completion before validated refresh + store write.

### Tests for User Story 4 (Red First)

- [X] T031 [P] [US4] Add failing composable test: post-operation completion requires `force=true` validated refresh success in `apps/frontend/tests/composables/useAccountActions.test.js`
- [X] T032 [P] [US4] Add failing composable test: completion requires store write after validated refresh in `apps/frontend/tests/composables/useAccountActions.test.js`
- [X] T033 [P] [US4] Add failing view test: cookie upload success path uses validated refresh completion semantics in `apps/frontend/tests/views/AccountManagement.test.js`
- [X] T034 [P] [US4] Add failing view test: account edit success path uses validated refresh completion semantics in `apps/frontend/tests/views/AccountManagement.test.js`

### Implementation for User Story 4 (Green)

- [X] T035 [US4] Implement post-operation validated-refresh completion gate in `apps/frontend/src/composables/useAccountActions.js`
- [X] T036 [US4] Route cookie upload success to validated refresh completion gate in `apps/frontend/src/views/AccountManagement.vue`
- [X] T037 [US4] Route account edit success to validated refresh completion gate in `apps/frontend/src/views/AccountManagement.vue`
- [X] T038 [US4] Ensure completion message ordering follows validated refresh + store write in `apps/frontend/src/views/AccountManagement.vue`

**Checkpoint**: US4 independently passes with deterministic freshness completion behavior.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, documentation sync, and guardrail checks.

- [X] T039 [P] Update fail-fast validation notes and command sequence in `specs/030-harden-refresh-flow/quickstart.md`
- [X] T040 Run backend focused regression and stabilize failures in `apps/backend-node/tests/bilibili-uploader-submit.test.ts`
- [X] T041 Run frontend focused regression and stabilize failures in `apps/frontend/tests/composables/useAccountActions.test.js`
- [X] T042 Run frontend view regression and stabilize failures in `apps/frontend/tests/views/AccountManagement.test.js`
- [X] T043 Record final acceptance evidence and residual risk notes in `specs/030-harden-refresh-flow/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1: No dependencies.
- Phase 2: Depends on Phase 1; blocks all user stories.
- Phase 3-6: Depend on Phase 2; can be parallelized by team after foundations complete.
- Phase 7: Depends on completion of all targeted user stories.

### User Story Dependencies

- US1 (P1): Starts after foundational tasks; recommended MVP cut.
- US2 (P1): Starts after foundational tasks; independent from US1 but shares backend file, so execute sequentially per file safety.
- US3 (P2): Starts after foundational tasks; frontend batch-scope contract independent of backend.
- US4 (P2): Starts after foundational tasks; best executed after US3 to reuse refresh-guard helpers.

### Within Each User Story

- Tests first (red), then minimal code change (green), then cleanup/refactor.
- Preserve explicit diagnostic logs for failure paths.
- No silent fallback/defaulting for required inputs.

### Parallel Opportunities

- Phase 1: T002/T003/T004 parallel.
- US1 tests: T010/T011/T012 parallel.
- US2 tests: T016/T017/T018/T019 parallel.
- US3 tests: T024/T025/T026 parallel.
- US4 tests: T031/T032/T033/T034 parallel.
- Final phase: T039 can run in parallel with T040-T042.

---

## Parallel Example: User Story 2

```bash
# Parallel red tests
Task: T016 apps/backend-node/tests/bilibili-uploader-submit.test.ts
Task: T017 apps/backend-node/tests/bilibili-uploader-submit.test.ts
Task: T018 apps/backend-node/tests/bilibili-uploader-submit.test.ts
Task: T019 apps/backend-node/tests/bilibili-uploader-submit.test.ts

# Then implementation sequence
Task: T020 apps/backend-node/src/uploader/bilibili/main.ts
Task: T021 apps/backend-node/src/uploader/bilibili/main.ts
Task: T022 apps/backend-node/src/uploader/bilibili/main.ts
Task: T023 apps/backend-node/src/uploader/bilibili/main.ts
```

## Parallel Example: User Story 4

```bash
# Parallel red tests
Task: T031 apps/frontend/tests/composables/useAccountActions.test.js
Task: T032 apps/frontend/tests/composables/useAccountActions.test.js
Task: T033 apps/frontend/tests/views/AccountManagement.test.js
Task: T034 apps/frontend/tests/views/AccountManagement.test.js

# Then implementation sequence
Task: T035 apps/frontend/src/composables/useAccountActions.js
Task: T036 apps/frontend/src/views/AccountManagement.vue
Task: T037 apps/frontend/src/views/AccountManagement.vue
Task: T038 apps/frontend/src/views/AccountManagement.vue
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete US1 end-to-end (red-green-refactor).
3. Validate and ship transitional-state submit blocking.

### Incremental Delivery

1. US1: Transitional-state blocking.
2. US2: Runtime-failure terminal diagnostics.
3. US3: Batch invalid-input hard reject.
4. US4: Post-operation validated freshness completion.

### Parallel Team Strategy

1. Backend owner: US1 + US2.
2. Frontend owner: US3 + US4.
3. Joint stabilization: Phase 7 regression and evidence capture.

---

## Notes

- All checklist tasks follow strict format: `- [ ] Txxx [P?] [US?] Description with file path`.
- `[USx]` labels appear only in user story phases.
- Tasks are executable without extra context and enforce fail-fast-loud constraints.
