# Contract: Account Refresh Trigger Validity & Freshness Completion

## Scope
Frontend account-management contract for refresh-trigger validity and post-operation deterministic freshness.

## Owners
- `apps/frontend/src/composables/useAccountActions.js`
- `apps/frontend/src/views/AccountManagement.vue`

## Contract Clauses

### C-101 Batch refresh requires explicit valid scope
- Batch refresh invocation MUST include explicit non-empty selected account IDs.
- Empty or undefined selection MUST be rejected immediately with explicit error feedback.
- Invalid invocation MUST NOT send refresh network requests.

### C-102 Trigger sources map to explicit execution semantics
- `manual_force`, `relogin_success`, `cookie_upload_success`, `edit_success` MUST support validated freshness path.
- `timer_full` and `timer_exception` may follow existing cadence rules but must preserve status consistency.

### C-103 Post-operation completion is gated by validated writeback
- For account-affecting success operations, completion MUST be marked only after:
- validated refresh (`force=true`) succeeds, and
- updated account state is written to frontend store.

### C-104 User-visible state must match execution state
- Progress and status indicators MUST reflect the actual active refresh path.
- Completion message must not precede validated writeback completion.

## Verification Targets
- Invalid batch scope path fails early and issues no refresh request.
- Cookie-upload/edit success path completes only after validated writeback.
- UI state transitions remain coherent across single/batch/force flows.
