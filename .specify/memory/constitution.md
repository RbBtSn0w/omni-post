<!--
Sync Impact Report
- Version change: N/A → 1.0.0
- List of modified principles:
    - New: I. North Star Compliance
    - New: II. Layer Discipline (P-II)
    - New: III. Type Safety & SSOT (P-IV)
    - New: IV. Async & Task Safety (P-V)
    - New: V. Empirical Validation (TDD)
    - New: VI. Monorepo Integrity
- Added sections: Core Principles, Technical Stack & Anti-Patterns, Development Lifecycle & Quality Gates, Governance.
- Templates requiring updates:
    - .specify/templates/plan-template.md (✅ updated)
    - .specify/templates/spec-template.md (✅ updated)
    - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: None
-->

# OmniPost Constitution
<!-- OmniPost: Multi-platform content publishing automation engine -->

## Core Principles

### I. North Star Compliance
All repository actions MUST comply with this Constitution. It defines the "Why" (Principles) and "What" (Non-negotiable constraints). The `AGENTS.md` file defines the "How" (Workflows and Protocols). Compliance is verified at every architectural gate.

### II. Layer Discipline (P-II)
Strict separation of concerns is mandatory to maintain system modularity.
- **Services**: Contain all business and orchestration logic.
- **Routes**: Handle HTTP validation and response mapping only.
- **Uploaders**: Platform-specific automation via Playwright.
**Anti-Pattern**: NEVER leak Express `req`/`res` objects into uploaders or automation logic into routes.

### III. Type Safety & SSOT (P-IV)
The system maintains a Single Source of Truth (SSOT) via the `@omni-post/shared` package.
- **Strict Typing**: NEVER use `explicit any` or `as any`. All new code must pass `check-no-new-any.mjs`.
- **Constants**: Always check `packages/shared/src/index.ts` before defining new constants to prevent duplication.

### IV. Async & Task Safety (P-V)
Long-running automation tasks MUST be resilient and observable.
- **Lifecycle**: All long-running tasks MUST use the central `task-service` for state management and recovery.
- **Progress**: Use Server-Sent Events (SSE) style streaming for real-time progress reporting to the frontend.

### V. Empirical Validation (TDD)
No code is "done" without verification.
- **Bug Fixes**: MUST reproduce the failure with a script or test BEFORE implementation.
- **Features**: Write or update tests alongside implementation. Red-Green-Refactor is the expected cycle.

### VI. Monorepo Integrity
OmniPost operates as a strict monorepo workspace.
- **Tooling**: Always use root workspace scripts (e.g., `npm run test`, `npm run lint`) rather than local subdirectory commands.
- **Cleanliness**: Use `npm run clean` to remove build artifacts without touching `data/` or `.env`.

## Technical Stack & Anti-Patterns

### Primary Technologies
- **Backend**: Node.js 20+ (TypeScript 5.x, ESM, Express.js).
- **Frontend**: Vue 3 + Vite (Pinia, Element Plus).
- **Automation**: Playwright (Node.js version).
- **Database**: SQLite (via Knex/Objection or similar migrations).

### Removed/Prohibited
- **Python**: All Python code (Flask, pytest, pip) is deprecated and being removed. No new Python dependencies are permitted.
- **Global State**: Avoid global singletons; prefer dependency injection or service registration.

## Development Lifecycle & Quality Gates

### Workflow
1. **Research**: Context mapping and empirical failure reproduction.
2. **Strategy**: Draft Spec -> Plan -> Tasks with mandatory Constitution Check.
3. **Execution**: Plan-Act-Validate cycle in small, testable batches.

### Mandatory Verification Gates
| Scope | Command |
| :--- | :--- |
| **Integrity** | `npm run check:workspace` |
| **Type Check** | `npm run typecheck -w apps/backend-node` |
| **Safety** | `node tools/scripts/check-no-new-any.mjs --base main --head HEAD` |
| **Linting** | `npm run lint` |
| **Testing** | `npm run test` |

## Governance
The Constitution is the supreme governing document of the repository.

### Amendments
- Any change to core principles requires a MAJOR version bump.
- Adding new principles or material expansion requires a MINOR version bump.
- Clarifications or non-semantic wording fixes require a PATCH version bump.

### Compliance
All Pull Requests and architectural reviews must verify compliance against these principles. Complexity must be justified in implementation plans if it violates any principle.

**Version**: 1.0.0 | **Ratified**: 2026-04-09 | **Last Amended**: 2026-04-09
