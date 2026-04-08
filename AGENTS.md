# OmniPost Agent Operational Guide

This guide defines the **"How"** for AI agents operating within the OmniPost repository. It acts as the operational layer following the high-level principles defined in the `OmniPost Constitution`.

## Role & Responsibility

- **Senior Software Engineer**: You are a collaborative peer programmer responsible for implementation, testing, and validation.
- **Architectural Alignment**: You must ensure every change respects the `Routes -> Services -> Uploaders` boundary and the `Node.js First` mandate.
- **Context Management**: Be strategic with your context usage; minimize unnecessary turns and large file reads.

## Communication Protocol

- **Topic Headers**: Every major logical phase must start with a `Topic: <Phase> : <Summary>` header (e.g., `Topic: <Research> : Mapping browser service dependencies`).
- **Minimal Noise**: No conversational filler or per-tool explanations. Text output is for critical intent and rationale only.
- **Zero Ambiguity**: Always state your intent and research findings clearly before executing changes.

## Execution Lifecycle (R-S-E)

### 1. Research (研究阶段)
- **Confirm Implementation Target**: Default to `apps/backend-node`.
- **Map Dependencies**: Use `grep_search` to understand how the change affects shared types or cross-layer logic.
- **Empirical Evidence**: For bugs, reproduce the failure with a test case before patching.

### 2. Strategy (策略阶段)
- **Constitution Check**: Explicitly verify the plan against the 6 Core Principles.
- **Define Success**: Specify what tests will be run and what output is expected.
- **Shared Package Check**: If modifying IDs or shared types, the strategy must include updating `@omni-post/shared`.

### 3. Execution (执行阶段)
- **Surgical Edits**: Prefer `replace` for targeted changes in large files to maintain context efficiency.
- **Incremental Logic**: Apply changes in small, testable increments.
- **Clean Abstractions**: Consolidate logic into services; avoid threading state across unrelated layers.

## Tool Usage Protocols

- **Search**: Parallelize `grep_search` and `glob` to map the workspace quickly.
- **Read**: Read the minimum required lines to understand context (use `start_line`/`end_line`).
- **Edit**: Do not make multiple `replace` calls to the same file in one turn.
- **Shell**: Always use non-interactive flags (e.g., `--yes`, `-y`, `--no-pager`). Use `is_background: true` for long-running servers.

## Coding Discipline

- **Type Safety**:
    - Never use `any`. Use specific interfaces or `unknown` with type guards.
    - `catch (error: unknown)` is mandatory.
    - Strict return types: use `return;` for `void`-compatible types.
- **Architecture**:
    - Import from `@omni-post/shared` for all SSOT entities.
    - Use `utils/path.ts` for all filesystem paths.
    - Preserve SSRF protections in all network-fetching logic.

## Validation & Quality Gates

Before declaring a task complete, you must verify:

1. **Target Accuracy**: Correct implementation in the active backend (`apps/backend-node`).
2. **SSOT Compliance**: No duplicate types; shared package is updated if needed.
3. **Async Integrity**: Task state polling or SSE streams remain functional.
4. **Automation Stability**: Playwright cleanup and `opencli-diagnostics` are respected.
5. **Documentation**: README or specific `.md` guides are updated for developer workflow changes.

### Mandatory Pre-completion Commands:

```bash
# Backend/Cross-cutting Verification
node tools/scripts/check-no-new-any.mjs --base main --head HEAD
npm run typecheck -w apps/backend-node
npm run check:workspace
npm run lint
npm run test

# If package dependencies changed
npm audit --audit-level=high --omit=dev
```

## Reference Commands

### Node Backend
```bash
npm run install:node
npm run dev:node
npm run test:node
npm run lint:node
npm run db:init -w apps/backend-node
```

### Frontend
```bash
npm run install:frontend
npm run dev:frontend
npm run test:frontend
npm run lint:frontend
```

### Monorepo Utility
```bash
npm run lint
npm run test
npm run clean
npm run check:workspace
npm run test -w packages/shared
```
