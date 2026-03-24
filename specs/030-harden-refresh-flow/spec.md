# Feature Specification: Refresh and Upload Flow Hardening

**Feature Branch**: `[030-harden-refresh-flow]`
**Created**: 2026-03-23
**Status**: completed
**Input**: User description: "结合流程图逻辑, 和code review的相关结论, 总结下, 是否存在问题, 直接回答问题在哪里。并将问题沉淀为可执行需求。"

## Clarifications

### Session 2026-03-23

- Q: 上传探测出现 runtime_failure 时的处理策略是什么？ → A: 立即失败并终止当前发布任务，不做自动重试。
- Q: runtime_failure 的诊断输出粒度是什么？ → A: 输出结构化字段（phase/errorType/message/account 或任务标识）并终止流程。
- Q: 账号变更后的强一致刷新完成判定是什么？ → A: 以 `force=true` 的有效账号刷新成功并写回 store 为完成判定，再给最终成功提示。
- Q: 批量刷新入参无效（空/undefined）时应如何处理？ → A: 立即失败并中止执行，不触发任何刷新请求。
- Q: 发布按钮中间态文案应如何匹配？ → A: 使用可扩展的明确阻断词集合统一判定（包含刷新中/加载中等语义）。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prevent Premature Publish During Transitional States (Priority: P1)

As an operator publishing to a platform, I need the system to block submission while the platform is still in transitional states (such as refreshing/loading), so that publishing is not triggered before the platform is truly ready.

**Why this priority**: Premature submission can silently fail and directly break the core publishing flow.

**Independent Test**: Can be fully tested by simulating a platform submit control in transitional text states and verifying that no publish submission is triggered until ready state is reached.

**Acceptance Scenarios**:

1. **Given** a publish control displays a transitional state, **When** publish readiness is evaluated, **Then** the control is treated as not ready and submission is blocked.
2. **Given** a publish control is not disabled but displays a transitional state text, **When** submission is attempted, **Then** the system must not trigger publish submission.
3. **Given** a publish control is in a confirmed ready state, **When** submission is attempted, **Then** the system proceeds with submission.

---

### User Story 2 - Expose Real Upload Probe Failures Immediately (Priority: P1)

As an operator, I need unexpected runtime failures in upload-start probing to fail immediately with explicit error context, so that diagnosis is accurate and does not appear as generic timeout.

**Why this priority**: Silent exception swallowing hides root causes and increases MTTR for production incidents.

**Independent Test**: Can be fully tested by forcing probe runtime failures (e.g., closed page context) and verifying the flow fails at probe stage with explicit error classification, without entering misleading fallback timeout behavior.

**Acceptance Scenarios**:

1. **Given** upload-start probe encounters an unexpected runtime error, **When** probe executes, **Then** the flow fails fast and surfaces the real error reason.
2. **Given** probe only observes normal business timeout without runtime crash, **When** timeout occurs, **Then** timeout is reported as timeout and remains distinguishable from runtime crash.
3. **Given** probe fails due to runtime error, **When** failure is emitted, **Then** downstream fallback injection does not continue as if probe simply timed out.

---

### User Story 3 - Keep Account Refresh Trigger Paths Consistent (Priority: P2)

As an account-management user, I need every refresh trigger path to execute with correct parameters and explicit scope, so that batch actions do not fail at runtime and refresh behavior is predictable.

**Why this priority**: Parameter mismatch in batch refresh creates runtime breakage in high-frequency maintenance operations.

**Independent Test**: Can be fully tested by triggering each refresh entry point (single, batch, auto, force) and verifying no runtime parameter errors occur and intended account scope is refreshed.

**Acceptance Scenarios**:

1. **Given** user selects accounts and triggers batch refresh, **When** action is invoked, **Then** selected account list is passed correctly and batch refresh completes without parameter-related runtime error.
2. **Given** batch relogin reuses batch refresh capability, **When** action runs, **Then** the same selected scope is refreshed and no empty-parameter call occurs.
3. **Given** account refresh state is displayed in UI, **When** refresh is in progress, **Then** all action states remain consistent with real execution progress.

---

### User Story 4 - Ensure Post-Operation Account State Freshness (Priority: P2)

As an account-management user, I need successful account-affecting operations to immediately reflect validated latest status, so that UI does not show stale account health after success messages.

**Why this priority**: Success followed by stale status reduces trust and causes repeated manual refresh attempts.

**Independent Test**: Can be fully tested by performing account-affecting operations and confirming account status is updated to latest validated state within one refresh cycle, without waiting for long cache expiry.

**Acceptance Scenarios**:

