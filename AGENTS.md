# OmniPost Agent Execution Guide

## Default Target & Scope

- Default implementation target: `apps/backend-node` (Node.js/TypeScript).
- Shared types/constants/IDs must be imported from `@omni-post/shared`.

## Execution Workflow (Non-trivial Work)

All non-trivial tasks follow `Research -> Strategy -> Execution`:

1. Research current behavior and affected files.
2. Define a minimal implementation plan.
3. Implement in smallest safe increments.
4. Verify with tests/typecheck/lint relevant to changed scope.
5. Update docs when behavior or developer workflow changes.

## Editing Discipline

- Respect route-service-uploader boundaries in code changes.
- Keep long-running login/publish flows asynchronous; preserve observable task state semantics.
- Never introduce new `explicit any`.
- Use type-safe catch blocks: `catch (error: unknown)`.
- Do not return `null` from `void`-compatible return types unless type signature explicitly includes `null`.
- For external URL fetching logic, preserve SSRF protections (DNS resolution + private/local range blocking).
- Prefer safe path helpers (`utils/path.ts`) for filesystem operations.

## Validation Steps (Pre-completion)

Before claiming completion, record and verify:

1. Target area: `apps/backend-node` / `apps/frontend` / `packages/shared` / explicit legacy scope.
2. Whether shared types, platform mappings, DB schema, async task flow, or automation diagnostics changed.
3. Whether README or related docs require updates.
4. Test scope includes impacted route/service/store or equivalent affected area.
5. Run quality and coverage-oriented regression verification for impacted scope.

For backend or cross-cutting changes, run:

```bash
node tools/scripts/check-no-new-any.mjs --base main --head HEAD
npm run typecheck -w apps/backend-node
npm run check:workspace
npm run lint
npm run test
```

If package surface changed, also run:

```bash
npm audit --audit-level=high --omit=dev
```

## Working Commands

Node backend:

```bash
npm run install:node
npm run dev:node
npm run test:node
npm run lint:node
npm run db:init -w apps/backend-node
```

Frontend:

```bash
npm run install:frontend
npm run dev:frontend
npm run test:frontend
npm run lint:frontend
```

Monorepo:

```bash
npm run lint
npm run test
npm run clean
npm run check:workspace
npm run test -w packages/shared
```
