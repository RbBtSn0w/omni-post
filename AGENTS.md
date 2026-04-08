# OmniPost Agent Execution Guide (AGENTS.md)

> **Memory Entry Point**: This is the first file any AI agent must read. It defines the operational protocol for working in this repository.

## Authority & Governance

1. **North Star**: All actions MUST comply with the [OmniPost Constitution](.specify/memory/constitution.md). 
2. **Two-Layer Governance**:
   - **Constitution**: Defines "Why" (Principles) and "What" (Non-negotiable constraints).
   - **AGENTS.md** (This file): Defines "How" (Workflows, Tools, and Protocols).

---

## Operational Workflow: Spec-Kit Protocol

All non-trivial tasks MUST follow this iterative lifecycle to satisfy constitutional quality gates.

### 1. Research Phase
- **Context Mapping**: Use `grep_search` and `glob` to map routes, services, and types.
- **Empirical Validation**: For bug fixes, reproduce the failure with a script or test BEFORE implementation.

### 2. Strategy Phase (Spec/Plan/Tasks)
- **Drafting**: Update `.specify/spec.md` and `.specify/plan.md`.
- **Mandatory Constitution Check**: Explicitly verify the plan against the 6 Core Principles.
- **Taskification**: Create a dependency-ordered `tasks.md` with explicit validation steps.

### 3. Execution Phase (Plan -> Act -> Validate)
- **Small Batches**: Change one file or layer at a time.
- **TDD Requirement**: Write or update tests alongside implementation.
- **Pre-Completion Validation**: Run the mandatory verification scripts (see below).

---

## Engineering Standards (The "How")

### Layer Discipline (P-II)
- **Patterns**: Use `services/` for logic, `routes/` for validation, `uploader/` for automation.
- **Anti-Patterns**: No Express `req/res` in uploaders; no automation logic in routes.

### Type Safety & SSOT (P-IV)
- **Strict Typing**: 
    - NEVER use `explicit any` or `as any`.
    - Run `node tools/scripts/check-no-new-any.mjs` before finishing.
- **SSOT**: Always check `@omni-post/shared/src/index.ts` before defining new constants.

### Async Safety (P-V)
- **Lifecycle**: Long-running tasks MUST use the `task-service` for state management.
- **Patterns**: Use SSE-style streaming for real-time progress.

---

## Validation Gates & Commands

Before declaring a task "Complete", you MUST execute and record:

| Scope | Command |
| :--- | :--- |
| **Integrity** | `npm run check:workspace` |
| **Type Check** | `npm run typecheck -w apps/backend-node` |
| **Safety** | `node tools/scripts/check-no-new-any.mjs --base main --head HEAD` |
| **Linting** | `npm run lint` |
| **Testing** | `npm run test` |

---

## Standard Development Entry Points

| Target | Command |
| :--- | :--- |
| **Backend-Node** | `npm run dev:node` / `npm run test:node` |
| **Frontend** | `npm run dev:frontend` / `npm run test:frontend` |
| **Shared** | `npm run test -w packages/shared` |
| **Cleaning** | `npm run clean` |