1. **Given** a cookie upload succeeds, **When** operation completes, **Then** account list is refreshed with validated latest status.
2. **Given** account edit succeeds, **When** operation completes, **Then** account and group data visible in UI is updated without stale state gap.
3. **Given** operation success toast is shown, **When** user inspects account status immediately, **Then** displayed state matches the latest validated backend view.

### Edge Cases

- What happens when a platform button text changes but still indicates a transitional state?
- How does the system handle probe failure caused by transient network interruption versus hard runtime context loss?
- What happens when a batch refresh is triggered with an empty selection due to stale UI selection state?
- How does the system behave when two refresh triggers fire within a short interval and one is force refresh?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST treat transitional publish-control states (including refresh/loading semantics) as blocked states and MUST prevent publish submission while such states are active.
- **FR-002**: System MUST distinguish publish-control transitional state from ready state using explicit, testable readiness rules.
- **FR-003**: System MUST fail fast for unexpected runtime errors during upload-start probing and MUST preserve root-cause visibility in emitted error results.
- **FR-004**: System MUST classify business timeout and runtime failure as different failure categories, and MUST report them distinctly.
- **FR-005**: System MUST prevent fallback execution paths from continuing after a confirmed runtime-failure condition in upload-start probing.
- **FR-010**: System MUST NOT automatically retry upload-start probing after a confirmed runtime-failure condition; it MUST terminate the current publish task immediately with explicit failure reason.
- **FR-011**: System MUST emit structured runtime-failure diagnostics including `phase`, `errorType`, `message`, and account/task identifier before terminating the publish task.
- **FR-012**: System MUST treat post-operation account synchronization as complete only after validated refresh (`force=true`) succeeds and updated account state is written to frontend store.
- **FR-013**: System MUST reject invalid batch refresh invocations (empty or undefined selected scope) with explicit error feedback and MUST NOT trigger any refresh request.
- **FR-014**: System MUST evaluate publish transitional states using a centralized, explicit, extensible blocked-text set (including refresh/loading semantics) rather than disabled-only checks.
- **FR-006**: System MUST ensure batch refresh invocation always receives explicit target account scope and MUST reject or guard invalid empty-parameter invocation paths.
- **FR-007**: System MUST ensure account-affecting successful operations (including cookie update and account edit) trigger an immediate validated refresh path rather than a potentially stale cached-only path.
- **FR-008**: System MUST keep account refresh progress and status representation consistent with actual refresh execution state across single, batch, automatic, and force refresh triggers.
- **FR-009**: System MUST provide deterministic post-operation freshness behavior so that users can observe updated account status immediately after operation success.

### Constitution Alignment *(mandatory)*

- **CA-001**: Default implementation scope is `apps/backend-node` (publish/upload probing and state classification) and `apps/frontend` (account refresh trigger paths and post-operation refresh consistency).
- **CA-002**: No new platform ID or shared entity is introduced; existing `@omni-post/shared` exports remain authoritative and unchanged for this feature.
- **CA-003**: The feature affects upload/probe state flow and account refresh feedback flow. Backend must emit explicit failure categories; frontend must reflect accurate refresh state and invoke consistent refresh actions after account-affecting operations.
- **CA-004**: Playwright automation behavior changes are constrained to evidence-backed readiness and probe-failure handling from current regression findings; no unrelated platform logic changes are in scope.
- **CA-005**: Documentation updates required: this spec and downstream plan/tasks for feature `030-harden-refresh-flow`. Other documentation updates: `None`.

### Key Entities *(include if feature involves data)*

- **Publish Readiness State**: Represents current publish control state observed before submission; includes ready, transitional, and blocked semantics.
- **Upload Probe Outcome**: Represents result of upload-start detection; includes success, business-timeout, and runtime-failure categories.
- **Account Refresh Trigger**: Represents a refresh initiation event; includes source (manual, automatic, batch, force, post-operation), scope, and invocation validity.
- **Account Freshness Window**: Represents whether UI account state reflects the latest validated backend state after account-affecting operations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In regression tests covering transitional publish states, 100% of transitional-state samples are blocked from submission until ready state is confirmed.
- **SC-002**: In fault-injection tests for upload-start probe runtime failures, 100% of injected runtime failures are surfaced as explicit runtime failure results, not generic timeout.
- **SC-003**: In batch refresh flow tests, 100% of supported batch entry points execute without parameter-mismatch runtime errors.
- **SC-004**: After successful account-affecting operations, latest validated account status is visible to users within one refresh cycle in at least 95% of test runs.

## Assumptions

- Transitional publish states can be identified through stable user-visible state signals (text or equivalent semantic state markers).
- Existing observability channels are sufficient to expose explicit error categories without adding new external monitoring systems.
- Current account refresh architecture (single, batch, timed, force) remains in place; this feature hardens behavior consistency rather than redesigning the architecture.
