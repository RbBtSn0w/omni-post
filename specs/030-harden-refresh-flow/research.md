# Phase 0: Research & Clarifications - Refresh and Upload Flow Hardening

## Decision: Transitional publish states use centralized blocked-text set
**Decision:** Use a centralized, explicit, extensible blocked-text set to classify non-ready publish states (including refresh/loading semantics).
**Rationale:** Prevents permissive false-ready behavior and supports deterministic regression assertions when platform text variants evolve.
**Alternatives considered:**
- Disabled-only checks: rejected due to false-ready states when attributes lag behind UI text.
- Ad-hoc regex patches: rejected because maintainability and diagnosability degrade over time.

## Decision: Runtime probe failures are terminal, no auto-retry
**Decision:** Any upload-start probe `runtime_failure` immediately terminates the publish task without automatic retry.
**Rationale:** Aligns with fail-fast-loud; prevents runtime crashes from being masked as timeout and avoids misleading downstream actions.
**Alternatives considered:**
- Single retry then fail: rejected due to ambiguity and increased incident variance.
- Convert to timeout and continue: rejected as silent failure masking.

## Decision: Runtime failure diagnostics are structured
**Decision:** Emit structured diagnostics containing `phase`, `errorType`, `message`, and account/task identifier on runtime failure.
**Rationale:** Ensures rapid root-cause identification and stable test assertions.
**Alternatives considered:**
- Message-only logs: rejected due to weak queryability and unstable diagnostics.
- No additional diagnostics: rejected because incident triage becomes slow and inconsistent.

## Decision: Invalid batch refresh scope is hard-rejected
**Decision:** Batch refresh with empty/undefined selection is rejected immediately with explicit error feedback; no refresh request is sent.
**Rationale:** Eliminates silent no-op behavior and prevents hidden state drift.
**Alternatives considered:**
- Auto-fallback to full refresh: rejected as scope escalation risk.
- Silent ignore: rejected as non-deterministic UX and low observability.

## Decision: Post-operation freshness completion requires validated writeback
**Decision:** Account-affecting operation completion is acknowledged only after `force=true` validated refresh succeeds and updated state is written to store.
**Rationale:** Removes "operation success but stale view" inconsistency and creates explicit DoD signal.
**Alternatives considered:**
- Mark complete at mutation API success: rejected because freshness remains uncertain.
- Eventual consistency via timer refresh: rejected due to delayed and variable correctness.
