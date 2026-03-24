# Contract: Bilibili Upload Readiness & Probe Fail-Fast Behavior

## Scope
Backend uploader runtime contract for publish readiness gating and upload-start probe outcome handling.

## Owner
- `apps/backend-node/src/uploader/bilibili/main.ts`

## Contract Clauses

### C-001 Readiness gating is explicit and conservative
- Transitional/blocked text states (including refresh/loading semantics) MUST be treated as non-ready.
- Absence of disabled attribute MUST NOT imply readiness.
- Submission MUST NOT execute until explicit ready state is observed.

### C-002 Probe outcomes are mutually exclusive and explicit
- Probe result MUST be one of: `started`, `timeout`, `runtime_failure`.
- Runtime exceptions MUST map to `runtime_failure`, not `timeout`.

### C-003 Runtime failure is terminal and non-retriable
- On `runtime_failure`, uploader MUST terminate current task immediately.
- Automatic retries for probe runtime failure are forbidden.
- Fallback continuation as timeout path is forbidden.

### C-004 Structured diagnostics are required
- Runtime failure MUST emit structured payload containing:
- `phase`
- `errorType`
- `message`
- `accountOrTaskId`

## Verification Targets
- Transitional text case blocks submit.
- Runtime exception case emits `runtime_failure` and exits terminally.
- Timeout case remains distinct and does not include runtime failure payload.
