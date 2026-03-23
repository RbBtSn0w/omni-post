# Implementation Plan: Refresh and Upload Flow Hardening

**Branch**: `030-harden-refresh-flow` | **Date**: 2026-03-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/030-harden-refresh-flow/spec.md`

## Summary

Implement fail-fast-and-loud hardening for two critical pipelines: Bilibili upload/publish readiness and Account Management refresh orchestration. The plan enforces explicit non-ready state blocking, immediate terminal handling of runtime probe failures, structured failure diagnostics, strict invalid-input rejection for batch refresh, and deterministic post-operation freshness completion using validated (`force=true`) refresh writeback.

## Technical Context

**Language/Version**: Node.js 20+, TypeScript 5.x (backend), Vue 3 + JavaScript (frontend)  
**Primary Dependencies**: Express, Playwright, Pinia, Element Plus, Axios, Vitest  
**Storage**: SQLite (backend account/task metadata), in-memory data cache (frontend)  
**Testing**: Vitest (`apps/backend-node/tests`, `apps/frontend/tests`)  
**Target Platform**: Node.js backend service + Web frontend + Chromium automation  
**Project Type**: Monorepo web application  
**Performance Goals**: No additional submission latency beyond existing polling cadence; post-operation refreshed account state visible within one validated refresh cycle  
**Constraints**: Preserve route-service-uploader boundaries; no silent fallbacks; classify timeout vs runtime failure distinctly; no automatic retry on runtime probe failure; no shared type remapping needed  
**Scale/Scope**: Focused to `apps/backend-node/src/uploader/bilibili/main.ts` and account-management frontend trigger paths plus targeted regression tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] `Node.js First`: All implementation work is in `apps/backend-node` and `apps/frontend`.
- [x] `Layer Boundaries`: Backend change remains within uploader layer; frontend change remains within view/composable/store orchestration.
- [x] `SSOT`: No platform ID or shared entity changes required in `@omni-post/shared`.
- [x] `Async State`: Upload probe and account refresh remain async; failure and completion signals become explicit and deterministic.
- [x] `Regression Gates`: Backend and frontend regression suites will be updated to enforce red-green-refactor behavior and explicit outcomes.

## Project Structure

### Documentation (this feature)

```text
specs/030-harden-refresh-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── bilibili-upload-state-contract.md
│   └── account-refresh-trigger-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/backend-node/
├── src/uploader/bilibili/main.ts
└── tests/bilibili-uploader-submit.test.ts

apps/frontend/
├── src/views/AccountManagement.vue
├── src/composables/useAccountActions.js
├── tests/views/AccountManagement.test.js
└── tests/composables/useAccountActions.test.js
```

**Structure Decision**: Keep scope minimal and risk-oriented; fix runtime decision points and refresh entry contracts in existing modules without introducing new layers.

## Phase 0: Research & Decisions

1. Define canonical non-ready transitional state policy for publish controls.
2. Define probe outcome taxonomy and terminal behavior for runtime failures.
3. Define invalid batch refresh input policy (hard reject vs fallback).
4. Define post-operation freshness completion signal for account-affecting actions.
5. Define observability payload required for fast diagnosis of runtime failures.

Output: [research.md](./research.md)

## Phase 1: Design & Contracts

1. Model core runtime entities and state transitions:
2. `PublishReadinessState`
3. `UploadProbeOutcome`
4. `AccountRefreshTrigger`
5. `AccountFreshnessWindow`
6. Publish contracts for backend probe/readiness behavior and frontend refresh-trigger consistency.
7. Update quickstart with fail-fast validation and red-green-refactor order.

Outputs:
- [data-model.md](./data-model.md)
- [contracts/bilibili-upload-state-contract.md](./contracts/bilibili-upload-state-contract.md)
- [contracts/account-refresh-trigger-contract.md](./contracts/account-refresh-trigger-contract.md)
- [quickstart.md](./quickstart.md)

## Phase 2: Implementation Strategy

1. Backend uploader hardening (`apps/backend-node/src/uploader/bilibili/main.ts`)
2. Replace permissive readiness check with centralized extensible blocked-text set for transitional states.
3. Ensure transitional state text blocks submission even when disabled attribute is absent.
4. Rework upload-start probe handling to produce explicit `started | timeout | runtime_failure` outcomes.
5. On `runtime_failure`: emit structured diagnostics (`phase/errorType/message/account|task`) and terminate task immediately without retry or fallback continuation.

6. Frontend refresh hardening (`apps/frontend/src/composables/useAccountActions.js`, `apps/frontend/src/views/AccountManagement.vue`)
7. Enforce explicit selected scope for batch refresh entry points.
8. Reject empty/undefined batch scope with explicit user-facing error and zero network refresh calls.
9. Route cookie-upload success and account-edit success to deterministic validated refresh path.
10. Treat completion as achieved only after `force=true` validated refresh result is written to store.

11. Regression tests (red-green-refactor)
12. Backend: extend `apps/backend-node/tests/bilibili-uploader-submit.test.ts` for transitional-state blocking, runtime-failure classification, and no-retry fail-fast assertions.
13. Frontend: extend `apps/frontend/tests/composables/useAccountActions.test.js` and `apps/frontend/tests/views/AccountManagement.test.js` for invalid batch input rejection and post-operation freshness completion semantics.

## Post-Design Constitution Re-check

- [x] Node.js First: satisfied.
- [x] Layer Boundaries: satisfied.
- [x] SSOT: satisfied.
- [x] Async State: explicit state signals preserved and improved.
- [x] Regression Gates: test updates explicitly bound to affected runtime flows.

## Complexity Tracking

No constitution violations requiring exception handling.

## Acceptance Evidence & Residual Risk

### Accepted Evidence

- Bilibili uploader now blocks transitional publish states including refresh/loading semantics.
- Upload-start probing now distinguishes `started`, `timeout`, and `runtime_failure`.
- Runtime probe failures emit structured diagnostics and terminate without automatic retry.
- Account batch refresh now hard-rejects invalid selection input (`undefined`/empty).
- Account mutation flows now complete only after validated `force=true` refresh writes state back to store.

### Residual Risk

- `apps/frontend/tests/views/AccountManagement.test.js` currently has `describe.skip`; view-level assertions for new batch relogin parameter passing and mutation-refresh completion are not yet active.
- Current guardrails are still covered by composable-level tests and targeted backend tests, but UI-layer regression safety can be improved once skipped suite is reactivated.
