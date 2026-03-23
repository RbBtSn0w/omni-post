# Data Model: Refresh and Upload Flow Hardening

No database schema changes are introduced. This feature formalizes runtime decision entities for fail-fast behavior and deterministic completion.

## Entities

### 1. PublishReadinessState
Represents pre-submit publish control status.

**Fields**:
- `text`: publish control visible text.
- `disabled`: disabled snapshot.
- `ariaDisabled`: aria-disabled snapshot.
- `className`: class snapshot.
- `isReady`: derived readiness decision.
- `reason`: `ready | disabled | blocked_text | transitional_text | unknown`.

**Validation Rules**:
- If text matches blocked/transitional set, `isReady=false`.
- If disabled signal active, `isReady=false`.
- Submission allowed only when `isReady=true`.

### 2. UploadProbeOutcome
Represents upload-start probing result.

**Fields**:
- `kind`: `started | timeout | runtime_failure`.
- `elapsedMs`: probing elapsed time.
- `diagnostic`: optional structured payload for runtime failure.

**Validation Rules**:
- `runtime_failure` MUST include structured diagnostic fields: `phase`, `errorType`, `message`, `accountOrTaskId`.
- `runtime_failure` is terminal and MUST NOT transition to retry/fallback continuation.

### 3. AccountRefreshTrigger
Represents refresh execution request context.

**Fields**:
- `source`: `single | batch | manual_force | timer_full | timer_exception | relogin_success | cookie_upload_success | edit_success`.
- `scope`: `singleId | selectedIds[] | all`.
- `requiresValidatedFreshness`: boolean.
- `isValid`: boolean.

**Validation Rules**:
- `batch` source requires non-empty `selectedIds[]`.
- Invalid trigger (`isValid=false`) must exit with explicit error.

### 4. AccountFreshnessWindow
Represents freshness completion status after account-affecting operations.

**Fields**:
- `operation`: `cookie_upload | account_edit | relogin`.
- `mutationSucceededAt`: timestamp.
- `validatedRefreshSucceededAt`: timestamp.
- `storeWriteCompletedAt`: timestamp.
- `isComplete`: derived boolean.

**Validation Rules**:
- `isComplete=true` only when validated refresh success and store write are both confirmed.

## State Transitions

### Publish readiness
`observed` -> `blocked` | `ready`
`blocked` -> `ready` only after state update indicates true readiness.

### Upload probing
`probing` -> `started` (success)
`probing` -> `timeout` (business timeout)
`probing` -> `runtime_failure` (terminal fail-fast)

### Batch refresh trigger
`triggered` -> `validated_scope` -> `refreshing`
`triggered` -> `invalid_scope_rejected` (terminal)

### Post-operation freshness
`mutation_success` -> `validated_refresh_success` -> `store_write_done` -> `complete`
