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
- **Empirical Validation**: For bug fixes, reproduce the failure with a script or test BEFORE implementation (Constitution Principle V).

### 2. Strategy Phase (Spec/Plan/Tasks)
- **Drafting**: Update `.specify/spec.md` and `.specify/plan.md`.
- **Mandatory Constitution Check**: Explicitly verify the plan against the **6 Core Principles** in the Constitution.
- **Taskification**: Create a dependency-ordered `tasks.md` with explicit validation steps.

### 3. Execution Phase (Plan -> Act -> Validate)
- **Small Batches**: Change one file or layer at a time.
- **TDD Requirement**: Write or update tests alongside implementation. Ensure Red-Green-Refactor cycle.
- **Pre-Completion Validation**: Run the mandatory verification scripts (see below).

---

## Engineering Standards (The "How")

### Layer Discipline (P-II)
- **Patterns**: Use `services/` for orchestration/business logic, `routes/` for HTTP validation, `uploader/` for platform-specific Playwright automation.
- **Anti-Patterns**: NEVER leak Express `req`/`res` objects into services or uploaders. No automation logic in routes.

### Type Safety & SSOT (P-IV)
- **Strict Typing**: 
    - NEVER use `explicit any` or `as any`.
    - Run `node tools/scripts/check-no-new-any.mjs` before finishing.
- **SSOT**: Always check `@omni-post/shared` (`packages/shared/src/index.ts`) before defining new constants.

### Async & Task Safety (P-V)
- **Lifecycle**: Long-running automation tasks MUST use the `task-service` for state management and recovery.
- **Progress**: Use SSE-style streaming for real-time progress reporting.

### Monorepo Integrity (P-VI)
- **Tooling**: Always use root workspace scripts (e.g., `npm run test`, `npm run lint`) rather than local subdirectory commands.
- **Cleanliness**: Use `npm run clean` to safely remove build artifacts.

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
| **Backend-Trace** | `npm run dev:node:trace` (Captures trace/debug console output to `apps/backend-node/logs/local-trace.log` for AI debugging) |
| **Frontend** | `npm run dev:frontend` / `npm run test:frontend` |
| **Shared** | `npm run test -w packages/shared` |
| **Cleaning** | `npm run clean` |

## Technical Stack
- **Backend**: Node.js 20+ (TypeScript 5.x, ESM, Express.js)
- **Frontend**: Vue 3 + Vite (Pinia, Element Plus)
- **Automation**: Playwright (Node.js version)
- **Database**: SQLite (via Knex/Objection)

## Recent Decisions
- **Deprecation**: Python code (Flask, pytest, pip) has been removed. No new Python dependencies are permitted.
- **Architecture**: Enforced monorepo structure with workspace isolation.

## Active Technologies
- Node.js 20+ (TypeScript 5.x) + `@opentelemetry/api`, `@opentelemetry/api-logs`, `@opentelemetry/sdk-node`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/sdk-logs`

## Recent Changes
- 036-add-opentelemetry: Added OpenTelemetry tracing + logs with OTel-native logger facade, removed Winston, and added `dev:node:trace` script for AI debugging.
