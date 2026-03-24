# Quickstart: Refresh and Upload Flow Hardening (Fail-Fast)

## Goal
Deliver deterministic, test-backed fixes for four risk areas:
1. Transitional publish states must block submission.
2. Upload probe runtime failures must fail fast and terminate.
3. Invalid batch refresh scope must be rejected loudly.
4. Post-operation account freshness must complete only after validated writeback.

## Workflow (Red-Green-Refactor)

1. Write failing tests first for each risk branch.
2. Implement minimal fix to pass the failing test.
3. Re-run focused suites and confirm explicit outcome assertions.
4. Keep diagnostic logs for failure paths.

## Focused Test Commands

```bash
# Backend uploader regression
npm run test:node -- bilibili-uploader-submit.test.ts

# Frontend refresh orchestration
npm run test:frontend -- useAccountActions.test.js AccountManagement.test.js
```

## Implementation Paths

```text
apps/backend-node/src/uploader/bilibili/main.ts
apps/backend-node/tests/bilibili-uploader-submit.test.ts
apps/frontend/src/composables/useAccountActions.js
apps/frontend/src/views/AccountManagement.vue
apps/frontend/tests/composables/useAccountActions.test.js
apps/frontend/tests/views/AccountManagement.test.js
```

## Expected Assertions

- Transitional text states (e.g., refresh/loading semantics) are rejected as publish-ready.
- Probe runtime exceptions produce `runtime_failure` with structured diagnostics and terminal exit.
- Batch refresh with empty/undefined scope fails immediately and emits explicit error feedback.
- Cookie upload/edit success paths emit final completion only after `force=true` validated refresh writes state to store.

## Validation Notes (Current Run)

- Backend targeted regression passed: `bilibili-uploader-submit.test.ts` (includes transitional-state blocking and runtime/timeout distinction).
- Frontend composable regression passed: `useAccountActions.test.js` (includes invalid batch scope rejection and mutation refresh completion gate).
- Frontend view regression command executed: `AccountManagement.test.js` currently contains suite-level `describe.skip`, so tests are skipped rather than failed.
