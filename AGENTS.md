# OmniPost Agent Execution Guide (AGENTS.md)

## Authority & Governance

This document defines the **operational protocol** for AI agents in the OmniPost repository. All actions must comply with the [OmniPost Constitution](.specify/memory/constitution.md), which holds absolute precedence over this guide.

- **Constitution**: Defines "Why" (Principles) and "What" (Constraints).
- **AGENTS.md**: Defines "How" (Workflows, Tools, and Protocols).

---

## Execution Workflow (Spec-Kit Protocol)

All non-trivial tasks follow the iterative **Research -> Strategy -> Execution** lifecycle, specifically designed to satisfy constitutional quality gates.

### 1. Research Phase
- **Map Context**: Use `grep_search` and `glob` to find relevant routes, services, and shared types.
- **Identify Dependencies**: Check for cross-package impacts in `@omni-post/shared` or monorepo workspace configurations.
- **Empirical Validation**: For bug fixes, reproduce the failure with a script or test before proposing a fix.

### 2. Strategy Phase (Spec/Plan/Tasks)
- **Draft Spec/Plan**: Update `.specify/spec.md` and `.specify/plan.md`.
- **Constitution Check**: Explicitly verify the plan against the 6 Core Principles (Node.js First, Boundaries, etc.).
- **Task Breakdown**: Create a dependency-ordered `tasks.md` with explicit validation steps for each task.

### 3. Execution Phase (Plan -> Act -> Validate)
- **Small Increments**: Apply surgical changes to one file or layer at a time.
- **TDD (Red-Green-Refactor)**: Write or update tests before or alongside implementation.
- **Validation**: Run the mandatory pre-completion script (see below) after each significant sub-task.

---

## Editing Discipline & Operational Patterns

These patterns ensure compliance with constitutional principles:

- **Layer Boundaries (P-II)**: Never put automation logic in routes; never handle Express `req/res` in uploaders.
- **SSOT Compliance (P-IV)**: Always check `@omni-post/shared/src/index.ts` before defining new interfaces or constants.
- **Async Safety (P-V)**: Ensure long-running tasks use the `task-service` for lifecycle management.
- **Type Safety**: 
    - Never use `explicit any`.
    - Use `catch (error: unknown)`.
    - Enforce strict return types (no implicit `null` for `void` promises).
- **Security**: 
    - Use `utils/path.ts` for all filesystem I/O.
    - Validate external URLs via `ExplorerService.validateUrl` pattern (SSRF protection).

---

## Validation & Quality Gates (Mandatory)

Before declaring a task "Complete", you MUST execute and record the output of:

### 1. Scope-Specific Verification
- **Backend-Node**: `npm run typecheck -w apps/backend-node`
- **Frontend**: `npm run lint:frontend`
- **Shared**: `npm run test -w packages/shared`

### 2. Full Regression Gate
For any change affecting the backend or shared package, run:

```bash
# 1. Check for new 'any' violations
node tools/scripts/check-no-new-any.mjs --base main --head HEAD

# 2. Strict Typecheck
npm run typecheck -w apps/backend-node

# 3. Workspace Integrity
npm run check:workspace

# 4. Standard Lint & Test
npm run lint
npm run test
```

### 3. Security Check (If package surface changed)
```bash
npm audit --audit-level=high --omit=dev
```

---

## Common Development Commands

| Target | Command |
| :--- | :--- |
| **Node Backend** | `npm run dev:node` / `npm run test:node` / `npm run lint:node` |
| **Frontend** | `npm run dev:frontend` / `npm run test:frontend` / `npm run lint:frontend` |
| **Database** | `npm run db:init -w apps/backend-node` |
| **Clean** | `npm run clean` |
