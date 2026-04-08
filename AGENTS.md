# OmniPost Agent Execution Guide

**Compliant with Constitution v2.3.0**

## Operational Mandate

This document defines the *How* of agent execution. All technical decisions and implementations must strictly adhere to the project principles defined in `.specify/memory/constitution.md`.

## Execution Workflow (Non-trivial Work)

All non-trivial tasks follow the iterative `Research -> Strategy -> Execution` lifecycle:

1. **Research**: Systematically map the codebase and validate assumptions.
2. **Strategy**: Formulate a grounded implementation plan and share a concise summary.
3. **Execution**: Resolve each sub-task through an iterative **Plan -> Act -> Validate** cycle.
   - **Plan**: Define the implementation approach and the testing strategy.
   - **Act**: Apply targeted changes.
   - **Validate**: Run tests and workspace standards to confirm success.

## Technical Discipline & Coding Patterns

### General Patterns
- **No Implicit Nulls**: Use empty `return;` for `Promise<void>` return types; do not return `null` unless explicitly in the type signature.
- **Type-Safe Error Handling**: Use `catch (error: unknown)` and validate error types before usage.
- **Strictly No 'any'**: Never introduce new `explicit any`. Use specific interfaces or `unknown` with type guards.
- **Path Safety**: Prefer safe path helpers (`utils/path.ts`) for all filesystem operations.

### Layer-Specific Guidelines
- **Routes**: Handle HTTP, request validation, and response formatting.
- **Services**: Coordinate business logic, task lifecycle, and state transitions.
- **Uploaders**: Isolate Playwright/OpenCLI automation. Perform root-cause analysis before selector repairs.

## Tooling & Verification Commands

### Quality Gates (Pre-push)
Before declaring a task complete, you MUST execute:

```bash
# 1. Incremental Any Check
node tools/scripts/check-no-new-any.mjs --base main --head HEAD
# 2. Strict Typecheck
npm run typecheck -w apps/backend-node
# 3. Workspace Integrity
npm run check:workspace
# 4. Lint & Test
npm run lint
npm run test
```

### Development Commands
- **Backend (Node)**: `npm run dev:node`, `npm run test:node`, `npm run lint:node`, `npm run db:init -w apps/backend-node`.
- **Frontend**: `npm run dev:frontend`, `npm run test:frontend`, `npm run lint:frontend`.
- **Shared**: `npm run test -w packages/shared`.

## Delegation & Sub-Agents

- **High-Volume/Repetitive Tasks**: Delegate to `@generalist`.
- **Architecture/Refactoring**: Delegate to `@codebase_investigator`.
- **Spec-Kit Workflow**: Use specialized `speckit-*` skills for planning and verification.
- **Session Memory**: Use `save_memory` for persistent project-wide facts.

## Governance Boundary

If an instruction in this document conflicts with the **OmniPost Constitution**, the Constitution takes absolute precedence.
